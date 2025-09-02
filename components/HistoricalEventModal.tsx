import React, { useState, useEffect } from 'react';
import type { HistoricalDisaster, HazardType } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { XIcon } from './icons/XIcon';
import { HazardType as HazardTypeEnum } from '../types';
import { useTTS, type TTSText } from '../contexts/TTSContext';

interface HistoricalEventModalProps {
  event: HistoricalDisaster | null;
  onSave: (eventData: Omit<HistoricalDisaster, 'id'>) => void;
  onClose: () => void;
}

const HistoricalEventModal: React.FC<HistoricalEventModalProps> = ({ event, onSave, onClose }) => {
  const { translate } = useTranslate();
  const { registerTexts, currentlySpokenId } = useTTS();
  const [formData, setFormData] = useState({
    eventName: '',
    date: '',
    type: HazardTypeEnum.EARTHQUAKE,
    location: '',
    fatalities: 0,
    economicImpactUSD: '',
    summary: '',
  });

  const isEditing = !!event;
  const modalTitle = isEditing ? translate('Edit Historical Event') : translate('Add New Event');

  useEffect(() => {
    if (event) {
      setFormData({
        eventName: event.eventName,
        date: event.date,
        type: event.type,
        location: event.location,
        fatalities: event.fatalities,
        economicImpactUSD: event.economicImpactUSD,
        summary: event.summary,
      });
    }
  }, [event]);
  
  useEffect(() => {
    const texts: TTSText[] = [
        { id: 'event-modal-title', text: modalTitle },
        { id: 'event-modal-label-name', text: translate('Event Name') },
        { id: 'event-modal-label-date', text: translate('Date') },
        { id: 'event-modal-label-type', text: translate('Hazard Type') },
        { id: 'event-modal-label-location', text: translate('Location') },
        { id: 'event-modal-label-fatalities', text: translate('Fatalities') },
        { id: 'event-modal-label-impact', text: translate('Economic Impact (USD)') },
        { id: 'event-modal-label-summary', text: translate('Summary') },
    ];
    registerTexts(texts);
  }, [modalTitle, translate, registerTexts]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'fatalities' ? parseInt(value, 10) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-300">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 id="event-modal-title" className={`text-2xl font-bold text-gray-900 dark:text-white ${currentlySpokenId === 'event-modal-title' ? 'tts-highlight' : ''}`}>
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
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
               <div>
                <label htmlFor="eventName" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${currentlySpokenId === 'event-modal-label-name' ? 'tts-highlight' : ''}`}>{translate('Event Name')}</label>
                <input type="text" name="eventName" id="eventName" value={formData.eventName} onChange={handleChange} required className="mt-1 block w-full input-style" />
              </div>

               <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="date" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${currentlySpokenId === 'event-modal-label-date' ? 'tts-highlight' : ''}`}>{translate('Date')}</label>
                    <input type="text" name="date" id="date" value={formData.date} onChange={handleChange} required placeholder="e.g., August 2018" className="mt-1 block w-full input-style" />
                </div>
                 <div>
                    <label htmlFor="type" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${currentlySpokenId === 'event-modal-label-type' ? 'tts-highlight' : ''}`}>{translate('Hazard Type')}</label>
                    <select name="type" id="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full input-style">
                        {Object.values(HazardTypeEnum).map(type => (
                            <option key={type} value={type}>{translate(type)}</option>
                        ))}
                    </select>
                </div>
              </div>
              
               <div>
                <label htmlFor="location" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${currentlySpokenId === 'event-modal-label-location' ? 'tts-highlight' : ''}`}>{translate('Location')}</label>
                <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} required className="mt-1 block w-full input-style" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="fatalities" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${currentlySpokenId === 'event-modal-label-fatalities' ? 'tts-highlight' : ''}`}>{translate('Fatalities')}</label>
                    <input type="number" name="fatalities" id="fatalities" value={formData.fatalities} onChange={handleChange} required min="0" className="mt-1 block w-full input-style" />
                </div>
                <div>
                    <label htmlFor="economicImpactUSD" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${currentlySpokenId === 'event-modal-label-impact' ? 'tts-highlight' : ''}`}>{translate('Economic Impact (USD)')}</label>
                    <input type="text" name="economicImpactUSD" id="economicImpactUSD" value={formData.economicImpactUSD} onChange={handleChange} required placeholder="e.g., 1.5 Billion" className="mt-1 block w-full input-style" />
                </div>
              </div>
              
              <div>
                <label htmlFor="summary" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${currentlySpokenId === 'event-modal-label-summary' ? 'tts-highlight' : ''}`}>{translate('Summary')}</label>
                <textarea name="summary" id="summary" value={formData.summary} onChange={handleChange} required rows={3} className="mt-1 block w-full input-style" />
              </div>

            </div>
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl flex justify-end items-center gap-3">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors">
              {translate('Cancel')}
            </button>
            <button type="submit" className="bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors">
              {isEditing ? translate('Save Changes') : translate('Add Event')}
            </button>
          </div>
        </form>
         <style>{`
            .input-style {
                @apply px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200;
            }
        `}</style>
      </div>
    </div>
  );
};

export default HistoricalEventModal;