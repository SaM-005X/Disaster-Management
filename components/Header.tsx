import React, { useState, useRef, useEffect } from 'react';
import type { User, Institution } from '../types';
import { useTranslate, SUPPORTED_LANGUAGES } from '../contexts/TranslationContext';
import { useTTS, TTS_DEFAULTS } from '../contexts/TTSContext';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { LogOutIcon } from './icons/LogOutIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { StopIcon } from './icons/StopIcon';
import { MenuIcon } from './icons/MenuIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import ConnectivityStatusIndicator from './ConnectivityStatusIndicator';
import { IndianFlagIcon } from './icons/IndianFlagIcon';

interface HeaderProps {
  user: User;
  institution: Institution;
  onProfileClick: () => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onMenuClick: () => void;
  showMenuButton: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, institution, onProfileClick, onLogout, theme, toggleTheme, onMenuClick, showMenuButton }) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage, isTranslating, translate } = useTranslate();
  const { toggleReadAloud, stopReadAloud, isPlaying, isPaused, hasQueue, isSupported, rate, pitch, setRate, setPitch } = useTTS();

  const handleClickOutside = (event: MouseEvent) => {
    if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
      setIsUserDropdownOpen(false);
    }
    if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
      setIsLangDropdownOpen(false);
    }
    if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
      setIsSettingsDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const buttonBaseClasses = "p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent";

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="container mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {showMenuButton && (
             <button onClick={onMenuClick} className={`${buttonBaseClasses} lg:hidden`}>
                <MenuIcon className="h-6 w-6" />
             </button>
          )}
          {/* Official Government Branding */}
          <IndianFlagIcon className="h-8 w-8 flex-shrink-0" />
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 hidden sm:flex items-center gap-x-2 sm:gap-x-3">
            <span>{translate('Government of India')}</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
          </div>

          {/* App Branding */}
          <ShieldCheckIcon className="h-8 w-8 text-teal-600 dark:text-teal-400 flex-shrink-0" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
            {translate('Disaster Ready')}
          </h1>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <ConnectivityStatusIndicator />
          {isSupported && (
            <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
              <button
                onClick={toggleReadAloud}
                className={buttonBaseClasses}
                disabled={!hasQueue}
                aria-label={isPlaying && !isPaused ? translate('Pause reading') : translate('Read page content aloud')}
              >
                {isPlaying && !isPaused ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
              </button>
              {isPlaying && (
                <button
                  onClick={stopReadAloud}
                  className={`${buttonBaseClasses} text-red-500 dark:text-red-400`}
                  aria-label={translate('Stop reading')}
                >
                  <StopIcon className="h-6 w-6" />
                </button>
              )}
               <div className="relative" ref={settingsDropdownRef}>
                <button
                    onClick={() => setIsSettingsDropdownOpen(prev => !prev)}
                    className={buttonBaseClasses}
                    aria-label={translate('Open TTS settings')}
                >
                    <SettingsIcon className="h-6 w-6" />
                </button>
                {isSettingsDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 ring-1 ring-black ring-opacity-5 z-20 space-y-4">
                        <div>
                            <label htmlFor="tts-rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {translate('Speed')}: <span className="font-bold">{rate.toFixed(1)}x</span>
                            </label>
                            <input
                                id="tts-rate"
                                type="range"
                                min={TTS_DEFAULTS.minRate}
                                max={TTS_DEFAULTS.maxRate}
                                step="0.1"
                                value={rate}
                                onChange={(e) => setRate(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-teal-600"
                            />
                        </div>
                        <div>
                            <label htmlFor="tts-pitch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {translate('Pitch')}: <span className="font-bold">{pitch.toFixed(1)}</span>
                            </label>
                            <input
                                id="tts-pitch"
                                type="range"
                                min={TTS_DEFAULTS.minPitch}
                                max={TTS_DEFAULTS.maxPitch}
                                step="0.1"
                                value={pitch}
                                onChange={(e) => setPitch(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-teal-600"
                            />
                        </div>
                    </div>
                )}
                </div>
            </div>
          )}

          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setIsLangDropdownOpen(prev => !prev)}
              className={buttonBaseClasses}
              aria-label={translate('Select language')}
            >
              <GlobeIcon className={`h-6 w-6 ${isTranslating ? 'animate-spin' : ''}`} />
            </button>
            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20">
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                   <button
                    key={code}
                    onClick={() => { setLanguage(code); setIsLangDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm ${language === code ? 'font-bold text-teal-600 dark:text-teal-400 bg-gray-100 dark:bg-gray-700' : 'text-gray-700 dark:text-gray-200'} hover:bg-gray-100 dark:hover:bg-gray-700`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={toggleTheme}
            className={buttonBaseClasses}
            aria-label={translate(`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`)}
          >
            {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
          </button>
          <div className="relative" ref={userDropdownRef}>
            <button
              className="flex items-center space-x-4 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-gray-900 rounded-full"
              onClick={() => setIsUserDropdownOpen(prev => !prev)}
              aria-label={translate('Open user menu')}
              aria-haspopup="true"
              aria-expanded={isUserDropdownOpen}
            >
              <div className="text-right hidden sm:block">
                <p className="font-semibold text-sm text-gray-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{translate(user.role)} - {institution.name}</p>
              </div>
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-10 w-10 rounded-full border-2 border-transparent group-focus:border-teal-500 transition-colors object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full border-2 border-transparent group-focus:border-teal-500 transition-colors bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </button>
            
            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20">
                <button
                  onClick={() => { onProfileClick(); setIsUserDropdownOpen(false); }}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <UserCircleIcon className="h-5 w-5 mr-3" />
                  <span>{translate('Profile')}</span>
                </button>
                <button
                  onClick={() => { onLogout(); setIsUserDropdownOpen(false); }}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOutIcon className="h-5 w-5 mr-3" />
                  <span>{translate('Logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;