"use client";

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText } from 'lucide-react';
import { parseCSVFile, validateFile, readFileAsText } from '@/lib/file-parsers';
import { CollectionData } from '@/types/card-types';
import { extractLastPathSegment } from '@/lib/utils';
import { scrapeYgoCollection } from '@/lib/ygoprodeck-api';

export default function CollectionImport() {
  const { setCollection, setError, setLoading, collection } = useAppStore();
  const [dragActive, setDragActive] = useState(false);
  const [slug, setSlug] = useState("");

  const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    const text = e.clipboardData.getData("text");
    const extracted = extractLastPathSegment(text);
    if (extracted) {
      e.preventDefault();       // stop the raw text from being inserted
      setSlug(extracted);
    }
  };

  // (Optional) also normalize if the user types a full URL then leaves the field
  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (e) => {
    const normalized = extractLastPathSegment(e.currentTarget.value);
    if (normalized !== slug) setSlug(normalized);
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Read file content
      const content = await readFileAsText(file);

      // Parse CSV file
      const result = parseCSVFile(content);

      if (result.success && result.data) {
        const collectionData = result.data as CollectionData;
        setCollection(collectionData);
        setError(null);
      } else {
        setError(result.error || 'Failed to parse file');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setLoading(false);
    }
  }, [setCollection, setError, setLoading]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  }, [handleFiles]);

  const importFromYGOProDeck = useCallback(() => {
    const cardIds = scrapeYgoCollection(slug);
    console.log(cardIds)
    const emptyCollection: CollectionData = {
      cards: [],
      totalCards: 0,
      importSource: 'manual'
    };
    setCollection(emptyCollection);
  }, [setCollection, slug]);

  const skipStep = useCallback(() => {
    // Create empty collection to proceed
    const emptyCollection: CollectionData = {
      cards: [],
      totalCards: 0,
      importSource: 'manual'
    };
    setCollection(emptyCollection);
  }, [setCollection]);

  return (
    <div className="space-y-6">

      <div className='grid grid-cols-6 gap-6'>
        <Card className='col-span-4'>
          <CardContent className="pt-6 h-[calc(100dvh-30rem)] overflow-y-auto overscroll-contain">
            {collection && collection.cards.map((card, index) => (
              <p key={index}>{card.quantity}x {card.name}</p>
            ))}
          </CardContent>
        </Card>

        <Card className='col-span-2'>
          <CardContent className="pt-6">
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleChange}
                accept=".csv,.txt"
                multiple={false}
              />

              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    Drop your collection file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    {`Supports .CSV files up to 10MB, requires 'cardname' header`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div
          className="flex w-full mr-12"
          role="group"
          aria-label="URL input"
          // onClick={() => inputRef.current?.focus()}
        >
          {/* Fixed prefix (uneditable) */}
          <span
            className="inline-flex select-none items-center rounded-l-md border border-input border-r-0 bg-muted pl-3 text-sm text-muted-foreground text-gray-500"
            aria-hidden="true"
            tabIndex={-1}
          >
            {`ygoprodeck.com/collection/share/`}
          </span>

          {/* Editable tail */}
          <input
            id="company-website"
            type="text"
            placeholder="collectionId"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onPaste={handlePaste}
            onBlur={handleBlur}
            className="flex-1 rounded-none rounded-r-none border border-input border-l-0 bg-background pr-3 py-2 text-sm focus-visible:outline-none focus-visible:none focus-visible:ring-ring"
          />

          {/* Action */}
          <Button
            variant="outline"
            onClick={importFromYGOProDeck}
            type="submit"
            className="rounded-l-none -ml-px"
          >
            Import
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={skipStep}
          className="flex items-center space-x-2"
        >
          <FileText className="w-4 h-4" />
          <span>Use empty collection</span>
        </Button>
      </div>
    </div>
  );
}
