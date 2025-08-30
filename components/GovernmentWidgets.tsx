import React, { useState } from 'react';
import type { User, Resource, HistoricalDisaster } from '../types';
import WindyMap from './WindyMap';
import TectonicMap from './TectonicMap';
import ResourceTracker from './ResourceTracker';
import HistoricalDatabase from './HistoricalDatabase';
import { useTranslate } from '../contexts/TranslationContext';
import { WindIcon } from './icons/WindIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { NewspaperIcon } from './icons/NewspaperIcon';
import { Theme } from '../App';

interface GovernmentWidgetsProps {
    user: User;
    theme: Theme;
    resources: Resource[];
    historicalDisasters: HistoricalDisaster[];
    onAddResource: (data: Omit<Resource, 'id' | 'lastUpdated'>) => void;
    onUpdateResource: (data: Omit<Resource, 'lastUpdated'> & { id: string }) => void;
    onDeleteResource: (id: string) => void;
    onAddDisaster: (data: Omit<HistoricalDisaster, 'id'>) => void;
    onUpdateDisaster: (data: HistoricalDisaster) => void;
    onDeleteDisaster: (id: string) => void;
}

type TabKey = 'weather' | 'tectonic' | 'resources' | 'history';

const GovernmentWidgets: React.FC<GovernmentWidgetsProps> = ({ 
    user, 
    theme,
    resources, 
    historicalDisasters,
    onAddResource,
    onUpdateResource,
    onDeleteResource,
    onAddDisaster,
    onUpdateDisaster,
    onDeleteDisaster
}) => {
    const { translate } = useTranslate();
    const [activeTab, setActiveTab] = useState<TabKey>('resources');
    
    const tabs: { key: TabKey, name: string, icon: React.ReactNode }[] = [
        { key: 'resources', name: 'Resource Tracker', icon: <BuildingIcon className="h-5 w-5" /> },
        { key: 'history', name: 'Historical Data', icon: <NewspaperIcon className="h-5 w-5" /> },
        { key: 'weather', name: 'Live Weather & Alerts', icon: <WindIcon className="h-5 w-5" /> },
        { key: 'tectonic', name: 'Tectonic Activity', icon: <GlobeIcon className="h-5 w-5" /> },
    ];

    return (
        <div className="mb-12 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg">
            <div className="mb-6">
                <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">{translate('Disaster Management Console')}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{translate('Real-time data and analytics for disaster preparedness and response.')}</p>
            </div>
            
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex flex-wrap" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`${
                                activeTab === tab.key
                                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                            } mr-2 mb-2 sm:mr-4 flex items-center gap-2 whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.icon}
                            {translate(tab.name)}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="mt-6">
                {activeTab === 'weather' && <WindyMap user={user} theme={theme} />}
                {activeTab === 'tectonic' && <TectonicMap user={user} />}
                {activeTab === 'resources' && (
                    <ResourceTracker 
                        resources={resources}
                        onAdd={onAddResource}
                        onUpdate={onUpdateResource}
                        onDelete={onDeleteResource}
                    />
                )}
                {activeTab === 'history' && (
                    <HistoricalDatabase 
                        disasters={historicalDisasters}
                        onAdd={onAddDisaster}
                        onUpdate={onUpdateDisaster}
                        onDelete={onDeleteDisaster}
                    />
                )}
            </div>
        </div>
    );
};
export default GovernmentWidgets;
