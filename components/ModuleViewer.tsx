import React, { useEffect } from 'react';
import type { LearningModule, ModuleContent, User } from '../types';
import { UserRole } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, TTSText } from '../contexts/TTSContext';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { ClipboardCheckIcon } from './icons/ClipboardCheckIcon';
import { LinkIcon } from './icons/LinkIcon';
import { WifiOffIcon } from './icons/WifiOffIcon';
import { PencilIcon } from './icons/PencilIcon';

interface ModuleViewerProps {
  module: LearningModule;
  onStartQuiz: (moduleId: string) => void;
  onBack: () => void;
  isOnline: boolean;
  currentUser: User | null;
  onEdit: () => void;
}

const ModuleContentViewer: React.FC<{ item: ModuleContent; index: number; currentlySpokenId: string | null; isOnline: boolean; }> = ({ item, index, currentlySpokenId, isOnline }) => {
    const { translate } = useTranslate();
    const baseId = `module-content-${index}`;

    switch (item.type) {
      case 'heading':
        return <h2 id={baseId} className={`text-3xl font-bold mt-8 mb-4 text-gray-800 dark:text-white ${currentlySpokenId === baseId ? 'tts-highlight' : ''}`}>{translate(item.content as string)}</h2>;
      case 'paragraph':
        return <p id={baseId} className={`text-gray-700 dark:text-gray-300 mb-4 leading-relaxed text-lg ${currentlySpokenId === baseId ? 'tts-highlight' : ''}`}>{translate(item.content as string)}</p>;
      case 'image':
        return <img src={item.content as string} alt="Module visual" className="my-6 rounded-xl shadow-lg w-full" />;
      case 'video':
        return (
          <div className="my-6 aspect-video w-full">
            {isOnline ? (
              <iframe
                className="w-full h-full rounded-xl shadow-lg"
                src={item.content as string}
                title={translate('Embedded video content')}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="w-full h-full rounded-xl bg-gray-200 dark:bg-gray-700 flex flex-col items-center justify-center text-center p-4">
                  <WifiOffIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-2"/>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">{translate('Video Unavailable Offline')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{translate('Please connect to the internet to watch this video.')}</p>
              </div>
            )}
          </div>
        );
      case 'list':
        return (
          <ul className="list-disc list-inside space-y-3 mb-4 pl-4 text-lg text-gray-700 dark:text-gray-300">
            {(item.content as string[]).map((li, liIndex) => {
                const itemId = `${baseId}-${liIndex}`;
                return <li key={itemId} id={itemId} className={`pl-2 ${currentlySpokenId === itemId ? 'tts-highlight' : ''}`}>{translate(li)}</li>
            })}
          </ul>
        );
      default:
        return null;
    }
};

const ModuleViewer: React.FC<ModuleViewerProps> = ({ module, onStartQuiz, onBack, isOnline, currentUser, onEdit }) => {
  const { translate } = useTranslate();
  const { registerTexts, currentlySpokenId } = useTTS();

  useEffect(() => {
    const textsToRead: TTSText[] = [];
    textsToRead.push({ id: 'module-hazard', text: translate(module.hazardType) });
    textsToRead.push({ id: 'module-title', text: translate(module.title) });
    textsToRead.push({ id: 'module-desc', text: translate(module.description) });

    module.content.forEach((item, index) => {
        const baseId = `module-content-${index}`;
        if (item.type === 'heading' || item.type === 'paragraph') {
            textsToRead.push({ id: baseId, text: translate(item.content as string) });
        } else if (item.type === 'list') {
            (item.content as string[]).forEach((li, liIndex) => {
                 textsToRead.push({ id: `${baseId}-${liIndex}`, text: translate(li) });
            });
        }
    });
    
    textsToRead.push({ id: 'quiz-prompt-heading', text: translate('Ready to test your knowledge?') });
    textsToRead.push({ id: 'quiz-prompt-desc', text: translate('Take the quiz to earn points and solidify your learning.') });

    registerTexts(textsToRead);
  }, [module, registerTexts, translate]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-10 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <button
            onClick={onBack}
            className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:underline font-semibold"
        >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>{translate('Back to Dashboard')}</span>
        </button>

        {currentUser?.role === UserRole.GOVERNMENT_OFFICIAL && (
            <button
                onClick={onEdit}
                className="flex items-center space-x-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors"
            >
                <PencilIcon className="h-5 w-5" />
                <span>{translate('Edit Module')}</span>
            </button>
        )}
      </div>

      <div className="border-b pb-6 mb-6 border-gray-200 dark:border-gray-700">
        <span id="module-hazard" className={`text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider ${currentlySpokenId === 'module-hazard' ? 'tts-highlight' : ''}`}>{translate(module.hazardType)}</span>
        <h1 id="module-title" className={`text-5xl font-extrabold text-gray-900 dark:text-white mt-2 ${currentlySpokenId === 'module-title' ? 'tts-highlight' : ''}`}>{translate(module.title)}</h1>
        <p id="module-desc" className={`text-gray-500 dark:text-gray-400 mt-3 text-xl ${currentlySpokenId === 'module-desc' ? 'tts-highlight' : ''}`}>{translate(module.description)}</p>
      </div>

      <article className="max-w-none">
        {module.content.map((item, index) => (
          <ModuleContentViewer key={index} item={item} index={index} currentlySpokenId={currentlySpokenId} isOnline={isOnline} />
        ))}
      </article>

      {module.references && module.references.length > 0 && (
        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center space-x-3">
            <LinkIcon className="h-6 w-6" />
            <span>{translate('Further Reading & References')}</span>
          </h3>
          <ul className="list-disc list-inside mt-4 space-y-2">
            {module.references.map((ref, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 dark:text-teal-400 hover:underline"
                >
                  {translate(ref.title)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {module.hasLab ? (
         <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8">
            <h3 id="quiz-prompt-heading" className={`text-2xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === 'quiz-prompt-heading' ? 'tts-highlight' : ''}`}>{translate('Ready to test your knowledge?')}</h3>
            <p id="quiz-prompt-desc" className={`text-gray-600 dark:text-gray-400 mt-2 mb-6 ${currentlySpokenId === 'quiz-prompt-desc' ? 'tts-highlight' : ''}`}>{translate('Take the quiz to earn points and solidify your learning.')}</p>
            <button
            onClick={() => onStartQuiz(module.id)}
            className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-emerald-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center mx-auto space-x-3"
            >
            <ClipboardCheckIcon className="h-6 w-6" />
            <span>{translate('Start Quiz')}</span>
            </button>
        </div>
      ) : (
         <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700 text-center bg-amber-50 dark:bg-amber-900/50 rounded-2xl p-8">
            <p className="font-semibold text-amber-800 dark:text-amber-200">{translate('No quiz is currently available for this module.')}</p>
            {currentUser?.role === UserRole.GOVERNMENT_OFFICIAL && (
                 <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{translate('Go to the Lab Dashboard to create a quiz for this module.')}</p>
            )}
        </div>
      )}
    </div>
  );
};

export default ModuleViewer;