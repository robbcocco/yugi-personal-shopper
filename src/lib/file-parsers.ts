import { YDKData, CollectionData, CollectionCard, FileUploadResult, DeckListData, YGOProDeckCSVCard } from '@/types/card-types';
import { parse } from "csv-parse/sync";
import { getCardsByIds } from './ygoprodeck-api';
import { attachQuantities } from './collection';


// YDK file parser
export async function parseYDKFile(fileName: string, fileContent: string): Promise<FileUploadResult> {
  try {
    const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);
    const ydkResult: YDKData = {
      main: [],
      extra: [],
      side: []
    };

    let currentSection: 'main' | 'extra' | 'side' | null = null;

    for (const line of lines) {
      // Check for section headers
      if (line.startsWith('#main')) {
        currentSection = 'main';
        continue;
      } else if (line.startsWith('#extra')) {
        currentSection = 'extra';
        continue;
      } else if (line.startsWith('#side')) {
        currentSection = 'side';
        continue;
      } else if (line.startsWith('#') || line.startsWith('!')) {
        // Skip comments and other metadata
        continue;
      }

      // Parse card ID
      const cardId = parseInt(line);
      if (!isNaN(cardId) && cardId > 0 && currentSection) {
        ydkResult[currentSection].push(cardId);
      }
    }

    const allCards = await getCardsByIds(ydkResult.main.concat(ydkResult.extra).concat(ydkResult.side));
    const main = attachQuantities(ydkResult.main, allCards);
    const side = attachQuantities(ydkResult.side, allCards);
    const extra = attachQuantities(ydkResult.extra, allCards);

    return {
      success: true,
      data: { name: fileName, main, side, extra }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse YDK file'
    };
  }
}

// Parse text input for deck lists
export function parseTextDeckList(textContent: string): FileUploadResult {
  try {
    const lines = textContent.split('\n').map(line => line.trim()).filter(line => line);
    const cards: CollectionCard[] = [];

    for (const line of lines) {
      // Skip empty lines and comments
      if (!line || line.startsWith('#') || line.startsWith('//')) {
        continue;
      }

      // Try to parse different formats:
      // "3x Blue-Eyes White Dragon"
      // "Blue-Eyes White Dragon x3"
      // "3 Blue-Eyes White Dragon"
      // "Blue-Eyes White Dragon (3)"
      
      let quantity = 1;
      let cardName = line;

      // Format: "3x Card Name" or "3 Card Name"
      const prefixMatch = line.match(/^(\d+)x?\s+(.+)$/);
      if (prefixMatch) {
        quantity = parseInt(prefixMatch[1]);
        cardName = prefixMatch[2];
      } else {
        // Format: "Card Name x3"
        const suffixMatch = line.match(/^(.+?)\s+x(\d+)$/);
        if (suffixMatch) {
          cardName = suffixMatch[1];
          quantity = parseInt(suffixMatch[2]);
        } else {
          // Format: "Card Name (3)"
          const parenMatch = line.match(/^(.+?)\s*\((\d+)\)$/);
          if (parenMatch) {
            cardName = parenMatch[1];
            quantity = parseInt(parenMatch[2]);
          }
        }
      }

      cardName = cardName.trim();
      if (!cardName) continue;

      const card: CollectionCard = {
        id: 0, // Will be populated when validated against API
        name: cardName,
        type: '',
        frameType: '',
        desc: '',
        race: '',
        quantity,
        owned: false
      };

      cards.push(card);
    }

    // Simple deck list structure (all in main deck for now)
    const deckData: DeckListData = {
      main: cards,
      extra: [],
      side: []
    };

    return {
      success: true,
      data: deckData
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse text deck list'
    };
  }
}

