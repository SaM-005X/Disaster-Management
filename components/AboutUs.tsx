import React from 'react';
import { useTranslate } from '../contexts/TranslationContext';

const AboutUs: React.FC = () => {
    const { translate } = useTranslate();

    const title = translate('About AlertIQ');
    const problemTitle = translate('The Problem: A Gap in Preparedness');
    const problemText = translate("India is a land of immense diversity and resilience, but it's also vulnerable to a range of natural disasters. We observed a troubling paradox: while disaster management plans existed on paper, a culture of genuine preparedness was missing where it matters most—in our schools and colleges. Students and staff, the heart of our communities, were often left unprepared to face crises like earthquakes, floods, or fires.");
    const solutionTitle = translate('Our Solution: The AlertIQ Platform');
    const solutionText = translate("AlertIQ is our answer. It's more than just an app; it's a comprehensive digital ecosystem designed to build disaster resilience from the ground up. We do this by focusing on key pillars like engaging education, practical training via virtual drills, localized awareness, and connected communities.");
    const missionTitle = translate('Our Mission');
    const missionText = translate("We are a team of dedicated students, developers, and visionaries committed to creating a tangible impact. Our goal is to empower the next generation, making them assets to their communities and fostering a nationwide culture of safety and preparedness.");

    return (
        <section id="about-us" className="bg-gray-100 dark:bg-gray-800 py-12 md:py-16">
            <div className="container mx-auto px-4 md:px-6">
                <h2 id="about-us-title" className="text-3xl md:text-4xl font-extrabold text-center text-gray-800 dark:text-white mb-8">{title}</h2>
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h3 id="about-us-problem-title" className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">{problemTitle}</h3>
                        <p id="about-us-problem-text" className="text-gray-700 dark:text-gray-300 leading-relaxed">{problemText}</p>
                    </div>
                    <div>
                        <h3 id="about-us-solution-title" className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">{solutionTitle}</h3>
                        <p id="about-us-solution-text" className="text-gray-700 dark:text-gray-300 leading-relaxed">{solutionText}</p>
                    </div>
                     <div>
                        <h3 id="about-us-mission-title" className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">{missionTitle}</h3>
                        <p id="about-us-mission-text" className="text-gray-700 dark:text-gray-300 leading-relaxed">{missionText}</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutUs;