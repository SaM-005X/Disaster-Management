import React from 'react';
import type { LearningModule, LabScore, User } from '../types';
import { UserRole } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { BeakerIcon } from './icons/BeakerIcon';
import { AwardIcon } from './icons/AwardIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface LabCardProps {
  module: LearningModule;
  labScore?: LabScore;
  onStartSimulation: (module: LearningModule) => void;
  currentlySpokenId: string | null;
  currentUser: User;
  onOpenQuizEditor: (forModule: LearningModule) => void;
  onDisableLab: (moduleId: string) => void;
}

const getHazardColors = (hazard: string) => {
  switch (hazard) {
    case 'Earthquake': return 'border-amber-500';
    case 'Flood': return 'border-sky-500';
    case 'Fire': return 'border-rose-500';
    case 'Cyclone': return 'border-violet-500';
    case 'Tsunami': return 'border-cyan-500';
    case 'Thunderstorm': return 'border-fuchsia-500';
    case 'Chemical Spill': return 'border-lime-500';
    default: return 'border-gray-500';
  }
};

const LabCard: React.FC<LabCardProps> = ({ module, labScore, onStartSimulation, currentlySpokenId, currentUser, onOpenQuizEditor, onDisableLab }) => {
  const { translate } = useTranslate();
  const isPassed = labScore && labScore.score >= 75;
  const isOfficial = currentUser.role === UserRole.GOVERNMENT_OFFICIAL;

  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl flex flex-col border-t-4 ${getHazardColors(module.hazardType)} group`}>
      <div className="p-5 flex-grow flex flex-col">
        <h3 id={`lab-card-title-${module.id}`} className={`text-xl font-bold text-gray-900 dark:text-white ${currentlySpokenId === `lab-card-title-${module.id}` ? 'tts-highlight' : ''}`}>{translate(module.title)}</h3>
        <p id={`lab-card-type-${module.id}`} className={`text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1 ${currentlySpokenId === `lab-card-type-${module.id}` ? 'tts-highlight' : ''}`}>{translate(module.hazardType)} {translate('Simulation')}</p>
        
        <div className="mt-4 flex-grow">
          {isPassed ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg flex flex-col items-center text-center">
                <AwardIcon className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
                <p id={`lab-card-status-1-${module.id}`} className={`mt-2 text-lg font-bold text-emerald-800 dark:text-emerald-200 ${currentlySpokenId === `lab-card-status-1-${module.id}` ? 'tts-highlight' : ''}`}>{translate('Passed!')}</p>
                <p id={`lab-card-status-2-${module.id}`} className={`text-sm font-semibold text-emerald-700 dark:text-emerald-300 ${currentlySpokenId === `lab-card-status-2-${module.id}` ? 'tts-highlight' : ''}`}>{translate('Score')}: {labScore.score}%</p>
            </div>
          ) : labScore ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/50 rounded-lg flex flex-col items-center text-center">
                <BeakerIcon className="h-10 w-10 text-amber-500 dark:text-amber-400" />
                <p id={`lab-card-status-1-${module.id}`} className={`mt-2 text-lg font-bold text-amber-800 dark:text-amber-200 ${currentlySpokenId === `lab-card-status-1-${module.id}` ? 'tts-highlight' : ''}`}>{translate('Try Again')}</p>
                <p id={`lab-card-status-2-${module.id}`} className={`text-sm font-semibold text-amber-700 dark:text-amber-300 ${currentlySpokenId === `lab-card-status-2-${module.id}` ? 'tts-highlight' : ''}`}>{translate('Last Score')}: {labScore.score}%</p>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col items-center text-center">
                <BeakerIcon className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                <p id={`lab-card-status-1-${module.id}`} className={`mt-2 text-lg font-bold text-gray-800 dark:text-gray-200 ${currentlySpokenId === `lab-card-status-1-${module.id}` ? 'tts-highlight' : ''}`}>{translate('Not Attempted')}</p>
                <p id={`lab-card-status-2-${module.id}`} className={`text-sm font-semibold text-gray-600 dark:text-gray-300 ${currentlySpokenId === `lab-card-status-2-${module.id}` ? 'tts-highlight' : ''}`}>{translate('Test your skills')}</p>
            </div>
          )}
        </div>
      </div>
      <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={() => onStartSimulation(module)}
          className="w-full flex items-center justify-center space-x-2 bg-teal-600 text-white hover:bg-teal-700 font-semibold text-sm transition-colors py-3 px-4 rounded-full shadow-md hover:shadow-lg"
        >
          <BeakerIcon className="h-5 w-5" />
          <span>{isPassed ? translate('Retake Simulation') : translate('Start Simulation')}</span>
        </button>
      </div>

       {isOfficial && (
        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={() => onOpenQuizEditor(module)}
                className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-md hover:bg-teal-100 dark:hover:bg-gray-700"
                aria-label={translate('Edit quiz')}
            >
                <PencilIcon className="h-5 w-5 text-teal-600 dark:text-teal-400"/>
            </button>
            <button 
                onClick={() => onDisableLab(module.id)}
                className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-md hover:bg-red-100 dark:hover:bg-gray-700"
                aria-label={translate('Disable lab')}
            >
                <TrashIcon className="h-5 w-5 text-red-600 dark:text-red-400"/>
            </button>
        </div>
      )}
    </div>
  );
};

export default LabCard;