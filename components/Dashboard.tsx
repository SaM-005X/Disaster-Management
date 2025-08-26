import React from 'react';
import type { LearningModule, QuizScore } from '../types';
import ModuleCard from './ModuleCard';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS } from '../contexts/TTSContext';

interface DashboardProps {
  modules: LearningModule[];
  onSelectModule: (module: LearningModule) => void;
  onStartQuiz: (moduleId: string) => void;
  quizScores: Record<string, QuizScore>;
}

const Dashboard: React.FC<DashboardProps> = ({ modules, onSelectModule, onStartQuiz, quizScores }) => {
  const { translate } = useTranslate();
  const { currentlySpokenId } = useTTS();

  const headerText = translate('Learning Modules');
  const subHeaderText = translate('Select a module to learn about disaster preparedness.');

  return (
    <div>
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