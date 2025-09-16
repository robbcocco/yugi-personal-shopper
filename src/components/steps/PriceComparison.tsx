"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export default function PriceComparison() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Price Comparison</span>
          </CardTitle>
          <CardDescription>
            View prices for missing cards and find the best deals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Price Comparison Coming Soon
            </p>
            <p className="text-sm text-gray-500">
              Price comparison and best deals feature will be implemented in the next update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
