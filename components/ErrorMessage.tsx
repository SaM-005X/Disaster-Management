import React from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className = '' }) => {
  const { translate } = useTranslate();

  if (!message) return null;

  return (
    <div
      className={`p-3 my-2 text-center text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/50 rounded-lg border border-red-200 dark:border-red-800 flex items-center justify-center gap-2 ${className}`}
      role="alert"
    >
      <AlertTriangleIcon className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm font-medium">{translate(message)}</p>
    </div>
  );
};

export default ErrorMessage;
