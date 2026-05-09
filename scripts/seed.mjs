import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const eq = line.indexOf("=");
    if (eq === -1) {
      continue;
    }

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const envPath = path.resolve(process.cwd(), ".env.local");
loadEnvFile(envPath);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in .env.local",
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

faker.seed(20260426);

const USER_COUNT = 10;
const DECK_COUNT = 20;
const CARDS_PER_DECK = 10;
const DOCS_PER_USER_MIN = 1;
const DOCS_PER_USER_MAX = 3;
const EVENTS_COUNT = 35;

const SEED_EMAIL_DOMAIN = "recall-seed.local";

function seedEmail(i) {
  const n = String(i).padStart(2, "0");
  return `faker_user_${n}@${SEED_EMAIL_DOMAIN}`;
}

function capitalizeFirst(text) {
  if (!text) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Remove previous seed rows (domain-scoped emails). */
async function wipeSeedUsers() {
  const { data: rows, error: selErr } = await supabase
    .from("users")
    .select("id")
    .like("email", `%@${SEED_EMAIL_DOMAIN}`);

  if (selErr) {
    throw selErr;
  }
  const ids = (rows ?? []).map((r) => r.id);
  if (ids.length === 0) {
    return;
  }
  const { error: delErr } = await supabase.from("users").delete().in("id", ids);
  if (delErr) {
    throw delErr;
  }
}

async function seedUsersProfilesSubscriptions() {
  const userIds = [];

  for (let i = 1; i <= USER_COUNT; i += 1) {
    const email = seedEmail(i);
    const { data: userRow, error: insUserErr } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: `seed_unused_${faker.string.alphanumeric(48)}`,
      })
      .select("id")
      .single();

    if (insUserErr || !userRow?.id) {
      throw insUserErr ?? new Error(`Failed to insert user ${email}`);
    }

    const id = userRow.id;
    userIds.push(id);

    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const dob = faker.date
      .birthdate({ min: 18, max: 62, mode: "age" })
      .toISOString()
      .slice(0, 10);

    const { error: profErr } = await supabase.from("profiles").insert({
      user_id: id,
      username: faker.internet.username({ firstName, lastName }).slice(0, 32),
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dob,
      bio: faker.person.bio(),
      avatar_url: faker.image.avatarGitHub(),
    });
    if (profErr) {
      throw profErr;
    }

    const { error: subErr } = await supabase.from("subscriptions").insert({
      user_id: id,
      plan: faker.helpers.arrayElement(["free", "pro"]),
    });
    if (subErr) {
      throw subErr;
    }
  }

  return userIds;
}

async function seedDocuments(userIds) {
  const rows = [];
  for (const uid of userIds) {
    const n = faker.number.int({
      min: DOCS_PER_USER_MIN,
      max: DOCS_PER_USER_MAX,
    });
    for (let j = 0; j < n; j += 1) {
      rows.push({
        user_id: uid,
        title: capitalizeFirst(
          faker.helpers.arrayElement([
            `${faker.hacker.adjective()} ${faker.hacker.noun()} notes`,
            `Study guide: ${faker.company.catchPhrase()}`,
            `${faker.science.chemicalElement().name} cheat sheet`,
            `Interview prep — ${faker.person.jobTitle()}`,
          ]),
        ),
        body: faker.lorem.paragraphs({ min: 2, max: 5 }, "\n\n"),
      });
    }
  }
  const { data, error } = await supabase.from("documents").insert(rows).select("id");
  if (error) {
    throw error;
  }
  return (data ?? []).map((d) => d.id);
}

