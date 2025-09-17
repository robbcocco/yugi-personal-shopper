"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitCompare, CheckCircle, AlertTriangle, Package, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { compareCollectionWithDecks, ComparisonResult } from '@/lib/collection';

export default function CollectionComparison() {
  const { collection, deckList, setMissingCards, updateStepCompletion } = useAppStore();
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

    </div>
  );
}
