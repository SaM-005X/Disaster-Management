import React, { useEffect } from 'react';
import type { LearningModule, QuizScore, User, Resource, HistoricalDisaster, LabScore } from '../types';
import { UserRole } from '../types';
import ModuleCard from './ModuleCard';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import GovernmentWidgets from './GovernmentWidgets';
import { Theme } from '../App';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

interface DashboardProps {
  modules: LearningModule[];
  onSelectModule: (module: LearningModule) => void;
  onStartQuiz: (moduleId: string) => void;
  quizScores: Record<string, QuizScore>;
  labScores: Record<string, LabScore>; // Added for more detailed TTS
  user: User | null;
  theme: Theme;
  resources: Resource[];
  historicalDisasters: HistoricalDisaster[];
  onAddResource: (data: Omit<Resource, 'id' | 'lastUpdated'>) => void;
  onUpdateResource: (data: Omit<Resource, 'lastUpdated'> & { id: string }) => void;
  onDeleteResource: (id: string) => void;
  onAddDisaster: (data: Omit<HistoricalDisaster, 'id'>) => void;
  onUpdateDisaster: (data: HistoricalDisaster) => void;
  onDeleteDisaster: (id: string) => void;
  onAddModule: () => void;
  onEditModule: (module: LearningModule) => void;
  onDeleteModule: (moduleId: string) => void;
}

const AddModuleCard: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const { translate } = useTranslate();
    return (
        <button
            onClick={onClick}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-gray-500 dark:text-gray-400 hover:border-teal-500 hover:text-teal-600 dark:hover:border-teal-400 dark:hover:text-teal-400 transition-all duration-300"
        >
            <PlusCircleIcon className="h-16 w-16" />
            <p className="mt-4 text-xl font-bold">{translate('Add New Module')}</p>
            <p className="mt-1 text-sm">{translate('Create a new learning module for all users.')}</p>
        </button>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ 
  modules, onSelectModule, onStartQuiz, quizScores, labScores, user, theme,
  resources, historicalDisasters,
  onAddResource, onUpdateResource, onDeleteResource,
  onAddDisaster, onUpdateDisaster, onDeleteDisaster,
  onAddModule, onEditModule, onDeleteModule
}) => {
  const { translate } = useTranslate();
  const { registerTexts, currentlySpokenId } = useTTS();

  const headerText = translate('Learning Modules');
  const subHeaderText = translate('Select a module to learn about disaster preparedness.');

  useEffect(() => {
    const textsToRead: TTSText[] = [
      { id: 'dashboard-header', text: headerText },
      { id: 'dashboard-subheader', text: subHeaderText },
    ];
    modules.forEach(module => {
      textsToRead.push({ id: `module-${module.id}-title`, text: translate(module.title) });
      textsToRead.push({ id: `module-${module.id}-hazard`, text: translate(module.hazardType) });
      textsToRead.push({ id: `module-${module.id}-desc`, text: translate(module.description) });
      
      const progress = module.progress || 0;
      textsToRead.push({ id: `module-${module.id}-progress-label`, text: translate('Progress') });
      textsToRead.push({ id: `module-${module.id}-progress-status`, text: `${progress}%` });

      const quizScore = quizScores[module.quizId || ''];
      const labScore = labScores[module.id];
      const quizText = quizScore ? `${translate('Quiz Score')}: ${quizScore.score}/${quizScore.totalQuestions}` : translate('Quiz not taken.');
      const labText = labScore ? `${translate('Lab Score')}: ${labScore.score}%` : translate('Lab not taken.');
      
      textsToRead.push({ id: `module-${module.id}-scores`, text: `${quizText}. ${labText}.` });

      textsToRead.push({ id: `module-${module.id}-read-btn`, text: translate('Read Module') });
      textsToRead.push({ id: `module-${module.id}-quiz-btn`, text: translate('Take Quiz') });
    });
    registerTexts(textsToRead);
  }, [modules, quizScores, labScores, registerTexts, translate, headerText, subHeaderText]);

  return (
    <div>
      {user?.role === UserRole.GOVERNMENT_OFFICIAL && (
        <GovernmentWidgets 
            user={user} 
            theme={theme}
            resources={resources}
            historicalDisasters={historicalDisasters}
            onAddResource={onAddResource}
            onUpdateResource={onUpdateResource}
            onDeleteResource={onDeleteResource}
            onAddDisaster={onAddDisaster}
            onUpdateDisaster={onUpdateDisaster}
            onDeleteDisaster={onDeleteDisaster}
        />
      )}
      <div className="mb-8">
        <h2 
          id="dashboard-header"
          className={`text-4xl font-extrabold text-gray-800 dark:text-white ${currentlySpokenId === 'dashboard-header' ? 'tts-highlight' : ''}`}
        >
          {headerText}
        </h2>
        <p 
          id="dashboard-subheader"
          className={`text-gray-600 dark:text-gray-400 mt-2 ${currentlySpokenId === 'dashboard-subheader' ? 'tts-highlight' : ''}`}
        >
          {subHeaderText}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(module => {
          return (
            <ModuleCard
              key={module.id}
              module={module}
              onSelectModule={onSelectModule}
              onStartQuiz={onStartQuiz}
              quizScore={quizScores[module.quizId || '']}
              labScore={labScores[module.id]}
              progress={module.progress || 0}
              currentUser={user}
              onEdit={onEditModule}
              onDelete={onDeleteModule}
            />
          );
        })}
         {user?.role === UserRole.GOVERNMENT_OFFICIAL && (
            <AddModuleCard onClick={onAddModule} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;