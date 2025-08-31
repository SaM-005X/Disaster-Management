import React from 'react';
import type { LearningModule, QuizScore, LabScore, User } from '../types';
import { UserRole } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { ClipboardCheckIcon } from './icons/ClipboardCheckIcon';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS } from '../contexts/TTSContext';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ModuleCardProps {
  module: LearningModule;
  onSelectModule: (module: LearningModule) => void;
  onStartQuiz: (moduleId: string) => void;
  quizScore?: QuizScore;
  labScore?: LabScore;
  progress: number;
  currentUser: User | null;
  onEdit: (module: LearningModule) => void;
  onDelete: (moduleId: string) => void;
}

const getHazardColors = (hazard: string) => {
  switch (hazard) {
    case 'Earthquake': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300';
    case 'Flood': return 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300';
    case 'Fire': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300';
    case 'Cyclone': return 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300';
    case 'Tsunami': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300';
    case 'Thunderstorm': return 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-300';
    case 'Chemical Spill': return 'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const ModuleCard: React.FC<ModuleCardProps> = ({ module, onSelectModule, onStartQuiz, quizScore, labScore, progress, currentUser, onEdit, onDelete }) => {
  const { translate } = useTranslate();
  const { currentlySpokenId } = useTTS();
  const isComplete = progress === 100;

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl flex flex-col group">
      <img className="w-full h-44 object-cover" src={module.thumbnailUrl} alt={module.title} />
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start">
            <h3 id={`module-${module.id}-title`} className={`text-xl font-bold text-gray-900 dark:text-white flex-1 ${currentlySpokenId === `module-${module.id}-title` ? 'tts-highlight' : ''}`}>{translate(module.title)}</h3>
            <span id={`module-${module.id}-hazard`} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getHazardColors(module.hazardType)} ${currentlySpokenId === `module-${module.id}-hazard` ? 'tts-highlight' : ''}`}>{translate(module.hazardType)}</span>
        </div>
        <p id={`module-${module.id}-desc`} className={`text-gray-600 dark:text-gray-400 mt-2 text-sm flex-grow ${currentlySpokenId === `module-${module.id}-desc` ? 'tts-highlight' : ''}`}>{translate(module.description)}</p>
        
        {(quizScore || labScore || progress > 0) && (
           <div className="mt-4 space-y-3">
             <div>
                <div className="flex justify-between items-center mb-1">
                  <span id={`module-${module.id}-progress-label`} className={`text-xs font-semibold text-gray-500 dark:text-gray-400 ${currentlySpokenId === `module-${module.id}-progress-label` ? 'tts-highlight' : ''}`}>{translate('Progress')}</span>
                  {isComplete ? (
                    <div id={`module-${module.id}-progress-status`} className={`flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 ${currentlySpokenId === `module-${module.id}-progress-status` ? 'tts-highlight' : ''}`}>
                      <CheckCircleIcon className="h-4 w-4" />
                      {translate('Complete')}
                    </div>
                  ) : (
                    <span id={`module-${module.id}-progress-status`} className={`text-xs font-bold text-teal-600 dark:text-teal-400 ${currentlySpokenId === `module-${module.id}-progress-status` ? 'tts-highlight' : ''}`}>{progress}%</span>
                  )}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`${isComplete ? 'bg-emerald-600' : 'bg-teal-600'} h-2 rounded-full`}
                    style={{ width: `${progress}%` }}
                    aria-label={`${translate('Progress')}: ${progress}%`}
                  ></div>
                </div>
              </div>
             <div id={`module-${module.id}-scores`} className="sr-only">
                {quizScore ? `${translate('Quiz Score')}: ${quizScore.score}/${quizScore.totalQuestions}.` : ''}
                {labScore ? ` ${translate('Lab Score')}: ${labScore.score}%.` : ''}
             </div>
           </div>
        )}

      </div>
       <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onSelectModule(module)}
          className="w-full flex items-center justify-center space-x-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold text-sm transition-colors py-2 px-4 rounded-full"
        >
          <BookOpenIcon className="h-5 w-5" />
          <span id={`module-${module.id}-read-btn`} className={currentlySpokenId === `module-${module.id}-read-btn` ? 'tts-highlight' : ''}>{translate('Read Module')}</span>
        </button>
        <button
          onClick={() => onStartQuiz(module.id)}
          disabled={!module.hasLab}
          className="w-full flex items-center justify-center space-x-2 bg-teal-600 text-white hover:bg-teal-700 font-semibold text-sm transition-colors py-2 px-4 rounded-full disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          <ClipboardCheckIcon className="h-5 w-5" />
          <span id={`module-${module.id}-quiz-btn`} className={currentlySpokenId === `module-${module.id}-quiz-btn` ? 'tts-highlight' : ''}>{translate('Take Quiz')}</span>
        </button>
      </div>
      
      {currentUser?.role === UserRole.GOVERNMENT_OFFICIAL && (
        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={() => onEdit(module)} 
                className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-md hover:bg-teal-100 dark:hover:bg-gray-700"
                aria-label={translate('Edit module')}
            >
                <PencilIcon className="h-5 w-5 text-teal-600 dark:text-teal-400"/>
            </button>
            <button 
                onClick={() => onDelete(module.id)}
                className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-md hover:bg-red-100 dark:hover:bg-gray-700"
                aria-label={translate('Delete module')}
            >
                <TrashIcon className="h-5 w-5 text-red-600 dark:text-red-400"/>
            </button>
        </div>
      )}
    </div>
  );
};

export default ModuleCard;