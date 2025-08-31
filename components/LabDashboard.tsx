import React, { useEffect } from 'react';
import type { LearningModule, LabScore, User, Quiz } from '../types';
import { UserRole } from '../types';
import LabCard from './LabCard';
import DemoCertificate from './DemoCertificate';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, TTSText } from '../contexts/TTSContext';
import { AwardIcon } from './icons/AwardIcon';
import { CertificateIcon } from './icons/CertificateIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

interface LabDashboardProps {
  user: User;
  modules: LearningModule[];
  labScores: Record<string, LabScore>;
  onStartSimulation: (module: LearningModule) => void;
  onViewFinalCertificate: () => void;
  onOpenQuizEditor: (forModule: LearningModule) => void;
  onDisableLab: (moduleId: string) => void;
}

const LabDashboard: React.FC<LabDashboardProps> = ({ user, modules, labScores, onStartSimulation, onViewFinalCertificate, onOpenQuizEditor, onDisableLab }) => {
  const { translate } = useTranslate();
  const { registerTexts, currentlySpokenId } = useTTS();
  const isOfficial = user.role === UserRole.GOVERNMENT_OFFICIAL;

  const modulesWithLab = modules.filter(m => m.hasLab);
  const modulesWithoutLab = isOfficial ? modules.filter(m => !m.hasLab) : [];

  const completedLabs = Object.values(labScores).filter(score => score.score >= 75).length;
  const totalLabs = modulesWithLab.length;
  const overallProgress = totalLabs > 0 ? Math.round((completedLabs / totalLabs) * 100) : 0;

  const headerText = translate('Disaster Simulations Lab');
  const subHeaderText = translate('Apply your knowledge in real-world scenarios to test your preparedness.');

  useEffect(() => {
    const textsToRead: TTSText[] = [
      { id: 'lab-dashboard-header', text: headerText },
      { id: 'lab-dashboard-subheader', text: subHeaderText },
    ];
    if (totalLabs > 0) {
        textsToRead.push({ id: 'lab-progress-header', text: translate('Overall Lab Progress') });
        textsToRead.push({ id: 'lab-progress-desc', text: `${translate('You have passed')} ${completedLabs} ${translate('out of')} ${totalLabs} ${translate('simulations.')}` });
    }

    modulesWithLab.forEach(module => {
      const labScore = labScores[module.id];
      const isPassed = labScore && labScore.score >= 75;

      textsToRead.push({ id: `lab-card-title-${module.id}`, text: translate(module.title) });
      textsToRead.push({ id: `lab-card-type-${module.id}`, text: `${translate(module.hazardType)} ${translate('Simulation')}` });

      if (isPassed) {
        textsToRead.push({ id: `lab-card-status-1-${module.id}`, text: translate('Passed!') });
        textsToRead.push({ id: `lab-card-status-2-${module.id}`, text: `${translate('Score')}: ${labScore.score}%` });
      } else if (labScore) {
        textsToRead.push({ id: `lab-card-status-1-${module.id}`, text: translate('Try Again') });
        textsToRead.push({ id: `lab-card-status-2-${module.id}`, text: `${translate('Last Score')}: ${labScore.score}%` });
      } else {
        textsToRead.push({ id: `lab-card-status-1-${module.id}`, text: translate('Not Attempted') });
        textsToRead.push({ id: `lab-card-status-2-${module.id}`, text: translate('Test your skills') });
      }
    });

    registerTexts(textsToRead);
  }, [modulesWithLab, labScores, registerTexts, translate, headerText, subHeaderText, completedLabs, totalLabs]);

  return (
    <div>
      <div className="mb-8">
        <h2 
          id="lab-dashboard-header"
          className={`text-4xl font-extrabold text-gray-800 dark:text-white ${currentlySpokenId === 'lab-dashboard-header' ? 'tts-highlight' : ''}`}
        >
          {headerText}
        </h2>
        <p 
          id="lab-dashboard-subheader"
          className={`text-gray-600 dark:text-gray-400 mt-2 ${currentlySpokenId === 'lab-dashboard-subheader' ? 'tts-highlight' : ''}`}
        >
          {subHeaderText}
        </p>
      </div>

      {totalLabs > 0 && (
        <>
            <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                <h3 id="lab-progress-header" className={`text-2xl font-bold text-gray-800 dark:text-white mb-3 ${currentlySpokenId === 'lab-progress-header' ? 'tts-highlight' : ''}`}>{translate('Overall Lab Progress')}</h3>
                <div className="flex items-center gap-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div
                    className="bg-teal-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                    ></div>
                </div>
                <span className="font-bold text-lg text-teal-600 dark:text-teal-400">{overallProgress}%</span>
                </div>
                <p id="lab-progress-desc" className={`text-sm text-gray-500 dark:text-gray-400 mt-2 ${currentlySpokenId === 'lab-progress-desc' ? 'tts-highlight' : ''}`}>
                {translate('You have passed')} {completedLabs} {translate('out of')} {totalLabs} {translate('simulations.')}
                </p>
            </div>

            {overallProgress >= 70 ? (
                <div className="my-12 p-8 text-center bg-emerald-50 dark:bg-emerald-900/50 rounded-2xl border-2 border-dashed border-emerald-500">
                    <AwardIcon className="h-20 w-20 text-emerald-500 mx-auto" />
                    <h3 className="text-3xl font-bold text-emerald-800 dark:text-emerald-200 mt-4">{translate('Congratulations!')}</h3>
                    <p className="text-lg text-emerald-700 dark:text-emerald-300 mt-2 max-w-2xl mx-auto">{translate('You have successfully completed all simulations and earned your certificate. You are officially Surksha!')}</p>
                    <button
                        onClick={onViewFinalCertificate}
                        className="mt-6 flex items-center justify-center mx-auto space-x-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-lg transition-colors py-3 px-8 rounded-full shadow-lg hover:shadow-xl"
                    >
                        <CertificateIcon className="h-6 w-6" />
                        <span>{translate('View Your Certificate')}</span>
                    </button>
                </div>
            ) : (
                <div className="my-12">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">{translate('Your Final Reward')}</h3>
                    <DemoCertificate user={user} />
                </div>
            )}
        </>
      )}

      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{translate('Available Simulations')}</h3>
      {modulesWithLab.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modulesWithLab.map(module => (
            <LabCard
                key={module.id}
                module={module}
                labScore={labScores[module.id]}
                onStartSimulation={onStartSimulation}
                currentlySpokenId={currentlySpokenId}
                currentUser={user}
                onOpenQuizEditor={onOpenQuizEditor}
                onDisableLab={onDisableLab}
            />
            ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
            <p>{translate('No lab simulations are currently available.')}</p>
        </div>
      )}

      {isOfficial && modulesWithoutLab.length > 0 && (
        <div className="mt-12">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{translate('Modules without a Lab')}</h3>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-4">
                {modulesWithoutLab.map(module => (
                    <div key={module.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">{translate(module.title)}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{translate('No quiz/simulation is linked to this module.')}</p>
                        </div>
                        <button
                            onClick={() => onOpenQuizEditor(module)}
                            className="flex items-center gap-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors"
                        >
                            <PlusCircleIcon className="h-5 w-5" />
                            <span>{translate('Create Lab')}</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

    </div>
  );
};

export default LabDashboard;