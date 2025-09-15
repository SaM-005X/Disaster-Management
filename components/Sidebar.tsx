import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import type { LabView } from '../App';
import { useTranslate } from '../contexts/TranslationContext';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { HomeIcon } from './icons/HomeIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { KeyIcon } from './icons/KeyIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { WindIcon } from './icons/WindIcon';
import { XIcon } from './icons/XIcon';
import { NewspaperIcon } from './icons/NewspaperIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { ExitIcon } from './icons/ExitIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { MessageSquareIcon } from './icons/MessageSquareIcon';
import { BroadcastIcon } from './icons/BroadcastIcon';

type Page = 'dashboard' | 'lab' | 'distress' | 'progress' | 'meteo' | 'news' | 'tectonic' | 'exit_planner' | 'notebook' | 'chat' | 'iot';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
  labView: LabView;
  onShowSolutions: () => void;
}

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-colors duration-200 ${
        isActive
          ? 'bg-teal-600 text-white shadow-lg'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

const SubNavLink: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-2 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
        isActive
          ? 'text-teal-600 dark:text-teal-400 font-bold'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-3 ${isActive ? 'bg-teal-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
      {label}
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, setIsOpen, user, labView, onShowSolutions }) => {
  const { translate } = useTranslate();
  const [isMeteoOpen, setIsMeteoOpen] = useState(currentPage === 'meteo' || currentPage === 'tectonic');

  useEffect(() => {
    if (currentPage === 'meteo' || currentPage === 'tectonic') {
        setIsMeteoOpen(true);
    }
  }, [currentPage]);

  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    setIsOpen(false);
  };

  const handleSolutionsClick = () => {
    onShowSolutions();
    setIsOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-8 w-8 text-teal-500" />
          <span className="text-xl font-bold text-gray-800 dark:text-white">{translate('AlertIQ')}</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
             <XIcon className="h-6 w-6" />
        </button>
      </div>
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          <li>
            <NavLink
              icon={<HomeIcon className="h-6 w-6" />}
              label={translate('Dashboard')}
              isActive={currentPage === 'dashboard'}
              onClick={() => handleNavigation('dashboard')}
            />
          </li>
          <li>
            <NavLink
              icon={<BeakerIcon className="h-6 w-6" />}
              label={translate('Lab / Simulation')}
              isActive={currentPage === 'lab' && labView !== 'solutions'}
              onClick={() => handleNavigation('lab')}
            />
          </li>
          <li>
            <NavLink
              icon={<MessageSquareIcon className="h-6 w-6" />}
              label={translate('Chat')}
              isActive={currentPage === 'chat'}
              onClick={() => handleNavigation('chat')}
            />
          </li>
          <li>
            <NavLink
              icon={<BroadcastIcon className="h-6 w-6" />}
              label={translate('Digital Sensors')}
              isActive={currentPage === 'iot'}
              onClick={() => handleNavigation('iot')}
            />
          </li>
          <li>
            <NavLink
              icon={<ExitIcon className="h-6 w-6" />}
              label={translate('Exit Planner')}
              isActive={currentPage === 'exit_planner'}
              onClick={() => handleNavigation('exit_planner')}
            />
          </li>
           <li>
            <NavLink
              icon={<ClipboardListIcon className="h-6 w-6" />}
              label={translate('AI Notebook')}
              isActive={currentPage === 'notebook'}
              onClick={() => handleNavigation('notebook')}
            />
          </li>
          {user && user.role !== UserRole.GOVERNMENT_OFFICIAL && (
            <li>
                <button
                onClick={() => setIsMeteoOpen(!isMeteoOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-semibold transition-colors duration-200 ${
                    (currentPage === 'meteo' || currentPage === 'tectonic')
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                >
                <div className="flex items-center space-x-3">
                    <WindIcon className="h-6 w-6" />
                    <span>{translate('Meteorology')}</span>
                </div>
                <ChevronDownIcon className={`h-5 w-5 transition-transform ${isMeteoOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMeteoOpen && (
                <div className="pl-8 pt-2 pb-1 space-y-2">
                    <SubNavLink
                    label={translate('Wind & Weather Map')}
                    isActive={currentPage === 'meteo'}
                    onClick={() => handleNavigation('meteo')}
                    />
                    <SubNavLink
                    label={translate('Tectonic Activity Map')}
                    isActive={currentPage === 'tectonic'}
                    onClick={() => handleNavigation('tectonic')}
                    />
                </div>
                )}
            </li>
          )}
           <li>
            <NavLink
              icon={<NewspaperIcon className="h-6 w-6" />}
              label={translate('News Portal')}
              isActive={currentPage === 'news'}
              onClick={() => handleNavigation('news')}
            />
          </li>
          <li>
            <NavLink
              icon={<TrendingUpIcon className="h-6 w-6" />}
              label={translate('Progress Tracker')}
              isActive={currentPage === 'progress'}
              onClick={() => handleNavigation('progress')}
            />
          </li>
          {(user?.role === UserRole.TEACHER || user?.role === UserRole.GOVERNMENT_OFFICIAL || user?.role === UserRole.USER) && (
            <li>
                <NavLink
                    icon={<KeyIcon className="h-6 w-6" />}
                    label={translate('Answer Key & Guides')}
                    isActive={currentPage === 'lab' && labView === 'solutions'}
                    onClick={handleSolutionsClick}
                />
            </li>
          )}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
         <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 AlertIQ Platform</p>
      </div>
    </>
  );

  return (
    <>
        {/* Mobile Sidebar */}
        <div 
            className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
        ></div>
        <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {sidebarContent}
        </aside>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex fixed top-0 left-0 h-full w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30">
            {sidebarContent}
        </aside>
    </>
  );
};

export default Sidebar;
