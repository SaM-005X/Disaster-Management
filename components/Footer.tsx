import React from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { TwitterIcon } from './icons/TwitterIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { InstagramIcon } from './icons/InstagramIcon';
import { IndianFlagIcon } from './icons/IndianFlagIcon';

interface FooterProps {
    onDashboardClick: () => void;
    onLabClick: () => void;
    onOpenPanicModal: () => void;
}

const Footer: React.FC<FooterProps> = ({ onDashboardClick, onLabClick, onOpenPanicModal }) => {
    const { translate } = useTranslate();

    const handleAboutClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const aboutSection = document.getElementById('about-us');
        if (aboutSection) {
            aboutSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <footer className="bg-gray-800 dark:bg-gray-900 text-gray-300">
            <div className="container mx-auto px-4 md:px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* About Section */}
                    <div className="md:col-span-1">
                        <div className="flex items-center space-x-2 mb-4">
                            <ShieldCheckIcon className="h-8 w-8 text-teal-400" />
                            <h2 className="text-2xl font-bold text-white">{translate('EduSafe')}</h2>
                        </div>
                        <p className="text-sm">{translate('Building a resilient community through disaster management education.')}</p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">{translate('Quick Links')}</h3>
                        <ul className="space-y-2">
                            <li><a href="#about-us" onClick={handleAboutClick} className="hover:text-teal-400 transition-colors">{translate('About Us')}</a></li>
                            <li><button onClick={onDashboardClick} className="hover:text-teal-400 transition-colors text-left">{translate('Dashboard')}</button></li>
                            <li><button onClick={onLabClick} className="hover:text-teal-400 transition-colors text-left">{translate('Lab / Simulation')}</button></li>
                        </ul>
                    </div>

                    {/* Contact Us */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">{translate('Contact Us')}</h3>
                        <ul className="space-y-2">
                            <li><button onClick={onOpenPanicModal} className="hover:text-teal-400 transition-colors text-left">{translate('Rescue / Distress Form')}</button></li>
                            <li><a href="mailto:info@edusafe.org" className="hover:text-teal-400 transition-colors">info@edusafe.org</a></li>
                        </ul>
                        <div className="flex space-x-4 mt-4">
                            <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-teal-400"><TwitterIcon className="h-6 w-6" /></a>
                            <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-teal-400"><FacebookIcon className="h-6 w-6" /></a>
                            <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-teal-400"><InstagramIcon className="h-6 w-6" /></a>
                        </div>
                    </div>

                    {/* Supported By */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">{translate('Supported By')}</h3>
                        <div className="flex items-center gap-4">
                            <IndianFlagIcon className="h-12 w-12" />
                            <div>
                                <p className="font-bold text-white">{translate('Government of India')}</p>
                                <p className="text-sm">{translate('National Disaster Management Authority')}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} {translate('EduSafe Platform. All Rights Reserved.')}</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;