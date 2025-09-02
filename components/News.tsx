import React, { useState, useEffect } from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import { generateSummaryFromTitle } from '../services/summarizationService';
import type { NewsArticle, User } from '../types';
import { UserRole } from '../types';
import NewsCard from './NewsCard';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import NewsEditModal from './NewsCreatorModal';
import ErrorMessage from './ErrorMessage';

interface NewsProps {
    currentUser: User;
    latestNews: NewsArticle[];
    previousNews: NewsArticle[];
    onSave: (article: NewsArticle) => void;
    onDelete: (articleId: string) => void;
}

const News: React.FC<NewsProps> = ({ currentUser, latestNews, previousNews, onSave, onDelete }) => {
    const [displayLatestNews, setDisplayLatestNews] = useState<NewsArticle[]>(latestNews);
    const [displayPreviousNews, setDisplayPreviousNews] = useState<NewsArticle[]>(previousNews);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ article: NewsArticle | null; type: 'latest' | 'previous' }>({ article: null, type: 'latest' });
    
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId } = useTTS();
    const isOfficial = currentUser.role === UserRole.GOVERNMENT_OFFICIAL;

    useEffect(() => {
        setDisplayLatestNews(latestNews);
    }, [latestNews]);

    useEffect(() => {
        setDisplayPreviousNews(previousNews);
    }, [previousNews]);

    // This effect enriches AI-fetched articles that have a poor summary
    useEffect(() => {
        const MIN_SUMMARY_WORDS = 5;

        const enrichAndSetNews = async (
            articles: NewsArticle[], 
            setNewsState: React.Dispatch<React.SetStateAction<NewsArticle[]>>
        ) => {
             for (let i = 0; i < articles.length; i++) {
                const article = articles[i];
                const needsEnrichment = !article.id.startsWith('user-') && (!article.summary || article.summary.split(' ').length < MIN_SUMMARY_WORDS);

                if (needsEnrichment) {
                    setNewsState(currentNews => 
                        currentNews.map(a => a.id === article.id ? { ...a, isSummarizing: true } : a)
                    );

                    try {
                        const newSummary = await generateSummaryFromTitle(article.title, article.summary);
                        setNewsState(currentNews => 
                            currentNews.map(a => a.id === article.id ? { ...a, summary: newSummary, isSummarizing: false } : a)
                        );
                    } catch (e) {
                        console.error("Failed to generate summary for:", article.title, e);
                        setNewsState(currentNews => 
                            currentNews.map(a => a.id === article.id ? { ...a, isSummarizing: false } : a)
                        );
                    }
                }
            }
        };

        enrichAndSetNews(displayLatestNews, setDisplayLatestNews);
        enrichAndSetNews(displayPreviousNews, setDisplayPreviousNews);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [latestNews, previousNews]); // Run only when props change

    const handleOpenModal = (article: NewsArticle | null, type: 'latest' | 'previous') => {
        setModalConfig({ article, type });
        setIsModalOpen(true);
    };
    
    const handleSaveArticle = (articleData: Omit<NewsArticle, 'id'> & { id?: string }) => {
        const finalArticleData: NewsArticle = {
            id: articleData.id || '',
            title: articleData.title,
            summary: articleData.summary,
            imageUrl: articleData.imageUrl,
            source: articleData.source,
            link: articleData.link,
            type: articleData.type,
        };
        onSave(finalArticleData);
        setIsModalOpen(false);
    };

    const headerText = translate('News Portal');
    const subHeaderText = translate('Stay informed about recent meteorological events and learn from historical disasters.');

    useEffect(() => {
        const textsToRead: TTSText[] = [{ id: 'news-header', text: headerText }, { id: 'news-subheader', text: subHeaderText }];
        if (displayLatestNews.length > 0) {
            textsToRead.push({ id: 'latest-findings-header', text: translate('Latest Findings') });
            displayLatestNews.forEach(article => {
                textsToRead.push({ id: `article-${article.type}-${article.id}-title`, text: translate(article.title) });
                textsToRead.push({ id: `article-${article.type}-${article.id}-summary`, text: translate(article.summary) });
            });
        }
        if (displayPreviousNews.length > 0) {
            textsToRead.push({ id: 'previous-findings-header', text: translate('Previous Findings') });
            displayPreviousNews.forEach(article => {
                textsToRead.push({ id: `article-${article.type}-${article.id}-title`, text: translate(article.title) });
                textsToRead.push({ id: `article-${article.type}-${article.id}-summary`, text: translate(article.summary) });
            });
        }
        registerTexts(textsToRead);
    }, [displayLatestNews, displayPreviousNews, headerText, subHeaderText, translate, registerTexts]);

    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden animate-pulse">
                    <div className="w-full h-44 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="p-5">
                        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div>
            <div className="mb-8">
                <h1 id="news-header" className={`text-4xl font-extrabold text-gray-800 dark:text-white ${currentlySpokenId === 'news-header' ? 'tts-highlight' : ''}`}>{headerText}</h1>
                <p id="news-subheader" className={`text-gray-600 dark:text-gray-400 mt-2 ${currentlySpokenId === 'news-subheader' ? 'tts-highlight' : ''}`}>{subHeaderText}</p>
            </div>
            
            {error && <ErrorMessage message={error} />}

            <section className="mb-12">
                <div className="flex justify-between items-center mb-6 border-b-2 border-teal-500 pb-2">
                    <h2 id="latest-findings-header" className={`text-3xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === 'latest-findings-header' ? 'tts-highlight' : ''}`}>{translate('Latest Findings')}</h2>
                    {isOfficial && (
                        <button onClick={() => handleOpenModal(null, 'latest')} className="flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 transition-colors">
                            <PlusCircleIcon className="h-6 w-6"/>
                            <span>{translate('Add News Article')}</span>
                        </button>
                    )}
                </div>
                {isLoading ? renderSkeletons() : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {displayLatestNews.map((article) => <NewsCard key={article.id} article={article} currentUser={currentUser} onEdit={handleOpenModal} onDelete={onDelete} />)}
                    </div>
                )}
            </section>
            
             <section>
                <div className="flex justify-between items-center mb-6 border-b-2 border-gray-400 pb-2">
                    <h2 id="previous-findings-header" className={`text-3xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === 'previous-findings-header' ? 'tts-highlight' : ''}`}>{translate('Previous Findings')}</h2>
                     {isOfficial && (
                        <button onClick={() => handleOpenModal(null, 'previous')} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
                            <PlusCircleIcon className="h-6 w-6"/>
                            <span>{translate('Add News Article')}</span>
                        </button>
                     )}
                </div>
                {isLoading ? renderSkeletons() : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {displayPreviousNews.map((article) => <NewsCard key={article.id} article={article} currentUser={currentUser} onEdit={handleOpenModal} onDelete={onDelete} />)}
                    </div>
                )}
            </section>
            
            {isModalOpen && (
                <NewsEditModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveArticle}
                    type={modalConfig.type}
                    existingArticle={modalConfig.article}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

export default News;