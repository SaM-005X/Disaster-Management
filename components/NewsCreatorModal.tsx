import React, { useState } from 'react';
import type { NewsArticle, User } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { XIcon } from './icons/XIcon';

interface NewsCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (articleData: Omit<NewsArticle, 'isLocal' | 'status'>) => void;
  type: 'latest' | 'previous';
  currentUser: User;
}

const NewsCreatorModal: React.FC<NewsCreatorModalProps> = ({ isOpen, onClose, onSave, type, currentUser }) => {
  const { translate } = useTranslate();
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    imageUrl: '',
    source: currentUser.name,
    link: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.summary) {
        alert(translate('Title and summary are required.'));
        return;
    }
    onSave({ ...formData, type });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="news-creator-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-300">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 id="news-creator-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                {translate('Create New News Article')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={translate('Close')}
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translate('Title')}
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                />
              </div>
              <div>
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translate('Summary')}
                </label>
                <textarea
                  name="summary"
                  id="summary"
                  value={formData.summary}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                />
              </div>
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translate('Image URL')} ({translate('Optional')})
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                />
              </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {translate('Source')}
                        </label>
                        <input
                        type="text"
                        name="source"
                        id="source"
                        value={formData.source}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="link" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {translate('Article Link')}
                        </label>
                        <input
                        type="url"
                        name="link"
                        id="link"
                        value={formData.link}
                        onChange={handleChange}
                        required
                        placeholder="https://example.com/full-article"
                        className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                        />
                    </div>
                </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl flex justify-end items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
            >
              {translate('Cancel')}
            </button>
            <button
              type="submit"
              className="bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors"
            >
              {translate('Submit for Review')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewsCreatorModal;