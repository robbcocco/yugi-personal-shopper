"use client";

import { useAppStore, useCurrentWizardStep } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import CollectionImport from '@/components/steps/CollectionImport';
import DeckInput from '@/components/steps/DeckInput';
import CollectionComparison from '@/components/steps/CollectionComparison';
import PriceComparison from '@/components/steps/PriceComparison';

export default function Home() {
  const { 
    currentStep, 
    wizardSteps, 
    nextStep, 
    prevStep, 
    resetApp,
    error,
    isLoading 
  } = useAppStore();
  
  const currentWizardStep = useCurrentWizardStep();

  const canGoBack = currentStep > 1;
  const canGoNext = currentStep < wizardSteps.length && 
    wizardSteps.find(step => step.id === currentStep + 1)?.isAccessible;

  const renderStepComponent = () => {
    switch (currentWizardStep?.component) {
      case 'CollectionImport':
        return <CollectionImport />;
      case 'DeckInput':
        return <DeckInput />;
      case 'CollectionComparison':
        return <CollectionComparison />;
      case 'PriceComparison':
        return <PriceComparison />;
      default:
        return <div>Step not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Yu-Gi-Oh! Personal Shopper
          </h1>
          <p className="text-lg text-gray-600">
            Find missing cards from your collection and compare prices
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <p className="text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{currentWizardStep?.title}</CardTitle>
            <CardDescription>{currentWizardStep?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : (
              renderStepComponent()
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={!canGoBack || isLoading}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <Button
            variant="outline"
            onClick={resetApp}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </Button>

          <Button
            onClick={nextStep}
            disabled={!canGoNext || isLoading}
            className="flex items-center space-x-2"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Powered by{' '}
            <a
              href="https://ygoprodeck.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              YGOPRODeck API
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
