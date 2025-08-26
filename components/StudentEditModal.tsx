import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { XIcon } from './icons/XIcon';

interface StudentEditModalProps {
  student: User | null;
  onSave: (student: User | Omit<User, 'id' | 'avatarUrl' | 'institutionId' | 'role'>) => void;
  onClose: () => void;
}

const StudentEditModal: React.FC<StudentEditModalProps> = ({ student, onSave, onClose }) => {
  const { translate } = useTranslate();
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    rollNumber: '',
  });

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        class: student.class,
        rollNumber: student.rollNumber || '',
      });
    } else {
      setFormData({ name: '', class: '', rollNumber: '' });
    }
  }, [student]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (student) {
      onSave({ ...student, ...formData });
    } else {
      onSave(formData);
    }
  };

  const isEditing = !!student;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-auto transform transition-all duration-300">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 id="student-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? translate('Edit Student') : translate('Add New Student')}
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translate('Student Name')}
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                />
              </div>
              <div>
                <label htmlFor="class" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translate('Class/Grade')}
                </label>
                <input
                  type="text"
                  name="class"
                  id="class"
                  value={formData.class}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                />
              </div>
              <div>
                <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translate('Roll Number')}
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  id="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                />
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
              {isEditing ? translate('Save Changes') : translate('Add Student')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentEditModal;