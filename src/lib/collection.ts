import { CardData, CollectionCard, DeckList, CollectionData } from "@/types/card-types";

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

export interface ComparisonResult {
  missingCards: CollectionCard[];
  ownedCards: CollectionCard[];
  totalMissingValue: number;
  statistics: {
    total: number;
    totalNeeded: number;
    totalOwned: number;
    completionPercentage: number;
  };
}

/**
 * Compare deck requirements with user's collection to find missing cards
 */
export function compareCollectionWithDecks(
  collection: CollectionData | null,
  deckLists: DeckList[]
): ComparisonResult {
  // Merge all deck lists into a single required cards list
  const requiredCards = mergeDeckLists(deckLists, {
    normalizer: (name) => name.toLowerCase().trim(),
    // sortBy: "alpha"
  });

  // If no collection, all cards are missing
  if (!collection || !collection.cards.length) {
    return {
      missingCards: requiredCards.map(card => ({ ...card, owned: false })),
      ownedCards: [],
      totalMissingValue: calculateTotalValue(requiredCards),
      statistics: {
        total: requiredCards.reduce((sum, card) => sum + card.quantity, 0),
        totalNeeded: requiredCards.reduce((sum, card) => sum + card.quantity, 0),
        totalOwned: 0,
        completionPercentage: 0
      }
    };
  }

  // Create a map of owned cards for quick lookup
  const ownedCardsMap = new Map<string, CollectionCard>();
  collection.cards.forEach(card => {
    const normalizedName = card.name.toLowerCase().trim();
    const existing = ownedCardsMap.get(normalizedName);
    if (existing) {
      existing.quantity += card.quantity;
    } else {
      ownedCardsMap.set(normalizedName, { ...card });
    }
  });

  const missingCards: CollectionCard[] = [];
  const ownedCards: CollectionCard[] = [];
  let totalNeeded = 0;
  let totalOwned = 0;

  for (const requiredCard of requiredCards) {
    const normalizedName = requiredCard.name.toLowerCase().trim();
    const ownedCard = ownedCardsMap.get(normalizedName);

    if (!ownedCard) {
      totalNeeded = +totalNeeded+requiredCard.quantity;
      // Card not owned at all
      missingCards.push({
        ...requiredCard,
        owned: false
      });
    } else {
      const availableQuantity = +ownedCard.quantity;
      const neededQuantity = +requiredCard.quantity;
      
      if (availableQuantity >= neededQuantity) {
        // Have enough of this card
        // totalNeeded += neededQuantity;
        totalOwned = +totalOwned+neededQuantity;
        ownedCards.push({
          ...requiredCard,
          owned: true,
          quantity: neededQuantity
        });
      } else {
        // Have some but not enough
        totalOwned = +totalOwned+availableQuantity;
        ownedCards.push({
          ...requiredCard,
          owned: true,
          quantity: availableQuantity
        });

        totalNeeded = +totalNeeded+(neededQuantity-availableQuantity);
        missingCards.push({
          ...requiredCard,
          owned: false,
          quantity: neededQuantity - availableQuantity
        });
      }
    }
  }

  const completionPercentage = +totalNeeded+totalOwned > 0 ? Math.round((totalOwned / (+totalNeeded+totalOwned)) * 100) : 100;

  return {
    missingCards,
    ownedCards,
    totalMissingValue: calculateTotalValue(missingCards),
    statistics: {
      total: +totalNeeded+totalOwned,
      totalNeeded,
      totalOwned,
      completionPercentage
    }
  };
}

/**
 * Calculate total value of cards based on their prices
 */
function calculateTotalValue(cards: CollectionCard[]): number {
  return cards.reduce((total, card) => {
    const price = getCardPrice(card);
    return total + (price * card.quantity);
  }, 0);
}

/**
 * Get the best available price for a card
 */
function getCardPrice(card: CollectionCard): number {
  if (!card.prices) return 0;
  
  const prices = [
    card.prices.cardmarket_price,
    card.prices.tcgplayer_price,
    card.prices.ebay_price,
    card.prices.amazon_price,
    card.prices.coolstuffinc_price
  ].filter(price => price && parseFloat(price) > 0)
   .map(price => parseFloat(price!));
   
  return prices.length > 0 ? Math.min(...prices) : 0;
}

/**
 * Group missing cards by type for better organization
 */
export function groupCardsByType(cards: CollectionCard[]): Record<string, CollectionCard[]> {
  return cards.reduce((groups, card) => {
    const type = card.type || 'Unknown';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(card);
    return groups;
  }, {} as Record<string, CollectionCard[]>);
}