async function seedDecksAndCards(userIds) {
  const topicHints = [
    () => faker.science.chemicalElement().name,
    () => faker.location.country(),
    () => faker.hacker.noun(),
    () => faker.company.buzzNoun(),
    () => faker.music.genre(),
  ];

  const decksPayload = Array.from({ length: DECK_COUNT }, (_, idx) => {
    const user_id = faker.helpers.arrayElement(userIds);
    const topic = faker.helpers.arrayElement(topicHints)();
    return {
      user_id,
      title: capitalizeFirst(
        `${faker.word.adjective()} ${topic} — ${faker.word.noun()}`,
      ).slice(0, 512),
      description: [
        faker.company.catchPhrase(),
        faker.lorem.sentence({ min: 8, max: 14 }),
      ].join(" "),
      is_public: faker.datatype.boolean({ probability: 0.42 }),
    };
  });

  const { data: decks, error: dErr } = await supabase
    .from("decks")
    .insert(decksPayload)
    .select("id");
  if (dErr) {
    throw dErr;
  }

  const cardsPayload = [];
  for (const deck of decks ?? []) {
    for (let pos = 0; pos < CARDS_PER_DECK; pos += 1) {
      const kind = faker.helpers.arrayElement(["qa", "term", "code"]);
      let front;
      let back;
      if (kind === "qa") {
        front = capitalizeFirst(faker.hacker.phrase()) + "?";
        back = faker.lorem.paragraph({ min: 1, max: 2 });
      } else if (kind === "term") {
        front = faker.company.buzzPhrase();
        back = faker.lorem.sentences({ min: 2, max: 4 });
      } else {
        front = `What does \`${faker.hacker.abbreviation()}\` mean here?`;
        back = `${faker.hacker.phrase()} (${faker.git.commitMessage()})`;
      }
      cardsPayload.push({
        deck_id: deck.id,
        front,
        back,
        position: pos,
      });
    }
  }

  const { error: cErr } = await supabase.from("cards").insert(cardsPayload);
  if (cErr) {
    throw cErr;
  }

  return { decksInserted: (decks ?? []).length, cardsInserted: cardsPayload.length };
}

async function seedEmbeddingsSample(documentIds, userIds) {
  if (documentIds.length === 0) {
    return 0;
  }
  const { data: cards, error: cErr } = await supabase
    .from("cards")
    .select("id")
    .limit(24);
  if (cErr) {
    throw cErr;
  }
  const cardIds = (cards ?? []).map((c) => c.id);
  const dim = 1536;
  const zero = Array(dim).fill(0);

  const rows = [];
  const docPick = faker.helpers.arrayElements(
    documentIds,
    Math.min(8, documentIds.length),
  );
  for (const docId of docPick) {
    rows.push({
      document_id: docId,
      card_id: null,
      embedding: zero,
      model: "seed-zero-vector",
    });
  }
  const cardPick = faker.helpers.arrayElements(
    cardIds,
    Math.min(8, cardIds.length),
  );
  for (const cardId of cardPick) {
    rows.push({
      document_id: null,
      card_id: cardId,
      embedding: zero,
      model: "seed-zero-vector",
    });
  }

  if (rows.length === 0) {
    return 0;
  }
  const { error } = await supabase.from("embeddings").insert(rows);
  if (error) {
    throw error;
  }
  return rows.length;
}

async function seedEvents(userIds) {
  const types = [
    "deck.created",
    "deck.viewed",
    "card.flipped",
    "profile.updated",
    "document.uploaded",
  ];
  const rows = [];
  for (let i = 0; i < EVENTS_COUNT; i += 1) {
    const withUser = faker.datatype.boolean({ probability: 0.88 });
    rows.push({
      user_id: withUser ? faker.helpers.arrayElement(userIds) : null,
      event_type: faker.helpers.arrayElement(types),
      metadata: {
        source: "faker-seed",
        label: faker.hacker.ingverb(),
        score: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
      },
    });
  }
  const { error } = await supabase.from("events").insert(rows);
  if (error) {
    throw error;
  }
  return rows.length;
}

async function main() {
  console.log("Seeding public.users, profiles, subscriptions, documents, decks, cards, embeddings (sample), events…");

  await wipeSeedUsers();
  const userIds = await seedUsersProfilesSubscriptions();
  const documentIds = await seedDocuments(userIds);
  const { decksInserted, cardsInserted } = await seedDecksAndCards(userIds);
  const embCount = await seedEmbeddingsSample(documentIds, userIds);
  const evCount = await seedEvents(userIds);

  console.log(`Seed complete:
- users inserted: ${userIds.length}
- documents inserted: ${documentIds.length}
- decks inserted: ${decksInserted}
- cards inserted: ${cardsInserted}
- embeddings inserted (zero-vector sample): ${embCount}
- events inserted: ${evCount}`);
}

main().catch((err) => {
  console.error("Seed failed:");
  console.error(err);
  process.exit(1);
});
