type DeckStudyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DeckStudyPage({ params }: DeckStudyPageProps) {
  const { id } = await params;
  return <div>Decks [{id}]</div>;
}
