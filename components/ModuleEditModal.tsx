import React, { useState, useEffect, useRef } from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { XIcon } from './icons/XIcon';
import { HazardType, type LearningModule, type ModuleContent } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';

interface ModuleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (moduleData: Omit<LearningModule, 'id' | 'quizId' | 'hasLab' | 'progress'> & { id?: string }) => void;
  existingModule: LearningModule | null;
}

const ModuleEditModal: React.FC<ModuleEditModalProps> = ({ isOpen, onClose, onSave, existingModule }) => {
  const { translate } = useTranslate();
  const [formData, setFormData] = useState<Omit<LearningModule, 'id' | 'quizId' | 'hasLab' | 'progress'>>({
    title: '', description: '', hazardType: HazardType.EARTHQUAKE,
    regionTags: [], thumbnailUrl: '', content: [],
  });

  const isEditing = !!existingModule;
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (existingModule) {
        setFormData({
          title: existingModule.title,
          description: existingModule.description,
          hazardType: existingModule.hazardType,
          regionTags: existingModule.regionTags,
          thumbnailUrl: existingModule.thumbnailUrl,
          content: [...existingModule.content], // Create a copy to avoid direct mutation
        });
      } else {
        // Reset for new module
        setFormData({
          title: '', description: '', hazardType: HazardType.EARTHQUAKE,
          regionTags: [], thumbnailUrl: '', content: [],
        });
      }
    }
  }, [isOpen, existingModule]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'regionTags') {
      setFormData(prev => ({ ...prev, [name]: value.split(',').map(tag => tag.trim()) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleContentChange = (index: number, field: 'type' | 'content', value: string | string[]) => {
    setFormData(prev => {
      const newContent = [...prev.content];
      (newContent[index] as any)[field] = value;
      return { ...prev, content: newContent };
    });
  };

  const addContentBlock = () => {
    const newBlock: ModuleContent = { type: 'paragraph', content: '' };
    setFormData(prev => ({ ...prev, content: [...prev.content, newBlock] }));
  };

  const removeContentBlock = (index: number) => {
    setFormData(prev => ({ ...prev, content: prev.content.filter((_, i) => i !== index) }));
  };

  const moveContentBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.content.length) return;
    setFormData(prev => {
      const newContent = [...prev.content];
      [newContent[index], newContent[newIndex]] = [newContent[newIndex], newContent[index]];
      return { ...prev, content: newContent };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && existingModule) {
        onSave({ ...formData, id: existingModule.id });
    } else {
        onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all duration-300 flex flex-col h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? translate('Edit Learning Module') : translate('Create New Module')}
              </h2>
              <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={translate('Close')}>
                <XIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            <input name="title" value={formData.title} onChange={handleChange} placeholder={translate('Module Title')} required className="text-2xl font-bold w-full input-style" />
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder={translate('Module Description')} required rows={2} className="w-full input-style" />
            
            <div className="grid grid-cols-2 gap-4">
                <select name="hazardType" value={formData.hazardType} onChange={handleChange} className="w-full input-style">
                    {Object.values(HazardType).map(type => <option key={type} value={type}>{translate(type)}</option>)}
                </select>
                <input name="regionTags" value={formData.regionTags.join(', ')} onChange={handleChange} placeholder={translate('Region Tags (comma-separated)')} className="w-full input-style" />
            </div>
            <input name="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleChange} placeholder={translate('Thumbnail Image URL')} required className="w-full input-style" />
            
            <h3 className="text-lg font-semibold border-t border-gray-200 dark:border-gray-700 pt-4">{translate('Module Content')}</h3>
            <div className="space-y-3">
              {formData.content.map((block, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex gap-2">
                  <div className="flex-grow space-y-2">
                    <select value={block.type} onChange={e => handleContentChange(index, 'type', e.target.value)} className="w-full sm:w-1/3 input-style text-sm">
                      <option value="heading">{translate('Heading')}</option>
                      <option value="paragraph">{translate('Paragraph')}</option>
                      <option value="image">{translate('Image URL')}</option>
                      <option value="video">{translate('Video URL')}</option>
                    </select>
                    {block.type === 'paragraph' ? (
                       <textarea value={block.content as string} onChange={e => handleContentChange(index, 'content', e.target.value)} rows={3} className="w-full input-style" />
                    ) : (
                       <input type="text" value={block.content as string} onChange={e => handleContentChange(index, 'content', e.target.value)} className="w-full input-style" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => moveContentBlock(index, 'up')} disabled={index === 0} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30"><ArrowUpIcon className="h-4 w-4"/></button>
                    <button type="button" onClick={() => moveContentBlock(index, 'down')} disabled={index === formData.content.length - 1} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30"><ArrowDownIcon className="h-4 w-4"/></button>
                    <button type="button" onClick={() => removeContentBlock(index)} className="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"><TrashIcon className="h-4 w-4"/></button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addContentBlock} className="w-full text-center py-2 text-sm font-semibold text-teal-600 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 dark:border-gray-600 dark:hover:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-900/50">
                {translate('Add Content Block')}
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl flex justify-end items-center gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors">
              {translate('Cancel')}
            </button>
            <button type="submit" className="bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors">
              {isEditing ? translate('Save Changes') : translate('Create Module')}
            </button>
          </div>
        </form>
        <style>{`.input-style { @apply px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200; }`}</style>
      </div>
    </div>
  );
};

export default ModuleEditModal;
