import React, { useMemo } from 'react';
import type { User, LearningModule, StudentProgress } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import LineChart from './charts/LineChart';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface StudentProgressViewProps {
  user: User;
  modules: LearningModule[];
  progress: StudentProgress;
}

const StudentProgressView: React.FC<StudentProgressViewProps> = ({ user, modules, progress }) => {
    const { translate } = useTranslate();

    const completedModulesCount = useMemo(() => {
        return modules.filter(module => {
            const quizDone = progress.quizScores[module.quizId];
            const labDone = progress.labScores[module.id] && progress.labScores[module.id].score >= 75;
            return quizDone && labDone;
        }).length;
    }, [modules, progress]);

    const chartData = useMemo(() => {
        if (completedModulesCount === 0) {
            return [{ x: 0, y: 0 }, { x: progress.timeSpent, y: 0 }];
        }
        const points = [{ x: 0, y: 0 }];
        const timePerModule = progress.timeSpent / completedModulesCount;
        for (let i = 1; i <= completedModulesCount; i++) {
            points.push({ x: timePerModule * i, y: i });
        }
        if (progress.timeSpent > timePerModule * completedModulesCount) {
             points.push({ x: progress.timeSpent, y: completedModulesCount });
        }
        return points;
    }, [completedModulesCount, progress.timeSpent]);
    
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">{translate('My Progress')}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{translate('Track your journey to becoming Disaster Ready.')}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md mb-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{translate('Learning Pace')}</h2>
                <div className="h-64">
                    <LineChart 
                        data={chartData} 
                        xAxisLabel={translate('Total Time Spent (Hours)')} 
                        yAxisLabel={translate('Modules Completed')} 
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
                 <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{translate('Detailed Progress Breakdown')}</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {modules.map(module => {
                        const quizScore = progress.quizScores[module.quizId];
                        const labScore = progress.labScores[module.id];
                        const isQuizPassed = quizScore && (quizScore.score / quizScore.totalQuestions) >= 0.8;
                        const isLabPassed = labScore && labScore.score >= 75;

                        return (
                             <div key={module.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{translate(module.title)}</h3>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Quiz Progress */}
                                    <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isQuizPassed ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>
                                            <BookOpenIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{translate('Learning Module & Quiz')}</p>
                                            {quizScore ? (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CheckCircleIcon className={`h-4 w-4 ${isQuizPassed ? 'text-emerald-500' : 'text-amber-500'}`} />
                                                    <span className={`${isQuizPassed ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                                        {translate('Score')}: {quizScore.score}/{quizScore.totalQuestions}
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{translate('Not yet completed')}</p>
                                            )}
                                        </div>
                                    </div>
                                    {/* Lab Progress */}
                                    <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isLabPassed ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>
                                            <BeakerIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{translate('Lab / Simulation')}</p>
                                            {labScore ? (
                                                 <div className="flex items-center gap-2 text-sm">
                                                    <CheckCircleIcon className={`h-4 w-4 ${isLabPassed ? 'text-emerald-500' : 'text-amber-500'}`} />
                                                    <span className={`${isLabPassed ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                                        {translate('Score')}: {labScore.score}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{translate('Not yet completed')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StudentProgressView;
