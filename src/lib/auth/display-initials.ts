export function displayInitials(name: string): string {
  const base = name.includes("@") ? (name.split("@")[0] ?? name) : name;
  const cleaned = base.replace(/[^a-zA-Z0-9]/g, "");
  return (cleaned.slice(0, 2) || "U").toUpperCase();
}