// CSV parser for collection data
export function parseCSVFile(fileContent: string): FileUploadResult {
  try {
    const lines = parse<YGOProDeckCSVCard>(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    if (lines.length === 0) {
      return {
        success: false,
        error: 'CSV file is empty'
      };
    }

    // Parse header to detect format
    // const header = lines[0].toLowerCase();
    // const isYGOProDeckFormat = header.includes('cardname');
    
    // if (!isYGOProDeckFormat) {
    //   return {
    //     success: false,
    //     error: 'CSV format not recognized. Required columns: cardname'
    //   };
    // }

    const cards: CollectionCard[] = [];

    console.log(lines.length)
    
    // Parse data rows (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      const cardName = line.cardname;
      if (!cardName) continue;

      // Extract quantity if present in the name (e.g., "3x Blue-Eyes White Dragon")
      const quantityMatch = cardName.match(/^(\d+)x?\s+(.+)$/);
      const cleanName = quantityMatch ? quantityMatch[2] : cardName;

      const card: CollectionCard = {
        id: 0, // Will be populated when validated against API
        name: cleanName,
        type: '',
        frameType: '',
        desc: '',
        race: '',
        quantity: line.cardq,
        owned: true,
        // sets: columns[1] ? [{
        //   set_name: columns[1],
        //   set_code: columns[2] || '',
        //   set_rarity: columns[3] || '',
        //   set_rarity_code: '',
        //   set_price: columns[4] || '0'
        // }] : undefined
      };

      cards.push(card);
    }

    const collectionData: CollectionData = {
      cards,
      totalCards: cards.reduce((sum, card) => sum + card.quantity, 0),
      importSource: 'csv'
    };

    return {
      success: true,
      data: collectionData
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse CSV file'
    };
  }
}

// Helper function to parse CSV line with proper quote handling
// function parseCSVLine(line: string): string[] {
//   const result: string[] = [];
//   let current = '';
//   let inQuotes = false;
  
//   for (let i = 0; i < line.length; i++) {
//     const char = line[i];
    
//     if (char === '"') {
//       if (inQuotes && line[i + 1] === '"') {
//         // Escaped quote
//         current += '"';
//         i++; // Skip next quote
//       } else {
//         // Toggle quote state
//         inQuotes = !inQuotes;
//       }
//     } else if (char === ',' && !inQuotes) {
//       // End of field
//       result.push(current);
//       current = '';
//     } else {
//       current += char;
//     }
//   }
  
//   // Add last field
//   result.push(current);
  
//   return result;
// }

// File type detection
export function detectFileType(fileName: string, content?: string): 'ydk' | 'csv' | 'txt' | 'unknown' {
  const extension = fileName.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'ydk':
      return 'ydk';
    case 'csv':
      return 'csv';
    case 'txt':
      return 'txt';
    default:
      // Try to detect by content if available
      if (content) {
        if (content.includes('#main') || content.includes('#extra') || content.includes('#side')) {
          return 'ydk';
        }
        if (content.includes(',') && content.split('\n').length > 1) {
          return 'csv';
        }
      }
      return 'unknown';
  }
}

// Validate file before parsing
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 10MB.'
    };
  }

  // Check file type
  const fileType = detectFileType(file.name);
  if (fileType === 'unknown') {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload a .ydk, .csv, or .txt file.'
    };
  }

  return { valid: true };
}

// Convert File to text content
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
}

// Export collection data as CSV
export function exportCollectionAsCSV(collection: CollectionCard[]): string {
  const headers = ['Card Name', 'Quantity', 'Type', 'Rarity', 'Set', 'Price'];
  const rows = [headers];

  for (const card of collection) {
    const row = [
      `"${card.name}"`,
      card.quantity.toString(),
      `"${card.type}"`,
      `"${card.sets?.[0]?.set_rarity || ''}"`,
      `"${card.sets?.[0]?.set_name || ''}"`,
      card.prices?.cardmarket_price || card.prices?.tcgplayer_price || '0'
    ];
    rows.push(row);
  }

  return rows.map(row => row.join(',')).join('\n');
}

// Export missing cards list as text
export function exportMissingCardsAsText(missingCards: CollectionCard[]): string {
  const lines: string[] = [];
  
  lines.push('# Missing Cards List');
  lines.push(`# Generated on ${new Date().toLocaleDateString()}`);
  lines.push('');
  
  for (const card of missingCards) {
    lines.push(`${card.quantity}x ${card.name}`);
  }
  
  return lines.join('\n');
}
