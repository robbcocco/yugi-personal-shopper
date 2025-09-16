"use client";

import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { DeckList, FileUploadResult } from '@/types/card-types';
import { mergeDeckLists } from '@/lib/collection';
import { detectFileType, parseYDKFile, readFileAsText, validateFile } from '@/lib/file-parsers';

export default function DeckInput() {
  const { setDeckList, setError, setLoading, deckList } = useAppStore();
  const [dragActive, setDragActive] = useState(false);

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

            const fileType = detectFileType(file.name, content);

            let result: FileUploadResult = { success: false }
            if (fileType === 'ydk') {
              result = await parseYDKFile(file.name, content);
            }
      
            if (result.success && result.data) {
              const deck = result.data as DeckList;
              setDeckList(deckList.concat(deck));
              setError(null);
            } else {
              setError(result.error || 'Failed to parse file');
            }
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to process file');
          } finally {
            setLoading(false);
          }
    }, [deckList, setDeckList, setError, setLoading]);

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

  const onRemoveDeck = (i: number) => {
    setDeckList(deckList.filter((deck, index) => index != i));
  };

  return (
    <div className="space-y-6 ">
      <div className='grid grid-cols-6 gap-6'>
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
                accept=".csv,.txt,.ydk"
                multiple={false}
              />

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    Drop your .ydk here, or click to browse
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardContent className="pt-6">
            textbox for parsing
          </CardContent>
        </Card>

        <Card className='col-span-2'>
          <CardContent className="pt-6 h-[calc(100dvh-33rem)] overflow-y-auto overscroll-contain">
            {deckList && deckList.map((deck, index) => {
              return (
                <div key={index} className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm">{deck.name}</h4>
                  <button
                    onClick={() => onRemoveDeck(index)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    X
                  </button>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className='col-span-2'>
          <CardContent className="pt-6 h-[calc(100dvh-33rem)] overflow-y-auto overscroll-contain">
            {deckList && mergeDeckLists(deckList).map((card, index) => {
              return (
                <div key={index} className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm">{card.quantity}x {card.name}</h4>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
