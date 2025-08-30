import React, { useState } from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import type { HistoricalDisaster } from '../types';
import ErrorMessage from './ErrorMessage';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import HistoricalEventModal from './HistoricalEventModal';

interface HistoricalDatabaseProps {
    disasters: HistoricalDisaster[];
    onAdd: (data: Omit<HistoricalDisaster, 'id'>) => void;
    onUpdate: (data: HistoricalDisaster) => void;
    onDelete: (id: string) => void;
}

const HistoricalDatabase: React.FC<HistoricalDatabaseProps> = ({ disasters, onAdd, onUpdate, onDelete }) => {
    const { translate } = useTranslate();
    const [sortConfig, setSortConfig] = useState<{ key: keyof HistoricalDisaster; direction: 'asc' | 'desc' } | null>({ key: 'fatalities', direction: 'desc' });
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<HistoricalDisaster | null>(null);

    const filteredAndSortedDisasters = React.useMemo(() => {
        let filteredItems = disasters.filter(item => 
            item.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (sortConfig !== null) {
            filteredItems.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];
                
                if (sortConfig.key === 'fatalities') {
                    return sortConfig.direction === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
                }
                if (typeof valA === 'string' && typeof valB === 'string') {
                    return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
                return 0;
            });
        }
        return filteredItems;
    }, [disasters, sortConfig, searchQuery]);
    
    const requestSort = (key: keyof HistoricalDisaster) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleOpenAddModal = () => {
        setEditingEvent(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (event: HistoricalDisaster) => {
        setEditingEvent(event);
        setIsModalOpen(true);
    };
    
    const handleSaveEvent = (eventData: Omit<HistoricalDisaster, 'id'>) => {
        if (editingEvent) {
            onUpdate({ ...editingEvent, ...eventData });
        } else {
            onAdd(eventData);
        }
        setIsModalOpen(false);
    };

    const SortableHeader: React.FC<{ sortKey: keyof HistoricalDisaster, label: string }> = ({ sortKey, label }) => (
        <th scope="col" className="px-6 py-3">
            <button onClick={() => requestSort(sortKey)} className="flex items-center gap-1 group">
                {translate(label)}
                {sortConfig?.key === sortKey ? (
                    sortConfig.direction === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                ) : <ChevronDownIcon className="h-4 w-4 opacity-0 group-hover:opacity-50" />}
            </button>
        </th>
    );

    return (
        <div>
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                 <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{translate('Historical Disaster Database')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{translate('Analyze past events to better prepare for the future.')}</p>
                </div>
                 <button 
                    onClick={handleOpenAddModal}
                    className="flex-shrink-0 flex items-center gap-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors"
                >
                    <PlusCircleIcon className="h-5 w-5"/>
                    <span>{translate('Add New Event')}</span>
                 </button>
            </div>
            
            <div className="mb-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={translate('Search events, locations, or types...')}
                    className="w-full max-w-sm px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
            </div>
            
            <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <SortableHeader sortKey="eventName" label="Event" />
                            <SortableHeader sortKey="date" label="Date" />
                            <SortableHeader sortKey="type" label="Type" />
                            <SortableHeader sortKey="location" label="Location" />
                            <SortableHeader sortKey="fatalities" label="Fatalities" />
                            <SortableHeader sortKey="economicImpactUSD" label="Economic Impact (USD)" />
                            <th scope="col" className="px-6 py-3 text-center">{translate('Actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedDisasters.map((disaster) => (
                            <tr key={disaster.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600" title={disaster.summary}>
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{translate(disaster.eventName)}</td>
                                <td className="px-6 py-4">{disaster.date}</td>
                                <td className="px-6 py-4">{translate(disaster.type)}</td>
                                <td className="px-6 py-4">{disaster.location}</td>
                                <td className="px-6 py-4">{disaster.fatalities.toLocaleString()}</td>
                                <td className="px-6 py-4">{`$${disaster.economicImpactUSD}`}</td>
                                 <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <button onClick={() => handleOpenEditModal(disaster)} className="p-2 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400" aria-label={translate("Edit event")}>
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => onDelete(disaster.id)} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" aria-label={translate("Delete event")}>
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {isModalOpen && (
                <HistoricalEventModal 
                    event={editingEvent}
                    onSave={handleSaveEvent}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};
export default HistoricalDatabase;