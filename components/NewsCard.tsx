import React from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import type { NewsArticle } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface NewsCardProps {
    article: NewsArticle;
}

const NewsCard: React.FC<NewsCardProps> = ({ article }) => {
    const { translate } = useTranslate();

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.onerror = null; // Prevents looping
        // A generic, high-quality placeholder for news
        e.currentTarget.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop';
    };

    const isClickable = article.link && article.link !== '#';

    // The shared content of the card
    const CardContent = (
        <>
            <div className="relative">
                <img className="w-full h-44 object-cover" src={article.imageUrl} alt={translate(article.title)} onError={handleImageError} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                {isClickable && (
                    <div className="absolute bottom-3 right-3 p-1.5 bg-white/20 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLinkIcon className="h-5 w-5 text-white" />
                    </div>
                )}
            </div>
             {article.isLocal && article.status === 'pending' && (
                <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                    {translate('Pending Review')}
                </span>
            )}
            <div className="p-5">
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase">{translate(article.source)}</p>
                <h3 className={`text-lg font-bold text-gray-900 dark:text-white mt-1 ${isClickable ? 'group-hover:text-teal-500 dark:group-hover:text-teal-400' : ''} transition-colors`}>
                    {translate(article.title)}
                </h3>
                 {article.isSummarizing ? (
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                        <div className="h-2 w-2 bg-teal-500 rounded-full animate-pulse"></div>
                        <span>{translate('Generating summary...')}</span>
                    </div>
                ) : (
                    <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                        {translate(article.summary)}
                    </p>
                )}
            </div>
        </>
    );

    const baseClasses = "relative block bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-transform duration-300 group";

    // If the card is clickable, render it as an anchor tag for semantic HTML and accessibility.
    if (isClickable) {
        return (
            <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`${baseClasses} hover:scale-105 hover:shadow-xl`}
            >
                {CardContent}
            </a>
        );
    }
    
    // Otherwise, render it as a div, which is not interactive.
    return (
        <div className={`${baseClasses} cursor-default`}>
            {CardContent}
        </div>
    );
};

export default NewsCard;