import React, { useEffect } from 'react';
import type { LearningModule, QuizScore } from '../types';
import ModuleCard from './ModuleCard';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';

interface DashboardProps {
  modules: LearningModule[];
  onSelectModule: (module: LearningModule) => void;
  onStartQuiz: (moduleId: string) => void;
  quizScores: Record<string, QuizScore>;
}

const Dashboard: React.FC<DashboardProps> = ({ modules, onSelectModule, onStartQuiz, quizScores }) => {
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
