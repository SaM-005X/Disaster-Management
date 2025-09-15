import React from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import type { SearchResult } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { NewspaperIcon } from './icons/NewspaperIcon';
import { GoogleIcon } from './icons/GoogleIcon';

interface SearchResultsProps {
  results: SearchResult[];
  onResultClick: (result: SearchResult) => void;
  isLoading: boolean;
  searchQuery: string;
  onGoogleSearch: (query: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onResultClick, isLoading, searchQuery, onGoogleSearch }) => {
  const { translate } = useTranslate();

  const groupedResults = results.reduce((acc, result) => {
    const type = result.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(result);
    return acc;
  }, {} as Record<'module' | 'news', SearchResult[]>);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <div className="flex justify-center items-center gap-2">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin"></div>
            {translate('Searching...')}
        </div>
      </div>
    );
  }

  if (results.length === 0 && searchQuery) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">{translate('No results found on this platform.')}</p>
        <button
          onClick={() => onGoogleSearch(searchQuery)}
          className="inline-flex items-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <GoogleIcon className="h-5 w-5" />
          <span>{translate('Search Google for')} "{searchQuery}"</span>
        </button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {groupedResults.module && (
        <div>
          <h3 className="px-4 py-2 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">{translate('Learning Modules')}</h3>
          <ul className="py-1">
            {groupedResults.module.map(result => (
              <li key={`module-${result.id}`}>
                <button onClick={() => onResultClick(result)} className="w-full text-left px-4 py-3 flex items-start gap-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="p-2 bg-teal-100 dark:bg-teal-900/50 rounded-lg flex-shrink-0"><BookOpenIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" /></div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{translate(result.title)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{translate(result.description)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {groupedResults.news && (
        <div>
          <h3 className="px-4 py-2 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">{translate('News Articles')}</h3>
          <ul className="py-1">
            {groupedResults.news.map(result => (
              <li key={`news-${result.id}`}>
                <button onClick={() => onResultClick(result)} className="w-full text-left px-4 py-3 flex items-start gap-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                   <div className="p-2 bg-sky-100 dark:bg-sky-900/50 rounded-lg flex-shrink-0"><NewspaperIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" /></div>
                   <div>
                     <p className="font-semibold text-gray-800 dark:text-white">{translate(result.title)}</p>
                     <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{translate(result.description)}</p>
                   </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
