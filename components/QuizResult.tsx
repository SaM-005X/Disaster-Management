import React, { useEffect, useMemo } from 'react';
import type { QuizScore } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS } from '../contexts/TTSContext';

interface QuizResultProps {
  result: QuizScore;
  moduleTitle: string;
  onRetake: () => void;
  onBackToModule: () => void;
  onBackToDashboard: () => void;
}

const QuizResult: React.FC<QuizResultProps> = ({ result, moduleTitle, onRetake, onBackToModule, onBackToDashboard }) => {
  const { translate } = useTranslate();
  const { registerTexts, currentlySpokenId } = useTTS();
  const percentage = useMemo(() => Math.round((result.score / result.totalQuestions) * 100), [result]);
  const isPassing = percentage >= 80;

  const feedbackMessage = useMemo(() => {
    if (percentage === 100) return translate("Perfect Score! You're a preparedness expert!");
    if (isPassing) return translate("Great job! You have a solid understanding of the material.");
    return translate("Good effort! Review the module again to improve your score.");
  }, [percentage, isPassing, translate]);

  useEffect(() => {
    const textsToRead = [
      { id: 'result-title', text: translate('Quiz Completed!') },
      { id: 'result-module-title', text: `${translate('Results for:')} ${translate(moduleTitle)}` },
      { id: 'result-score', text: `You scored ${percentage} percent. ${result.score} out of ${result.totalQuestions} correct.` },
      { id: 'result-feedback', text: feedbackMessage },
    ];
    registerTexts(textsToRead);
  }, [result, moduleTitle, percentage, feedbackMessage, translate, registerTexts]);


  const circumference = 2 * Math.PI * 56; // 2 * pi * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 max-w-2xl mx-auto text-center">
      <h1 id="result-title" className={`text-3xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === 'result-title' ? 'tts-highlight' : ''}`}>{translate('Quiz Completed!')}</h1>
      <p id="result-module-title" className={`text-gray-600 dark:text-gray-400 mt-1 ${currentlySpokenId === 'result-module-title' ? 'tts-highlight' : ''}`}>{translate('Results for:')} {translate(moduleTitle)}</p>

      <div className="my-8 w-48 h-48 mx-auto relative" aria-hidden="true">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle
            className="text-gray-200 dark:text-gray-700"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="56"
            cx="60"
            cy="60"
          />
          <circle
            className={isPassing ? 'text-emerald-500' : 'text-amber-500'}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="56"
            cx="60"
            cy="60"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
           <span className={`text-5xl font-extrabold ${isPassing ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{percentage}%</span>
           <span className={`font-semibold mt-1 ${isPassing ? 'text-emerald-500 dark:text-emerald-300' : 'text-amber-500 dark:text-amber-300'}`}>{result.score}/{result.totalQuestions}</span>
        </div>
      </div>
      
      <div id="result-score" className="sr-only">
        {`You scored ${percentage} percent. ${result.score} out of ${result.totalQuestions} correct.`}
      </div>

      <h2 id="result-feedback" className={`text-2xl font-semibold text-gray-800 dark:text-white ${currentlySpokenId === 'result-feedback' ? 'tts-highlight' : ''}`}>{feedbackMessage}</h2>
      
      <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
         <button 
          onClick={onRetake}
          className="w-full sm:w-auto bg-teal-600 text-white font-bold py-3 px-6 rounded-full hover:bg-teal-700 transition-colors"
         >
          {translate('Retake Quiz')}
         </button>
         <button 
          onClick={onBackToModule}
          className="w-full sm:w-auto bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-full hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
         >
          {translate('Review Module')}
         </button>
      </div>
       <button 
        onClick={onBackToDashboard}
        className="mt-4 text-teal-600 dark:text-teal-400 font-semibold py-2 px-4 rounded-lg hover:underline"
       >
        {translate('Back to Dashboard')}
       </button>
    </div>
  );
};

export default QuizResult;