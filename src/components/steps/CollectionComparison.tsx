"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitCompare } from 'lucide-react';

export default function CollectionComparison() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="text-center py-12">
            <GitCompare className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Comparison Coming Soon
            </p>
            <p className="text-sm text-gray-500">
              Collection comparison logic will be implemented in the next update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
