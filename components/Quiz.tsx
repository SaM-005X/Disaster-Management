import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Quiz } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, TTSText } from '../contexts/TTSContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import VoiceInputButton from './VoiceInputButton';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface QuizProps {
  quiz: Quiz;
  moduleTitle: string;
  onComplete: (score: number, totalQuestions: number) => void;
  onBack: () => void;
}

const QuizView: React.FC<QuizProps> = ({ quiz, moduleTitle, onComplete, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [voiceError, setVoiceError] = useState('');
  const { translate } = useTranslate();
  const { registerTexts, currentlySpokenId } = useTTS();
  
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  // Memoize handlers for stability
  const handleSelectOption = useCallback((optionIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
  }, [currentQuestionIndex]);

  const handleSubmit = useCallback(() => {
    let score = 0;
    quiz.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctOptionIndex) {
        score++;
      }
    });
    onComplete(score, quiz.questions.length);
  }, [quiz.questions, selectedAnswers, onComplete]);

  const handleNext = useCallback(() => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
      setVoiceError('');
    } else {
      if (selectedAnswers[currentQuestionIndex] !== undefined) {
          handleSubmit();
      }
    }
  }, [isLastQuestion, handleSubmit, selectedAnswers, currentQuestionIndex]);
  
  const handlePrevious = useCallback(() => {
    if(currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setVoiceError('');
    }
  }, [currentQuestionIndex]);

  // Enhanced transcript handler
  const handleTranscript = useCallback((transcript: string) => {
      const text = transcript.toLowerCase().trim();
      setVoiceError('');
      let actionTaken = false;

      const optionMap = [
          ['one', '1', 'a', 'option one', 'option 1', 'option a', 'first one'],
          ['two', '2', 'b', 'to', 'too', 'option two', 'option 2', 'option b', 'second one'],
          ['three', '3', 'c', 'option three', 'option 3', 'option c', 'third one'],
          ['four', '4', 'd', 'for', 'option four', 'option 4', 'option d', 'fourth one'],
          ['five', '5', 'e', 'option five', 'option 5', 'option e', 'fifth one'],
      ];
      
      // Check for option selection
      for (let i = 0; i < currentQuestion.options.length; i++) {
          const optionText = currentQuestion.options[i].toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
          if (text.includes(optionText)) {
              handleSelectOption(i);
              actionTaken = true;
              break;
          }
          if (optionMap[i] && optionMap[i].some(alias => text.includes(alias))) {
              handleSelectOption(i);
              actionTaken = true;
              break;
          }
      }
      
      // Check for navigation commands
      if (text.includes('next')) {
          handleNext();
          actionTaken = true;
      } else if (text.includes('previous')) {
          handlePrevious();
          actionTaken = true;
      } else if (text.includes('submit') && isLastQuestion) {
          handleSubmit();
          actionTaken = true;
      }

      if (!actionTaken) {
          setVoiceError(translate("Sorry, I didn't catch that. Please say the option (e.g., 'Option A') or a command ('Next', 'Previous')."));
      }
  }, [currentQuestion.options, translate, handleSelectOption, handleNext, handlePrevious, handleSubmit, isLastQuestion]);

  const { isListening, toggleListening, isSupported, error: recognitionError } = useSpeechRecognition(handleTranscript);
  
  // Display errors from the speech recognition hook
  useEffect(() => {
      if(recognitionError) {
          setVoiceError(recognitionError);
      }
  }, [recognitionError]);

  useEffect(() => {
    const questionId = currentQuestion.id;
    const questionText = translate(currentQuestion.questionText);
    const textsToRead: TTSText[] = [
        { id: `quiz-q-${questionId}-progress`, text: `${translate('Question')} ${currentQuestionIndex + 1} ${translate('of')} ${quiz.questions.length}` },
        { id: `quiz-q-${questionId}-text`, text: questionText },
        ...currentQuestion.options.map((opt, index) => ({
            id: `quiz-q-${questionId}-option-${index}`,
            text: translate(opt)
        }))
    ];
    registerTexts(textsToRead);
  }, [currentQuestion, currentQuestionIndex, quiz.questions.length, registerTexts, translate]);

  const progressPercentage = useMemo(() => {
    return ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  }, [currentQuestionIndex, quiz.questions.length]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:underline font-semibold mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>{translate('Back to Module')}</span>
        </button>

      <div className="mb-4 text-center">
        <p className="text-teal-600 dark:text-teal-400 font-semibold">{translate(moduleTitle)}</p>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{translate(quiz.title)}</h2>
      </div>

       <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 my-8 overflow-hidden">
        <div className="bg-teal-600 h-4 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div>
      </div>
      
      <div>
        <h3 
          id={`quiz-q-${currentQuestion.id}-progress`}
          className={`text-lg font-semibold mb-2 text-gray-600 dark:text-gray-300 text-center ${currentlySpokenId === `quiz-q-${currentQuestion.id}-progress` ? 'tts-highlight' : ''}`}
        >
          {translate('Question')} {currentQuestionIndex + 1} {translate('of')} {quiz.questions.length}
        </h3>
        <p 
          id={`quiz-q-${currentQuestion.id}-text`}
          className={`text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center ${currentlySpokenId === `quiz-q-${currentQuestion.id}-text` ? 'tts-highlight' : ''}`}
        >
          {translate(currentQuestion.questionText)}
        </p>
        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => {
            const optionId = `quiz-q-${currentQuestion.id}-option-${index}`;
            return (
              <button
                key={index}
                id={optionId}
                onClick={() => handleSelectOption(index)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 font-medium ${
                  selectedAnswers[currentQuestionIndex] === index
                    ? 'bg-teal-50 border-teal-500 dark:bg-teal-900/50 dark:border-teal-400 ring-2 ring-teal-200 dark:ring-teal-500/50 text-teal-800 dark:text-teal-200'
                    : `bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 ${currentlySpokenId === optionId ? 'tts-highlight' : ''}`
                }`}
              >
                {translate(option)}
              </button>
            )
          })}
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="w-full flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="bg-gray-200 text-gray-700 font-bold py-3 px-8 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            {translate('Previous')}
          </button>
          <button
            onClick={handleNext}
            disabled={selectedAnswers[currentQuestionIndex] === undefined}
            className="bg-teal-600 text-white font-bold py-3 px-8 rounded-full hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLastQuestion ? translate('Submit') : translate('Next')}
          </button>
        </div>
        {isSupported && (
           <div className="flex flex-col items-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-4 w-full">
                <VoiceInputButton 
                    onTranscript={handleTranscript}
                    isListening={isListening}
                    toggleListening={toggleListening}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isListening ? translate('Listening...') : translate('Tap the mic to answer with your voice')}
                </p>
                {voiceError && <p className="text-sm text-red-500 dark:text-red-400 text-center">{voiceError}</p>}
           </div>
        )}
      </div>
    </div>
  );
};

export default QuizView;