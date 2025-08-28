import React, { useState, useEffect } from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import { fetchNews } from '../services/newsService';
import { generateSummaryFromTitle } from '../services/summarizationService';
import type { NewsArticle, User } from '../types';
import NewsCard from './NewsCard';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import NewsCreatorModal from './NewsCreatorModal';

interface NewsProps {
    currentUser: User;
}

const News: React.FC<NewsProps> = ({ currentUser }) => {
    const [latestNews, setLatestNews] = useState<NewsArticle[]>([]);
    const [previousNews, setPreviousNews] = useState<NewsArticle[]>([]);
    const [localNews, setLocalNews] = useState<NewsArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'latest' | 'previous'>('latest');
    
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId } = useTTS();

    useEffect(() => {
        const MIN_SUMMARY_WORDS = 5;

        const enrichAndSetNews = async (
            articles: NewsArticle[], 
            setNewsState: React.Dispatch<React.SetStateAction<NewsArticle[]>>
        ) => {
            const articlesToProcess = [...articles];

            for (let i = 0; i < articlesToProcess.length; i++) {
                const article = articlesToProcess[i];
                const needsEnrichment = !article.isLocal && (!article.summary || article.summary.split(' ').length < MIN_SUMMARY_WORDS);

                if (needsEnrichment) {
                    setNewsState(currentNews => 
                        currentNews.map(a => a.link === article.link ? { ...a, isSummarizing: true } : a)
                    );

                    try {
                        const newSummary = await generateSummaryFromTitle(article.title, article.summary);
                        setNewsState(currentNews => 
                            currentNews.map(a => a.link === article.link ? { ...a, summary: newSummary, isSummarizing: false } : a)
                        );
                    } catch (e) {
                        console.error("Failed to generate summary for:", article.title, e);
                        setNewsState(currentNews => 
                            currentNews.map(a => a.link === article.link ? { ...a, isSummarizing: false } : a)
                        );
                    }
                }
            }
        };

        const loadNews = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                try {
                    const savedLocalNewsJSON = localStorage.getItem('userNewsArticles');
                    if (savedLocalNewsJSON) {
                        const savedLocalNews = JSON.parse(savedLocalNewsJSON);
                        if (Array.isArray(savedLocalNews)) {
                            setLocalNews(savedLocalNews);
                        }
                    }
                } catch (e) {
                    console.error("Failed to load or parse user news articles from localStorage", e);
                    localStorage.removeItem('userNewsArticles');
                }

                const [latest, previous] = await Promise.all([
                    fetchNews('latest'),
                    fetchNews('previous')
                ]);
                
                setLatestNews(latest);
                setPreviousNews(previous);

                enrichAndSetNews(latest, setLatestNews);
                enrichAndSetNews(previous, setPreviousNews);

            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError(translate('An unknown error occurred while fetching news.'));
                }
            } finally {
                setIsLoading(false);
            }
        };
        loadNews();
    }, [translate]);

    const handleOpenModal = (type: 'latest' | 'previous') => {
        setModalType(type);
        setIsModalOpen(true);
    };
    
    const handleSaveArticle = (newArticleData: Omit<NewsArticle, 'isLocal' | 'status'>) => {
        const newArticle: NewsArticle = {
            ...newArticleData,
            isLocal: true,
            status: 'pending',
        };
        const updatedLocalNews = [...localNews, newArticle];
        setLocalNews(updatedLocalNews);
        try {
            localStorage.setItem('userNewsArticles', JSON.stringify(updatedLocalNews));
        } catch (e) {
            console.error("Failed to save user news articles to localStorage", e);
        }
        setIsModalOpen(false);
    };

    const headerText = translate('News Portal');
    const subHeaderText = translate('Stay informed about recent meteorological events and learn from historical disasters.');

    const allLatestNews = [...latestNews, ...localNews.filter(a => a.type === 'latest')];
    const allPreviousNews = [...previousNews, ...localNews.filter(a => a.type === 'previous')];

    useEffect(() => {
        const textsToRead: TTSText[] = [{ id: 'news-header', text: headerText }, { id: 'news-subheader', text: subHeaderText }];
        if (allLatestNews.length > 0) {
            textsToRead.push({ id: 'latest-findings-header', text: translate('Latest Findings') });
        }
        if (allPreviousNews.length > 0) {
            textsToRead.push({ id: 'previous-findings-header', text: translate('Previous Findings') });
        }
        registerTexts(textsToRead);
    }, [allLatestNews, allPreviousNews, headerText, subHeaderText, translate, registerTexts]);

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
            
            {error && (
                <div className="p-4 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/50 rounded-lg">
                    {error}
                </div>
            )}

            <section className="mb-12">
                <div className="flex justify-between items-center mb-6 border-b-2 border-teal-500 pb-2">
                    <h2 id="latest-findings-header" className={`text-3xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === 'latest-findings-header' ? 'tts-highlight' : ''}`}>{translate('Latest Findings')}</h2>
                    <button onClick={() => handleOpenModal('latest')} className="flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 transition-colors">
                        <PlusCircleIcon className="h-6 w-6"/>
                        <span>{translate('Add News Article')}</span>
                    </button>
                </div>
                {isLoading ? renderSkeletons() : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {allLatestNews.map((article, index) => <NewsCard key={`latest-${article.link}-${index}`} article={article} />)}
                    </div>
                )}
            </section>
            
             <section>
                <div className="flex justify-between items-center mb-6 border-b-2 border-gray-400 pb-2">
                    <h2 id="previous-findings-header" className={`text-3xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === 'previous-findings-header' ? 'tts-highlight' : ''}`}>{translate('Previous Findings')}</h2>
                    <button onClick={() => handleOpenModal('previous')} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
                        <PlusCircleIcon className="h-6 w-6"/>
                        <span>{translate('Add News Article')}</span>
                    </button>
                </div>
                {isLoading ? renderSkeletons() : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {allPreviousNews.map((article, index) => <NewsCard key={`previous-${article.link}-${index}`} article={article} />)}
                    </div>
                )}
            </section>
            
            {isModalOpen && (
                <NewsCreatorModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveArticle}
                    type={modalType}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

export default News;