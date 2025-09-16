// Core card interface based on YGOPRODeck API
export interface Card {
  id: number;
  name: string;
  type: string;
  frameType: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race: string;
  attribute?: string;
  archetype?: string;
  ygoprodeck_url?: string;
}

// Card set information
export interface CardSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_rarity_code: string;
  set_price: string;
}

// Card image information
export interface CardImage {
  id: number;
  image_url: string;
  image_url_small: string;
  image_url_cropped: string;
}

// Card price information
export interface CardPrices {
  cardmarket_price?: string;
  tcgplayer_price?: string;
  ebay_price?: string;
  amazon_price?: string;
  coolstuffinc_price?: string;
}

// Complete card data from API
export interface CardData extends Card {
  card_sets?: CardSet[];
  card_images: CardImage[];
  card_prices: CardPrices[];
}

// Collection card with quantity and ownership status
export interface CollectionCard extends Card {
  quantity: number;
  owned: boolean;
  sets?: CardSet[];
  prices?: CardPrices;
}

// Deck structure
export interface DeckList {
  name?: string;
  main: CollectionCard[];
  extra: CollectionCard[];
  side: CollectionCard[];
}

// YDK file structure
export interface YDKData {
  main: number[];
  extra: number[];
  side: number[];
}

// Collection import data
export interface CollectionData {
  cards: CollectionCard[];
  totalCards: number;
  importSource: 'csv' | 'manual';
}

// Application state types
export interface AppState {
  currentStep: number;
  collection: CollectionData | null;
  deckList: DeckList[];
  missingCards: CollectionCard[];
  isLoading: boolean;
  error: string | null;
}

// API response types
export interface YGOProDeckResponse {
  data: CardData[];
  meta?: {
    current_rows: number;
    total_rows: number;
    rows_remaining: number;
    total_pages: number;
    pages_remaining: number;
    next_page?: string;
    next_page_offset: number;
  };
}

export interface  YGOProDeckCSVCard {
  cardname: string;
  cardq: number;
  cardrarity: string;
  card_edition: string;
  cardset: string;
  cardcode: string;
  cardid: string;
  print_id: string;
}

// Deck list with CollectionCard (for text parsing)
export interface DeckListData {
  main: CollectionCard[];
  extra: CollectionCard[];
  side: CollectionCard[];
}

// File upload types
export interface FileUploadResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Price comparison result
export interface PriceComparison {
  card: CollectionCard;
  bestPrice: {
    source: string;
    price: number;
    currency: string;
  };
  allPrices: Array<{
    source: string;
    price: number;
    currency: string;
  }>;
}

// Card set information from API
export interface CardSetInfo {
  set_name: string;
  set_code: string;
  num_of_cards: number;
  tcg_date: string;
}

// Wizard step configuration
export interface WizardStep {
  id: number;
  title: string;
  description: string;
  component: string;
  isComplete: boolean;
  isAccessible: boolean;
}
