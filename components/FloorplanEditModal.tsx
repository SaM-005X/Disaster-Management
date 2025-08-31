import React, { useState, useEffect, useRef } from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { XIcon } from './icons/XIcon';
import { UploadIcon } from './icons/UploadIcon';
import type { StoredFloorplan } from '../types';

const fileToUrlAndDimensions = (file: File): Promise<{ url: string, width: number, height: number }> => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => resolve({ url, width: img.width, height: img.height });
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Could not read image dimensions.'));
        };
        img.src = url;
    });
};

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.error) return reject(reader.error);
            resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

interface FloorplanEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<StoredFloorplan, 'id' | 'ownerId'>) => void;
  onUpdate: (planId: string, data: { name: string, imageDataUrl: string, width: number, height: number }) => void;
  existingPlan: StoredFloorplan | null;
  isGlobal: boolean;
}

const FloorplanEditModal: React.FC<FloorplanEditModalProps> = ({ isOpen, onClose, onSave, onUpdate, existingPlan, isGlobal }) => {
    const { translate } = useTranslate();
    const [name, setName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEditing = !!existingPlan;

    useEffect(() => {
        if (isOpen) {
            if (existingPlan) {
                setName(existingPlan.name);
                setPreviewUrl(existingPlan.imageDataUrl);
            }
        } else {
            setName('');
            setFile(null);
            setPreviewUrl(null);
            setError(null);
        }
    }, [isOpen, existingPlan]);
    
    useEffect(() => {
        // Clean up object URL on unmount or when previewUrl changes
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        }
    }, [previewUrl]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.type.startsWith('image/')) {
                setError(translate('Please select a valid image file.'));
                return;
            }
            setError(null);
            setFile(selectedFile);
            if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
            const { url } = await fileToUrlAndDimensions(selectedFile);
            setPreviewUrl(url);
            if (!name) setName(selectedFile.name.replace(/\.[^/.]+$/, ""));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || (!file && !isEditing)) {
            setError(translate('Please provide a name and select a file.'));
            return;
        }

        try {
            if (file) { // If a new file was selected (for add or replace)
                const { width, height } = await fileToUrlAndDimensions(file);
                const imageDataUrl = await fileToDataUrl(file);
                if (isEditing) {
                    onUpdate(existingPlan!.id, { name: name.trim(), imageDataUrl, width, height });
                } else {
                    onSave({ name: name.trim(), imageDataUrl, width, height, isGlobal });
                }
            } else if (isEditing) { // If only the name was changed
                 onUpdate(existingPlan!.id, { name: name.trim(), imageDataUrl: existingPlan!.imageDataUrl, width: existingPlan!.width, height: existingPlan!.height });
            }
            onClose();
        } catch (err) {
            setError(translate('Failed to process the image file.'));
        }
    };

    if (!isOpen) return null;

    const modalTitle = isEditing ? translate('Replace Floor Plan') : (isGlobal ? translate('Add New Public Plan') : translate('Add New Personal Plan'));
    const saveButtonText = isEditing ? translate('Save Changes') : translate('Save Plan');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="floorplan-modal-title">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-300">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 id="floorplan-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">{modalTitle}</h2>
                            <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={translate('Close')}>
                                <XIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="plan-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{translate('Plan Name')}</label>
                                <input type="text" name="name" id="plan-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder={translate("e.g., Home First Floor, Office Building B")} className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{isEditing ? translate('Upload New Image (Optional)') : translate('Floor Plan Image')}</label>
                                <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Floor plan preview" className="mx-auto h-24 object-contain" />
                                        ) : (
                                            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        )}
                                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                                                <span>{translate('Upload a file')}</span>
                                                <input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                            </label>
                                            <p className="pl-1">{translate('or drag and drop')}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{file ? file.name : translate('PNG, JPG, GIF up to 10MB')}</p>
                                    </div>
                                </div>
                                {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl flex justify-end items-center gap-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors">{translate('Cancel')}</button>
                        <button type="submit" className="bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors">{saveButtonText}</button>
                    </div>
                </form>
                 <style>{`
                    .input-style { @apply px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200; }
                `}</style>
            </div>
        </div>
    );
};

export default FloorplanEditModal;
