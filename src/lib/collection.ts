import { CardData, CollectionCard, DeckList } from "@/types/card-types";

type MergeOptions = {
  /** Normalize names before comparing (e.g., case-insensitive). */
  normalizer?: (name: string) => string;
  /** Sort result; default keeps first-seen order. */
  sortBy?: "none" | "alpha" | "qtyDesc";
};

export function mergeDeckLists(
  decks: DeckList[],
  options: MergeOptions = { sortBy: "none" }
): CollectionCard[] {
  const normalize =
    options.normalizer ?? ((s: string) => s); // default: exact match

  const order: string[] = []; // keep stable first-seen order
  const map = new Map<string, CollectionCard>();

  for (const deck of decks) {
    for (const part of [deck.main, deck.extra, deck.side]) {
      for (const card of part) {
        const key = normalize(card.name);
        const qty = card.quantity ?? 0;

        if (!map.has(key)) {
          map.set(key, { ...card, quantity: 0 });
          order.push(key);
        }
        map.get(key)!.quantity += qty;
      }
    }
  }

  let result = order.map((k) => map.get(k)!);

  switch (options.sortBy ?? "none") {
    case "alpha":
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "qtyDesc":
      result = [...result].sort((a, b) => b.quantity - a.quantity);
      break;
  }

  return result;
}

export function attachQuantities(
  ids: (number | string)[],
  cards: CardData[]
): CollectionCard[] {
  // Count IDs and remember first-seen order
  const counts = new Map<number, number>();
  const order: number[] = [];
  for (const raw of ids) {
    const id = typeof raw === "string" ? Number(raw) : raw;
    if (!Number.isFinite(id)) continue;
    if (!counts.has(id)) order.push(id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  // Lookup cards by id
  const byId = new Map(cards.map((c) => [c.id, c]));

  // Build result in ID order, only for ids that exist in `cards`
  const result: CollectionCard[] = [];
  for (const id of order) {
    const card = byId.get(id);
    const qty = counts.get(id);
    if (card && qty) result.push({ ...card, quantity: qty, owned: false });
  }
  return result;
}