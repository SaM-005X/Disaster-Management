import React, { useEffect } from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';

const AboutUs: React.FC = () => {
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId } = useTTS();

    const title = translate('About EduSafe');
    const problemTitle = translate('The Problem: A Gap in Preparedness');
    const problemText = translate("India is a land of immense diversity and resilience, but it's also vulnerable to a range of natural disasters. We observed a troubling paradox: while disaster management plans existed on paper, a culture of genuine preparedness was missing where it matters most—in our schools and colleges. Students and staff, the heart of our communities, were often left unprepared to face crises like earthquakes, floods, or fires.");
    const solutionTitle = translate('Our Solution: The EduSafe Platform');
    const solutionText = translate("EduSafe is our answer. It's more than just an app; it's a comprehensive digital ecosystem designed to build disaster resilience from the ground up. We do this by focusing on key pillars like engaging education, practical training via virtual drills, localized awareness, and connected communities.");
    const missionTitle = translate('Our Mission');
    const missionText = translate("We are a team of dedicated students, developers, and visionaries committed to creating a tangible impact. Our goal is to empower the next generation, making them assets to their communities and fostering a nationwide culture of safety and preparedness.");

    useEffect(() => {
        // This component is always visible, but we only want its content to be "active" for TTS
        // when it's in view. A more advanced implementation might use IntersectionObserver.
        // For now, we assume if another page with higher priority is loaded, its useEffect
        // will call registerTexts and replace this queue.
        const textsToRead: TTSText[] = [
            { id: 'about-us-title', text: title },
            { id: 'about-us-problem-title', text: problemTitle },
            { id: 'about-us-problem-text', text: problemText },
            { id: 'about-us-solution-title', text: solutionTitle },
            { id: 'about-us-solution-text', text: solutionText },
            { id: 'about-us-mission-title', text: missionTitle },
            { id: 'about-us-mission-text', text: missionText },
        ];
        
        // A simple check to see if we are on the main dashboard view
        if (window.location.pathname === '/' || window.location.pathname === '') {
             // This is a rough heuristic. In a real SPA with routing, you'd check the route.
             // We delay registration slightly to allow primary content to register first.
            setTimeout(() => {
                 // In a real app, we'd append, not replace. But our context replaces.
                 // This section is secondary, so we don't register if another component has.
            }, 500);
        }

    }, [registerTexts, title, problemTitle, problemText, solutionTitle, solutionText, missionTitle, missionText]);

    return (
        <section id="about-us" className="bg-gray-100 dark:bg-gray-800 py-12 md:py-16">
            <div className="container mx-auto px-4 md:px-6">
                <h2 id="about-us-title" className={`text-3xl md:text-4xl font-extrabold text-center text-gray-800 dark:text-white mb-8 ${currentlySpokenId === 'about-us-title' ? 'tts-highlight' : ''}`}>{title}</h2>
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h3 id="about-us-problem-title" className={`text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2 ${currentlySpokenId === 'about-us-problem-title' ? 'tts-highlight' : ''}`}>{problemTitle}</h3>
                        <p id="about-us-problem-text" className={`text-gray-700 dark:text-gray-300 leading-relaxed ${currentlySpokenId === 'about-us-problem-text' ? 'tts-highlight' : ''}`}>{problemText}</p>
                    </div>
                    <div>
                        <h3 id="about-us-solution-title" className={`text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2 ${currentlySpokenId === 'about-us-solution-title' ? 'tts-highlight' : ''}`}>{solutionTitle}</h3>
                        <p id="about-us-solution-text" className={`text-gray-700 dark:text-gray-300 leading-relaxed ${currentlySpokenId === 'about-us-solution-text' ? 'tts-highlight' : ''}`}>{solutionText}</p>
                    </div>
                     <div>
                        <h3 id="about-us-mission-title" className={`text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2 ${currentlySpokenId === 'about-us-mission-title' ? 'tts-highlight' : ''}`}>{missionTitle}</h3>
                        <p id="about-us-mission-text" className={`text-gray-700 dark:text-gray-300 leading-relaxed ${currentlySpokenId === 'about-us-mission-text' ? 'tts-highlight' : ''}`}>{missionText}</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutUs;
