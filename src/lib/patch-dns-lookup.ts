import dns from "node:dns";

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | dns.LookupAddress[],
  family?: number,
) => void;

/**
 * macOS can return ENOTFOUND from getaddrinfo while dns.resolve4 still works
 * (router/VPN DNS quirk). Node fetch uses getaddrinfo, so Supabase calls fail.
 * Fall back to resolve4 when the system lookup misses a real hostname.
 */
const systemLookup = dns.lookup;

function fallbackLookup(
  hostname: string,
  options: dns.LookupOptions | LookupCallback,
  callback?: LookupCallback,
) {
  let opts: dns.LookupOptions;
  let cb: LookupCallback;

  if (typeof options === "function") {
    cb = options;
    opts = {};
  } else {
    opts = options ?? {};
    cb = callback!;
  }

  systemLookup(hostname, opts, (err, address, family) => {
    if (!err) {
      cb(null, address, family);
      return;
    }

    if (err.code !== "ENOTFOUND" && err.code !== "EAI_AGAIN") {
      cb(err, "", 0);
      return;
    }

    dns.resolve4(hostname, (resolveErr, addresses) => {
      if (resolveErr || addresses.length === 0) {
        cb(err, "", 0);
        return;
      }

      if (opts.all) {
        cb(
          null,
          addresses.map((addr) => ({ address: addr, family: 4 as const })),
        );
        return;
      }

      cb(null, addresses[0], 4);
    });
  });
}

dns.lookup = fallbackLookup as typeof dns.lookup;
