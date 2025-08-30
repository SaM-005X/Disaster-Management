import React, { useEffect } from 'react';
import type { LearningModule, QuizScore, User, Resource, HistoricalDisaster } from '../types';
import { UserRole } from '../types';
import ModuleCard from './ModuleCard';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import GovernmentWidgets from './GovernmentWidgets';
import { Theme } from '../App';

interface DashboardProps {
  modules: LearningModule[];
  onSelectModule: (module: LearningModule) => void;
  onStartQuiz: (moduleId: string) => void;
  quizScores: Record<string, QuizScore>;
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
}

const Dashboard: React.FC<DashboardProps> = ({ 
  modules, onSelectModule, onStartQuiz, quizScores, user, theme,
  resources, historicalDisasters,
  onAddResource, onUpdateResource, onDeleteResource,
  onAddDisaster, onUpdateDisaster, onDeleteDisaster
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
      const score = quizScores[module.quizId];
      if (score) {
        const progress = 100;
        textsToRead.push({ id: `module-${module.id}-progress-label`, text: translate('Progress') });
        textsToRead.push({ id: `module-${module.id}-progress-status`, text: `${progress}% ${translate('Complete')}` });
        textsToRead.push({ id: `module-${module.id}-score`, text: `${translate('Quiz Score')}: ${score.score}/${score.totalQuestions}` });
      }
      textsToRead.push({ id: `module-${module.id}-read-btn`, text: translate('Read Module') });
      textsToRead.push({ id: `module-${module.id}-quiz-btn`, text: translate('Take Quiz') });
    });
    registerTexts(textsToRead);
  }, [modules, quizScores, registerTexts, translate, headerText, subHeaderText]);

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
          const score = quizScores[module.quizId];
          const progress = score ? 100 : 0;
          return (
            <ModuleCard
              key={module.id}
              module={module}
              onSelectModule={onSelectModule}
              onStartQuiz={onStartQuiz}
              quizScore={quizScores[module.quizId]}
              progress={progress}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
