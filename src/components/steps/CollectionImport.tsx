"use client";

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText } from 'lucide-react';
import { parseCSVFile, validateFile, readFileAsText } from '@/lib/file-parsers';
import { CollectionData } from '@/types/card-types';
import { extractLastPathSegment } from '@/lib/utils';
import { mergeCollectionLists } from '@/lib/collection';
// import { getCardsByIds, scrapeYgoCollection } from '@/lib/ygoprodeck-api';

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
        // Add a name to the collection based on the file name
        const namedCollection = {
          ...collectionData,
          name: file.name.replace(/\.[^/.]+$/, '') // Remove file extension
        };
        setCollection(collection.concat(namedCollection));
        setError(null);
      } else {
        setError(result.error || 'Failed to parse file');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setLoading(false);
    }
  }, [collection, setCollection, setError, setLoading]);

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

  // const importFromYGOProDeck = useCallback(async () => {
  //   if (!slug.trim()) {
  //     setError('Please enter a collection ID');
  //     return;
  //   }

  //   setLoading(true);
  //   setError(null);

  //   try {
  //     const cards = await scrapeYgoCollection(slug);

  //     if (cards.length === 0) {
  //       setError('No cards found in the collection. Please check the collection ID.');
  //       return;
  //     }

  //     const cardIds = cards.map(c => c.id);
  //     const allCards = await getCardsByIds(cardIds);
  //     const collectionCards = cards.map((card) => {
  //       const c = allCards.find(c => c.id == card.id);
  //       if (c) {
  //         return {
  //           ...c, quantity: card.quantity, owned: true
  //         }
  //       }
  //     })

  //     // Create collection data with the scraped card data
  //     // For now, we'll create a basic collection structure
  //     // You might want to fetch full card details using getCardsByIds later
  //     const collectionData: CollectionData = {
  //       cards: collectionCards.filter(c => !!c),
  //       totalCards: cards.reduce((sum, card) => sum + card.quantity, 0),
  //       importSource: 'ygoprodeck'
  //     };

  //     setCollection(collectionData);
  //   } catch (error) {
  //     console.error('Error importing from YGOProDeck:', error);
  //     setError(error instanceof Error ? error.message : 'Failed to import collection');
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [setCollection, setError, setLoading, slug]);

  const onRemoveCollection = (i: number) => {
    setCollection(collection.filter((_, index) => index !== i));
  };

  const skipStep = useCallback(() => {
    setCollection([]);
  }, [setCollection]);

  return (
    <div className="space-y-6">

      <div className='grid grid-cols-6 gap-6'>
        <Card className='col-span-2'>
          <CardContent className="pt-6">
            <div
              className={`relative h-[calc(100dvh-30rem)] overflow-y-auto overscroll-contain border-2 border-dashed rounded-lg p-4 text-center transition-colors ${dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* Hidden input; triggered by labels */}
              <input
                type="file"
                id="file-upload"
                className="sr-only"
                onChange={handleChange}
                accept=".csv"
                multiple={false}
              />

              {/* Optional visual overlay when dragging (doesn't block clicks) */}
              {dragActive && (
                <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-blue-500 ring-offset-2" />
              )}

              {collection && collection.length > 0 ? (
                <div className="text-left">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-medium">Collections</h3>
                    {/* Click to open file picker */}
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-sm text-blue-600 hover:underline"
                    >
                      Add collection
                    </label>
                  </div>

                  {collection.map((coll, index) => (
                    <Card key={index} className="mb-2">
                      <CardContent className="flex items-start justify-between p-2">
                        <h4 className="truncate text-sm font-medium">{coll.name || `Collection ${index + 1}`}</h4>
                        <button
                          type="button"
                          onClick={() => onRemoveCollection(index)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          X
                        </button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">
                      Drop your collection here, or{" "}
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer text-blue-600 underline"
                      >
                        browse
                      </label>
                    </p>
                    <p className="text-xs text-gray-500">
                      {`CSV files, requires 'cardname' header`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className='col-span-4'>
          <CardContent className="pt-6 h-[calc(100dvh-30rem)] overflow-y-auto overscroll-contain">
            {collection.length > 0 && mergeCollectionLists(collection).map((card, index) => (
              <p key={index}>{card.quantity}x {card.name}</p>
            ))}
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
            disabled
            type="text"
            placeholder=" won&apos;t work on gh pages :("
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onPaste={handlePaste}
            onBlur={handleBlur}
            className="flex-1 rounded-none rounded-r-none border border-input border-l-0 bg-background pr-3 py-2 text-sm focus-visible:outline-none focus-visible:none focus-visible:ring-ring"
          />

          {/* Action */}
          <Button
            disabled
            variant="outline"
            // onClick={importFromYGOProDeck}
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
          <span>Empty collection</span>
        </Button>
      </div>
    </div>
  );
}
