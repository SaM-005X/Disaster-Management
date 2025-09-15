import React, { useEffect, useRef } from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import type { SearchResult } from '../types';
import { XIcon } from './icons/XIcon';
import { SearchIcon } from './icons/SearchIcon';
import SearchResults from './SearchResults';

interface SearchOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: SearchResult[];
  onResultClick: (result: SearchResult) => void;
  onGoogleSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isVisible,
  onClose,
  searchQuery,
  onSearchChange,
  searchResults,
  onResultClick,
  onGoogleSearch,
  isLoading,
}) => {
  const { translate } = useTranslate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      inputRef.current?.focus();
      
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex flex-col items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={containerRef}
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-b-2xl shadow-2xl flex flex-col animate-slide-down"
        onClick={(e) => e.stopPropagation()}
        style={{ marginTop: '69px' }} // Position below the header
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <SearchIcon className="h-6 w-6" />
            </div>
            <input
              ref={inputRef}
              type="search"
              placeholder={translate('Search modules, news, or Google...')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-12 py-3 text-lg bg-transparent focus:outline-none text-gray-900 dark:text-white"
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
              aria-label={translate('Close search')}
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="max-h-[calc(80vh - 150px)] overflow-y-auto">
          <SearchResults
            results={searchResults}
            onResultClick={onResultClick}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onGoogleSearch={onGoogleSearch}
          />
        </div>
      </div>
       <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SearchOverlay;
