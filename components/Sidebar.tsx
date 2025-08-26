import React from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import type { LabView } from '../App';
import { useTranslate } from '../contexts/TranslationContext';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { HomeIcon } from './icons/HomeIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { KeyIcon } from './icons/KeyIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { XIcon } from './icons/XIcon';

type Page = 'dashboard' | 'lab' | 'distress' | 'progress';

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

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, setIsOpen, user, labView, onShowSolutions }) => {
  const { translate } = useTranslate();

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
          <span className="text-xl font-bold text-gray-800 dark:text-white">{translate('EduSafe')}</span>
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
              icon={<TrendingUpIcon className="h-6 w-6" />}
              label={translate('Progress Tracker')}
              isActive={currentPage === 'progress'}
              onClick={() => handleNavigation('progress')}
            />
          </li>
          {user?.role === UserRole.TEACHER && (
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
         <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 EduSafe Platform</p>
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
