import React, { useState, useEffect } from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { XIcon } from './icons/XIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { TrashIcon } from './icons/TrashIcon';
import type { Quiz, QuizQuestion, LearningModule } from '../types';

interface QuizEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quizData: Omit<Quiz, 'id' | 'moduleId'> & { id?: string }) => void;
  existingQuiz: Quiz | null;
  forModule: LearningModule;
}

const QuizEditModal: React.FC<QuizEditModalProps> = ({ isOpen, onClose, onSave, existingQuiz, forModule }) => {
  const { translate } = useTranslate();
  const [formData, setFormData] = useState<Omit<Quiz, 'id' | 'moduleId'>>({ title: '', questions: [] });
  const isEditing = !!existingQuiz;

  useEffect(() => {
    if (isOpen) {
      if (existingQuiz) {
        setFormData({
          title: existingQuiz.title,
          questions: JSON.parse(JSON.stringify(existingQuiz.questions)), // Deep copy
        });
      } else {
        setFormData({ title: `${forModule.title} Quiz`, questions: [] });
      }
    }
  }, [isOpen, existingQuiz, forModule]);

  if (!isOpen) return null;

  const handleQuizChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, title: e.target.value }));
  };

  const handleQuestionChange = (qIndex: number, value: string) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex].questionText = value;
      return { ...prev, questions: newQuestions };
    });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex].options[oIndex] = value;
      return { ...prev, questions: newQuestions };
    });
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex].correctOptionIndex = oIndex;
      return { ...prev, questions: newQuestions };
    });
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      questionText: '',
      options: ['', ''],
      correctOptionIndex: 0,
    };
    setFormData(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }));
  };

  const removeQuestion = (qIndex: number) => {
    setFormData(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qIndex) }));
  };
  
  const addOption = (qIndex: number) => {
      if (formData.questions[qIndex].options.length >= 5) return;
      setFormData(prev => {
          const newQuestions = [...prev.questions];
          newQuestions[qIndex].options.push('');
          return {...prev, questions: newQuestions};
      })
  };
  
  const removeOption = (qIndex: number, oIndex: number) => {
      if (formData.questions[qIndex].options.length <= 2) return;
      setFormData(prev => {
          const newQuestions = [...prev.questions];
          newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
          if (newQuestions[qIndex].correctOptionIndex === oIndex) {
              newQuestions[qIndex].correctOptionIndex = 0;
          } else if (newQuestions[qIndex].correctOptionIndex > oIndex) {
              newQuestions[qIndex].correctOptionIndex--;
          }
          return {...prev, questions: newQuestions};
      })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
        onSave({ ...formData, id: existingQuiz!.id });
    } else {
        onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? translate('Edit Quiz') : translate('Create New Quiz')} for "{translate(forModule.title)}"
              </h2>
              <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={translate('Close')}>
                <XIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <input type="text" value={formData.title} onChange={handleQuizChange} placeholder={translate('Quiz Title')} required className="text-xl font-bold w-full input-style" />
            {formData.questions.map((q, qIndex) => (
              <div key={qIndex} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-start gap-2">
                    <textarea value={q.questionText} onChange={e => handleQuestionChange(qIndex, e.target.value)} placeholder={`${translate('Question')} ${qIndex + 1}`} required rows={2} className="w-full font-semibold input-style"/>
                    <button type="button" onClick={() => removeQuestion(qIndex)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><TrashIcon className="h-5 w-5"/></button>
                </div>
                <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-300 dark:border-gray-500">
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <input type="radio" name={`correct-opt-${qIndex}`} checked={q.correctOptionIndex === oIndex} onChange={() => setCorrectOption(qIndex, oIndex)} className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500" />
                      <input type="text" value={opt} onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)} placeholder={`${translate('Option')} ${oIndex + 1}`} required className="w-full text-sm input-style"/>
                      <button type="button" onClick={() => removeOption(qIndex, oIndex)} disabled={q.options.length <= 2} className="p-1 text-red-500 hover:bg-red-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"><TrashIcon className="h-4 w-4"/></button>
                    </div>
                  ))}
                   <button type="button" onClick={() => addOption(qIndex)} disabled={q.options.length >= 5} className="mt-2 text-xs font-semibold text-teal-600 disabled:opacity-50">
                    {translate('Add Option')}
                   </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addQuestion} className="w-full text-center py-2 text-sm font-semibold text-teal-600 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 dark:border-gray-600 dark:hover:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-900/50">
                <PlusCircleIcon className="inline-block h-5 w-5 mr-1 align-text-bottom"/> {translate('Add Question')}
            </button>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl flex justify-end items-center gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors">
              {translate('Cancel')}
            </button>
            <button type="submit" className="bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors">
              {isEditing ? translate('Save Quiz') : translate('Create & Link Quiz')}
            </button>
          </div>
        </form>
        <style>{`.input-style { @apply px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200; }`}</style>
      </div>
    </div>
  );
};

export default QuizEditModal;
