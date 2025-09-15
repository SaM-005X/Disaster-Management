import React, { useEffect, useState, useMemo } from 'react';
import type { LearningModule, QuizScore, User, Resource, HistoricalDisaster, LabScore } from '../types';
import { UserRole } from '../types';
import ModuleCard from './ModuleCard';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import GovernmentWidgets from './GovernmentWidgets';
import { Theme } from '../App';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { FilterIcon } from './icons/FilterIcon';

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
  isOnline: boolean;
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
  onAddModule, onEditModule, onDeleteModule,
  isOnline
}) => {
  const { translate } = useTranslate();
  const { registerTexts, currentlySpokenId } = useTTS();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    modules.forEach(module => {
      module.regionTags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [modules]);

  const filteredModules = useMemo(() => {
    if (selectedTags.length === 0) {
      return modules;
    }
    return modules.filter(module =>
      selectedTags.some(selectedTag => module.regionTags.includes(selectedTag))
    );
  }, [modules, selectedTags]);
  
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilter = () => {
    setSelectedTags([]);
  };

  const headerText = translate('Learning Modules');
  const subHeaderText = translate('Select a module to learn about disaster preparedness.');

  useEffect(() => {
    const textsToRead: TTSText[] = [
      { id: 'dashboard-header', text: headerText },
      { id: 'dashboard-subheader', text: subHeaderText },
    ];
    filteredModules.forEach(module => {
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
  }, [filteredModules, quizScores, labScores, registerTexts, translate, headerText, subHeaderText]);

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
            isOnline={isOnline}
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

      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <FilterIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{translate('Filter by Region')}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={clearFilter}
            className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-colors ${selectedTags.length === 0 ? 'bg-teal-600 text-white border-teal-600' : 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-teal-500 hover:text-teal-600 dark:hover:border-teal-400 dark:hover:text-teal-400'}`}
          >
            {translate('All Regions')}
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-colors ${selectedTags.includes(tag) ? 'bg-teal-600 text-white border-teal-600' : 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-teal-500 hover:text-teal-600 dark:hover:border-teal-400 dark:hover:text-teal-400'}`}
            >
              {translate(tag)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.length > 0 ? (
          filteredModules.map(module => (
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
          ))
        ) : (
           <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12 text-gray-500 dark:text-gray-400">
                <p className="text-xl font-semibold">{translate('No modules found for the selected regions.')}</p>
                <p>{translate('Try selecting different region tags or clearing the filter.')}</p>
            </div>
        )}
         {user?.role === UserRole.GOVERNMENT_OFFICIAL && (
            <AddModuleCard onClick={onAddModule} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;