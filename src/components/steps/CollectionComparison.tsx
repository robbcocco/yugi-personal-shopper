"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GitCompare, CheckCircle, AlertTriangle, Package, DollarSign, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { compareCollectionWithDecks, groupCardsByType, ComparisonResult } from '@/lib/collection';
import { CollectionCard } from '@/types/card-types';

export default function CollectionComparison() {
  const { collection, deckList, setMissingCards, updateStepCompletion } = useAppStore();
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'missing' | 'owned'>('missing');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // Prefer DOM text so it matches exactly what the user sees
    const text = missingCards.map(c => `${c.quantity}x ${c.name}`).join("\n");
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Fallback for environments without Clipboard API
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } finally {
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }
    }
  };

  useEffect(() => {
    performComparison();
  }, [collection, deckList]);

  const performComparison = () => {
    if (!deckList || deckList.length === 0) {
      setComparisonResult(null);
      return;
    }

    setIsLoading(true);
    
    try {
      const result = compareCollectionWithDecks(collection, deckList);
      setComparisonResult(result);
      setMissingCards(result.missingCards);
      
      // Mark step as complete
      updateStepCompletion(3, true);
      
      // Make next step accessible if there are missing cards
      if (result.missingCards.length > 0) {
        updateStepCompletion(4, false); // Reset price comparison step
      }
    } catch (error) {
      console.error('Error performing comparison:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const groupedMissingCards = comparisonResult ? groupCardsByType(comparisonResult.missingCards) : {};
  const groupedOwnedCards = comparisonResult ? groupCardsByType(comparisonResult.ownedCards) : {};

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Comparing Your Collection
              </p>
              <p className="text-sm text-gray-500">
                Analyzing your deck requirements against your collection...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!comparisonResult) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GitCompare className="w-5 h-5" />
              <span>Collection Comparison</span>
            </CardTitle>
            <CardDescription>
              Compare your deck with your collection to find missing cards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                No Deck Lists to Compare
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Please add at least one deck list in the previous step to perform comparison.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="mx-auto"
              >
                Go Back to Add Decks
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { statistics, missingCards, ownedCards } = comparisonResult;

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                <p className="text-sm text-gray-500">Cards Needed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalOwned}</p>
                <p className="text-sm text-gray-500">Cards Owned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalNeeded}</p>
                <p className="text-sm text-gray-500">Cards Missing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Collection Completion</span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {statistics.completionPercentage}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className='h-[calc(100dvh-40rem)] overflow-y-auto overscroll-contain'>
            {ownedCards && ownedCards.map((card, index) => { return (
              <p key={index}>{card.quantity}x {card.name}</p>
            )})}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>Missing Cards</span>
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={handleCopy}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleCopy()}
                className="text-lg font-bold text-blue-600 hover:underline cursor-pointer select-none"
                aria-label="Copy missing cards"
                title="Copy"
              >
                {copied ? "Copied!" : "Copy"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className='h-[calc(100dvh-40rem)] overflow-y-auto overscroll-contain'>
            {missingCards && missingCards.map((card, index) => { return (
              <p key={index}>{card.quantity}x {card.name}</p>
            )})}
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      {/* <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setSelectedTab('missing')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'missing'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Missing Cards ({missingCards.length})
        </button>
        <button
          onClick={() => setSelectedTab('owned')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            selectedTab === 'owned'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Owned Cards ({ownedCards.length})
        </button>
      </div> */}

      {/* Cards Display */}
      {/* <div className="space-y-4">
        {selectedTab === 'missing' ? (
          Object.keys(groupedMissingCards).length > 0 ? (
            Object.entries(groupedMissingCards).map(([cardType, cards]) => (
              <Card key={cardType}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {cardType} ({cards.length} cards)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {cards.map((card, index) => (
                      <CardItem key={`${card.id}-${index}`} card={card} isMissing={true} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-gray-900 mb-2">
                    Collection Complete!
                  </p>
                  <p className="text-gray-500">
                    You own all the cards needed for your deck lists.
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          Object.keys(groupedOwnedCards).length > 0 ? (
            Object.entries(groupedOwnedCards).map(([cardType, cards]) => (
              <Card key={cardType}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {cardType} ({cards.length} cards)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {cards.map((card, index) => (
                      <CardItem key={`${card.id}-${index}`} card={card} isMissing={false} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-gray-900 mb-2">
                    No Owned Cards
                  </p>
                  <p className="text-gray-500">
                    You don&apos;t own any of the cards needed for your deck lists.
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div> */}

      {/* Action Buttons */}
      {/* <div className="flex justify-center space-x-4 pt-4">
        <Button variant="outline" onClick={performComparison}>
          Refresh Comparison
        </Button>
        {missingCards.length > 0 && (
          <Button onClick={() => {
            // This will be handled by the wizard navigation
            // The next step (Price Comparison) will be automatically accessible
          }}>
            Find Best Prices
          </Button>
        )}
      </div> */}
    </div>
  );
}

// interface CardItemProps {
//   card: CollectionCard;
//   isMissing: boolean;
// }

// function CardItem({ card, isMissing }: CardItemProps) {
//   const getCardPrice = (card: CollectionCard): number => {
//     if (!card.prices) return 0;
    
//     const prices = [
//       card.prices.cardmarket_price,
//       card.prices.tcgplayer_price,
//       card.prices.ebay_price,
//       card.prices.amazon_price,
//       card.prices.coolstuffinc_price
//     ].filter(price => price && parseFloat(price) > 0)
//      .map(price => parseFloat(price!));
     
//     return prices.length > 0 ? Math.min(...prices) : 0;
//   };

//   const price = getCardPrice(card);
//   const totalValue = price * card.quantity;

//   return (
//     <div className={`p-3 rounded-lg border-2 ${
//       isMissing ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
//     }`}>
//       <div className="flex justify-between items-start mb-2">
//         <h4 className="font-medium text-gray-900 text-sm leading-tight">
//           {card.name}
//         </h4>
//         <div className={`w-3 h-3 rounded-full ${
//           isMissing ? 'bg-red-400' : 'bg-green-400'
//         }`} />
//       </div>
      
//       <div className="space-y-1 text-xs text-gray-600">
//         <div className="flex justify-between">
//           <span>Quantity:</span>
//           <span className="font-medium">{card.quantity}</span>
//         </div>
        
//         {card.type && (
//           <div className="flex justify-between">
//             <span>Type:</span>
//             <span className="font-medium">{card.type}</span>
//           </div>
//         )}
        
//         {price > 0 && (
//           <>
//             <div className="flex justify-between">
//               <span>Price:</span>
//               <span className="font-medium">${price.toFixed(2)}</span>
//             </div>
//             <div className="flex justify-between">
//               <span>Total:</span>
//               <span className="font-medium text-blue-600">${totalValue.toFixed(2)}</span>
//             </div>
//           </>
//         )}
//       </div>
      
//       {card.attribute && (
//         <div className="mt-2">
//           <span className="inline-block px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
//             {card.attribute}
//           </span>
//         </div>
//       )}
//     </div>
//   );
// }
