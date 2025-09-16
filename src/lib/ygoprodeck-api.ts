import { CardData, YGOProDeckResponse, CardSetInfo } from '@/types/card-types';

const BASE_URL = 'https://db.ygoprodeck.com/api/v7';
const RATE_LIMIT_DELAY = 100; // 100ms between requests to stay under 20/second

// Rate limiting utility
class RateLimiter {
  private lastRequestTime = 0;

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await new Promise(resolve => 
        setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }
}

const rateLimiter = new RateLimiter();

// Generic API request function with error handling
async function apiRequest<T>(url: string): Promise<T> {
  await rateLimiter.throttle();
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`API Error: ${data.error}`);
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown API error occurred');
  }
}

// Get card information by ID
export async function getCardById(id: number): Promise<CardData | null> {
  try {
    const response = await apiRequest<YGOProDeckResponse>(
      `${BASE_URL}/cardinfo.php?id=${id}`
    );
    return response.data?.[0] || null;
  } catch (error) {
    console.warn(`Failed to fetch card with ID ${id}:`, error);
    return null;
  }
}

// Get multiple cards by IDs (batch request)
export async function getCardsByIds(ids: number[]): Promise<CardData[]> {
  if (ids.length === 0) return [];
  
  try {
    const idsString = ids.join(',');
    const response = await apiRequest<YGOProDeckResponse>(
      `${BASE_URL}/cardinfo.php?id=${idsString}`
    );
    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch cards by IDs:', error);
    return [];
  }
}

// Get card information by exact name
export async function getCardByName(name: string): Promise<CardData | null> {
  try {
    const encodedName = encodeURIComponent(name);
    const response = await apiRequest<YGOProDeckResponse>(
      `${BASE_URL}/cardinfo.php?name=${encodedName}`
    );
    return response.data?.[0] || null;
  } catch (error) {
    console.warn(`Failed to fetch card with name "${name}":`, error);
    return null;
  }
}

// Get multiple cards by names (using pipe-separated format)
export async function getCardsByNames(names: string[]): Promise<CardData[]> {
  if (names.length === 0) return [];
  
  try {
    const namesString = names.map(name => encodeURIComponent(name)).join('|');
    const response = await apiRequest<YGOProDeckResponse>(
      `${BASE_URL}/cardinfo.php?name=${namesString}`
    );
    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch cards by names:', error);
    return [];
  }
}

// Search cards by fuzzy name matching
export async function searchCardsByName(searchTerm: string): Promise<CardData[]> {
  if (!searchTerm.trim()) return [];
  
  try {
    const encodedTerm = encodeURIComponent(searchTerm);
    const response = await apiRequest<YGOProDeckResponse>(
      `${BASE_URL}/cardinfo.php?fname=${encodedTerm}`
    );
    return response.data || [];
  } catch (error) {
    console.warn(`Failed to search cards with term "${searchTerm}":`, error);
    return [];
  }
}

// Validate card existence and get basic info
export async function validateCard(identifier: string | number): Promise<CardData | null> {
  if (typeof identifier === 'number') {
    return await getCardById(identifier);
  } else {
    return await getCardByName(identifier);
  }
}

// Batch validate multiple cards with progress callback
export async function validateCards(
  identifiers: (string | number)[],
  onProgress?: (completed: number, total: number) => void
): Promise<CardData[]> {
  const results: CardData[] = [];
  
  for (let i = 0; i < identifiers.length; i++) {
    const identifier = identifiers[i];
    const card = await validateCard(identifier);
    
    if (card) {
      results.push(card);
    }
    
    if (onProgress) {
      onProgress(i + 1, identifiers.length);
    }
  }
  
  return results;
}

// Get all card sets
export async function getCardSets(): Promise<CardSetInfo[]> {
  try {
    const response = await apiRequest<CardSetInfo[]>(`${BASE_URL}/cardsets.php`);
    return response || [];
  } catch (error) {
    console.warn('Failed to fetch card sets:', error);
    return [];
  }
}

// Get random card (useful for testing)
export async function getRandomCard(): Promise<CardData | null> {
  try {
    const response = await apiRequest<YGOProDeckResponse>(`${BASE_URL}/randomcard.php`);
    return response.data?.[0] || null;
  } catch (error) {
    console.warn('Failed to fetch random card:', error);
    return null;
  }
}

// Helper function to extract best price from card data
export function getBestPrice(card: CardData): { price: number; source: string; currency: string } | null {
  if (!card.card_prices || card.card_prices.length === 0) {
    return null;
  }
  
  const prices = card.card_prices[0];
  const priceOptions = [
    { price: prices.cardmarket_price, source: 'CardMarket', currency: 'EUR' },
    { price: prices.tcgplayer_price, source: 'TCGPlayer', currency: 'USD' },
    { price: prices.ebay_price, source: 'eBay', currency: 'USD' },
    { price: prices.amazon_price, source: 'Amazon', currency: 'USD' },
    { price: prices.coolstuffinc_price, source: 'CoolStuffInc', currency: 'USD' }
  ];
  
  const validPrices = priceOptions
    .filter(option => option.price && parseFloat(option.price) > 0)
    .map(option => ({
      ...option,
      price: parseFloat(option.price!)
    }))
    .sort((a, b) => a.price - b.price);
  
  return validPrices[0] || null;
}

// Helper function to get all available prices
export function getAllPrices(card: CardData): Array<{ price: number; source: string; currency: string }> {
  if (!card.card_prices || card.card_prices.length === 0) {
    return [];
  }
  
  const prices = card.card_prices[0];
  const priceOptions = [
    { price: prices.cardmarket_price, source: 'CardMarket', currency: 'EUR' },
    { price: prices.tcgplayer_price, source: 'TCGPlayer', currency: 'USD' },
    { price: prices.ebay_price, source: 'eBay', currency: 'USD' },
    { price: prices.amazon_price, source: 'Amazon', currency: 'USD' },
    { price: prices.coolstuffinc_price, source: 'CoolStuffInc', currency: 'USD' }
  ];
  
  return priceOptions
    .filter(option => option.price && parseFloat(option.price) > 0)
    .map(option => ({
      ...option,
      price: parseFloat(option.price!)
    }))
    .sort((a, b) => a.price - b.price);
}
