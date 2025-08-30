import React, { useState } from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { ResourceStatus, type Resource } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import ResourceEditModal from './ResourceEditModal';

interface ResourceTrackerProps {
    resources: Resource[];
    onAdd: (data: Omit<Resource, 'id' | 'lastUpdated'>) => void;
    onUpdate: (data: Omit<Resource, 'lastUpdated'> & { id: string }) => void;
    onDelete: (id: string) => void;
}

const getStatusColor = (status: ResourceStatus) => {
    switch(status) {
        case 'Available': return 'bg-emerald-500';
        case 'Deployed': return 'bg-sky-500';
        case 'Low Stock': return 'bg-amber-500';
    }
};

const ResourceTracker: React.FC<ResourceTrackerProps> = ({ resources, onAdd, onUpdate, onDelete }) => {
    const { translate } = useTranslate();
    const [sortConfig, setSortConfig] = useState<{ key: keyof Resource; direction: 'asc' | 'desc' } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);

    const sortedResources = React.useMemo(() => {
        let sortableItems = [...resources];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];
                
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
                }
                if (typeof valA === 'string' && typeof valB === 'string') {
                     return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
                return 0;
            });
        }
        return sortableItems;
    }, [resources, sortConfig]);

    const requestSort = (key: keyof Resource) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleOpenAddModal = () => {
        setEditingResource(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (resource: Resource) => {
        setEditingResource(resource);
        setIsModalOpen(true);
    };

    const handleSaveResource = (resourceData: Omit<Resource, 'id' | 'lastUpdated'>) => {
        if (editingResource) {
            onUpdate({ id: editingResource.id, ...resourceData });
        } else {
            onAdd(resourceData);
        }
        setIsModalOpen(false);
    };

    const SortableHeader: React.FC<{ sortKey: keyof Resource, label: string }> = ({ sortKey, label }) => (
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
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{translate('National Resource Allocation Tracker')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{translate('Manage and track critical disaster response assets.')}</p>
                </div>
                 <button 
                    onClick={handleOpenAddModal} 
                    className="flex-shrink-0 flex items-center gap-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors"
                >
                    <PlusCircleIcon className="h-5 w-5"/>
                    <span>{translate('Add Resource')}</span>
                 </button>
            </div>
            <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <SortableHeader sortKey="type" label="Resource Type" />
                            <SortableHeader sortKey="location" label="Location" />
                            <SortableHeader sortKey="status" label="Status" />
                            <SortableHeader sortKey="quantity" label="Quantity" />
                            <SortableHeader sortKey="lastUpdated" label="Last Updated" />
                             <th scope="col" className="px-6 py-3 text-center">{translate('Actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedResources.map((resource) => (
                            <tr key={resource.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{translate(resource.type)}</td>
                                <td className="px-6 py-4">{resource.location}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(resource.status)} mr-2`}></div>
                                        {translate(resource.status)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">{resource.quantity.toLocaleString()}</td>
                                <td className="px-6 py-4">{new Date(resource.lastUpdated).toLocaleString()}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <button onClick={() => handleOpenEditModal(resource)} className="p-2 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400" aria-label={translate("Edit resource")}>
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => onDelete(resource.id)} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" aria-label={translate("Delete resource")}>
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
                <ResourceEditModal 
                    resource={editingResource}
                    onSave={handleSaveResource}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};
export default ResourceTracker;