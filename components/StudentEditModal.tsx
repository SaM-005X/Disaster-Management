import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { XIcon } from './icons/XIcon';
import ErrorMessage from './ErrorMessage';

interface StudentEditModalProps {
  student: User | null;
  onSave: (student: any) => void;
  onClose: () => void;
  userType: 'student' | 'employee';
}

const StudentEditModal: React.FC<StudentEditModalProps> = ({ student, onSave, onClose, userType }) => {
  const { translate } = useTranslate();
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    rollNumber: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const isEditing = !!student;
  const isEmployee = userType === 'employee';

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        class: student.class,
        rollNumber: student.rollNumber || '',
        email: '', // Not exposing existing user's email for editing
        password: '',
      });
    } else {
      setFormData({ name: '', class: '', rollNumber: '', email: '', password: '' });
    }
  }, [student]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isEditing && student) {
      onSave({ ...student, name: formData.name, class: formData.class, rollNumber: formData.rollNumber });
    } else {
        if (!formData.email || !formData.password) {
            const errorMessage = isEmployee
                ? translate('Email and a temporary password are required to add a new employee.')
                : translate('Email and a temporary password are required to add a new student.');
            setError(errorMessage);
            return;
        }
      onSave(formData);
    }
  };

  const modalTitle = isEditing
    ? (isEmployee ? translate('Edit Employee') : translate('Edit Student'))
    : (isEmployee ? translate('Add New Employee') : translate('Add New Student'));

  const nameLabel = isEmployee ? translate('Employee Name') : translate('Student Name');
  const classLabel = isEmployee ? translate('Department') : translate('Class/Grade');
  const idLabel = isEmployee ? translate('Employee ID') : translate('Roll Number');
  const emailLabel = isEmployee ? translate('Employee Email') : translate('Student Email');
  const saveButtonText = isEditing
    ? translate('Save Changes')
    : (isEmployee ? translate('Add Employee') : translate('Add Student'));

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
                {modalTitle}
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
            {error && <ErrorMessage message={error} />}
            <div className="space-y-4 mt-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {nameLabel}
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
              {!isEditing && (
                <>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {emailLabel}
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                           placeholder={translate('An invitation will be sent here')}
                          className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {translate('Temporary Password')}
                        </label>
                        <input
                          type="password"
                          name="password"
                          id="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          placeholder={translate('User will be asked to change this')}
                          className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                        />
                    </div>
                </>
              )}
              <div>
                <label htmlFor="class" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {classLabel}
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
                  {idLabel}
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
              {saveButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentEditModal;
