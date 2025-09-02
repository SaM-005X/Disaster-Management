import React from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import type { NewsArticle, User } from '../types';
import { UserRole } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useTTS } from '../contexts/TTSContext';

interface NewsCardProps {
    article: NewsArticle;
    currentUser: User;
    onEdit: (article: NewsArticle, type: 'latest' | 'previous') => void;
    onDelete: (articleId: string) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, currentUser, onEdit, onDelete }) => {
    const { translate } = useTranslate();
    const { currentlySpokenId } = useTTS();
    const isOfficial = currentUser.role === UserRole.GOVERNMENT_OFFICIAL;

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
            <div className="p-5">
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase">{translate(article.source)}</p>
                <h3 className={`text-lg font-bold text-gray-900 dark:text-white mt-1 ${isClickable ? 'group-hover:text-teal-500 dark:group-hover:text-teal-400' : ''} transition-colors ${currentlySpokenId === `article-${article.type}-${article.id}-title` ? 'tts-highlight' : ''}`}>
                    {translate(article.title)}
                </h3>
                 {article.isSummarizing ? (
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                        <div className="h-2 w-2 bg-teal-500 rounded-full animate-pulse"></div>
                        <span>{translate('Generating summary...')}</span>
                    </div>
                ) : (
                    <p className={`text-gray-600 dark:text-gray-400 mt-2 text-sm ${currentlySpokenId === `article-${article.type}-${article.id}-summary` ? 'tts-highlight' : ''}`}>
                        {translate(article.summary)}
                    </p>
                )}
            </div>
        </>
    );

    const baseClasses = "relative block bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-transform duration-300 group";
    
    const MainComponent = isClickable ? 'a' : 'div';
    const mainProps = isClickable ? {
        href: article.link,
        target: "_blank",
        rel: "noopener noreferrer",
        className: `${baseClasses} hover:scale-105 hover:shadow-xl`
    } : {
        className: `${baseClasses} cursor-default`
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(article, article.type || 'latest');
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(article.id);
    };

    return React.createElement(
        MainComponent,
        mainProps,
        <>
            {CardContent}
            {isOfficial && (
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button onClick={handleEdit} className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-md hover:bg-teal-100 dark:hover:bg-gray-700" aria-label={translate('Edit article')}>
                        <PencilIcon className="h-4 w-4 text-teal-600 dark:text-teal-400"/>
                    </button>
                    <button onClick={handleDelete} className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-md hover:bg-red-100 dark:hover:bg-gray-700" aria-label={translate('Delete article')}>
                        <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-400"/>
                    </button>
                </div>
            )}
        </>
    );
};

export default NewsCard;