import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (!slug || slug.trim() === '') {
      return NextResponse.json(
        { error: 'Collection slug is required' },
        { status: 400 }
      );
    }

    // Construct the URL
    const url = `https://ygoprodeck.com/collection/share/${slug.trim()}`;
    
    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch collection: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Get HTML content
    const html = await response.text();
    
    // Extract card data (ID and quantity) using regex since we don't have DOM parser on server
    // We need to find card-row elements and their associated quantity elements
    const cardRows = html.match(/<div[^>]*class="card-row"[^>]*data-id="\d+"[^>]*>[\s\S]*?<\/div>/g);
    const cards: Array<{ id: number; quantity: number }> = [];
    
    if (cardRows) {
      for (const cardRowHtml of cardRows) {
        // Extract card ID
        const idMatch = cardRowHtml.match(/data-id="(\d+)"/);
        if (idMatch && idMatch[1]) {
          const cardId = parseInt(idMatch[1], 10);
          
          if (!isNaN(cardId)) {
            // Extract quantity from floating-quantity div
            let quantity = 1; // Default quantity
            const quantityMatch = cardRowHtml.match(/<div[^>]*class="floating-quantity"[^>]*>x(\d+)<\/div>/);
            
            if (quantityMatch && quantityMatch[1]) {
              const parsedQuantity = parseInt(quantityMatch[1], 10);
              if (!isNaN(parsedQuantity)) {
                quantity = parsedQuantity;
              }
            }
            
            cards.push({ id: cardId, quantity });
          }
        }
      }
    }
    
    return NextResponse.json({ cards });
    
  } catch (error) {
    console.error('Error scraping YGOProDeck collection:', error);
    return NextResponse.json(
      { error: 'Failed to scrape collection data' },
      { status: 500 }
    );
  }
}
