import React, { useState, useCallback, useEffect } from 'react';
import { MODULES, QUIZZES } from './constants';
import type { LearningModule, Quiz, User, QuizScore, LabScore, StudentProgress, AvatarStyle, Institution, Resource, HistoricalDisaster, ResourceType, ResourceStatus, StoredFloorplan, AINote } from './types';
import { UserRole } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ModuleViewer from './components/ModuleViewer';
import QuizView from './components/Quiz';
import QuizResult from './components/QuizResult';
import Profile from './components/Profile';
import PanicButton from './components/PanicButton';
import PanicModal from './components/PanicModal';
import Auth from './components/Auth';
import ChatbotButton from './components/ChatbotButton';
import Chatbot from './components/Chatbot';
import GuideAvatar from './components/GuideAvatar';
import Sidebar from './components/Sidebar';
import LabDashboard from './components/LabDashboard';
import Simulation from './components/Simulation';
import Certificate from './components/Certificate';
import SolutionsView from './components/SolutionsView';
import DistressForm from './components/DistressForm';
import Footer from './components/Footer';
import AboutUs from './components/AboutUs';
import ProgressTracker from './components/ProgressTracker';
import AlertsBanner from './components/AlertsBanner';
import WindyMap from './components/WindyMap';
import TectonicMap from './components/TectonicMap';
import { useTranslate } from './contexts/TranslationContext';
import OfflineStatusToast from './components/OfflineStatusToast';
import News from './components/News';
import { fetchHistoricalDisasters } from './services/historicalDisasterService';
import ExitPlanner from './components/ExitPlanner';
import AINotebook from './components/AINotebook';

type Page = 'dashboard' | 'lab' | 'distress' | 'progress' | 'meteo' | 'news' | 'tectonic' | 'exit_planner' | 'notebook';
type DashboardView = 'dashboard' | 'module' | 'quiz' | 'result' | 'profile';
export type LabView = 'lab_dashboard' | 'simulation' | 'final_certificate' | 'solutions';
export type Theme = 'light' | 'dark';
export type AvatarMood = 'neutral' | 'happy' | 'thinking' | 'encouraging';

const MOCK_RESOURCES: Resource[] = [
  { id: 'res-1', type: 'Medical Kits' as ResourceType, location: 'New Delhi', status: 'Available' as ResourceStatus, quantity: 500, lastUpdated: new Date().toISOString() },
  { id: 'res-2', type: 'Rescue Teams' as ResourceType, location: 'Mumbai', status: 'Deployed' as ResourceStatus, quantity: 20, lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'res-3', type: 'Food Supplies' as ResourceType, location: 'Chennai', status: 'Available' as ResourceStatus, quantity: 10000, lastUpdated: new Date().toISOString() },
  { id: 'res-4', type: 'Water Tankers' as ResourceType, location: 'Kolkata', status: 'Low Stock' as ResourceStatus, quantity: 15, lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  { id: 'res-5', type: 'Shelter Units' as ResourceType, location: 'Bengaluru', status: 'Available' as ResourceStatus, quantity: 250, lastUpdated: new Date().toISOString() },
];

const OfficialBanner: React.FC = () => {
    const { translate } = useTranslate();
    return (
        <div className="bg-gradient-to-r from-orange-50 via-white to-green-50 dark:from-orange-900/20 dark:via-gray-800/20 dark:to-green-900/20 py-2 text-center shadow-sm">
            <p className="font-bold text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-gray-700 to-green-700 dark:from-orange-400 dark:via-gray-300 dark:to-green-400">
                {translate('Sikshit Bharat, Surakshit Bharat')}
            </p>
        </div>
    );
};


const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress | undefined>(undefined);
  const [allProgressData, setAllProgressData] = useState<Record<string, StudentProgress>>({});
  
  // Government Official Widgets State
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [historicalDisasters, setHistoricalDisasters] = useState<HistoricalDisaster[]>([]);
  const [storedFloorplans, setStoredFloorplans] = useState<StoredFloorplan[]>([]);
  const [aiNotes, setAiNotes] = useState<AINote[]>([]);

  const isAuthenticated = !!currentUser;

  // Navigation State
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [dashboardView, setDashboardView] = useState<DashboardView>('dashboard');
  const [labView, setLabView] = useState<LabView>('lab_dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [preProfileLocation, setPreProfileLocation] = useState<{ page: Page; view: DashboardView | LabView | null } | null>(null);

  // Content State
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [lastQuizResult, setLastQuizResult] = useState<QuizScore | null>(null);
  const [isAlertsBannerVisible, setIsAlertsBannerVisible] = useState(true);

  // Derived state for the current student's progress
  const quizScores = studentProgress?.quizScores ?? {};
  const labScores = studentProgress?.labScores ?? {};


  // Theme State
  const [theme, setTheme] = useState<Theme>('light');

  // Panic Button & Location State
  const [isPanicModalOpen, setIsPanicModalOpen] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Chatbot State
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Avatar State
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatarMood, setAvatarMood] = useState<AvatarMood>('happy');
  const [isAvatarVisible, setIsAvatarVisible] = useState(true);
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>('default');

  // Offline/PWA State
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Hooks
  const { translate } = useTranslate();

  // --- STATE PERSISTENCE & INITIALIZATION ---
  // Load state from storage on initial mount
  useEffect(() => {
    try {
      // Persistent data from localStorage
      const storedUsersJSON = localStorage.getItem('allUsers');
      const storedUsers = storedUsersJSON ? JSON.parse(storedUsersJSON) : [];
      setAllUsers(storedUsers);

      const storedProgressJSON = localStorage.getItem('allProgressData');
      const storedProgress = storedProgressJSON ? JSON.parse(storedProgressJSON) : {};
      setAllProgressData(storedProgress);
      
      const storedPlansJSON = localStorage.getItem('storedFloorplans');
      const storedPlans = storedPlansJSON ? JSON.parse(storedPlansJSON) : [];
      setStoredFloorplans(storedPlans);
      
      const storedAiNotesJSON = localStorage.getItem('aiNotes');
      const storedAiNotes = storedAiNotesJSON ? JSON.parse(storedAiNotesJSON) : [];
      setAiNotes(storedAiNotes);

      // Session data from sessionStorage
      const storedUserJSON = sessionStorage.getItem('currentUser');
      if (storedUserJSON) {
        const user: User = JSON.parse(storedUserJSON);
        
        setCurrentUser(user);
        setAvatarStyle(user.avatarStyle || 'default');
        if (user.role === UserRole.STUDENT) {
            setStudentProgress(storedProgress[user.id] || { quizScores: {}, labScores: {}, timeSpent: 0 });
        } else {
            setStudentProgress(undefined);
        }

        // Restore navigation and content state
        const storedPage = sessionStorage.getItem('currentPage');
        if (storedPage) setCurrentPage(JSON.parse(storedPage));
        
        const storedDashboardView = sessionStorage.getItem('dashboardView');
        if (storedDashboardView) setDashboardView(JSON.parse(storedDashboardView));

        const storedLabView = sessionStorage.getItem('labView');
        if (storedLabView) setLabView(JSON.parse(storedLabView));
        
        // Load module & quiz from localStorage for persistence
        const storedSelectedModule = localStorage.getItem('selectedModule');
        if (storedSelectedModule) setSelectedModule(JSON.parse(storedSelectedModule));
        
        const storedSelectedQuiz = localStorage.getItem('selectedQuiz');
        if (storedSelectedQuiz) setSelectedQuiz(JSON.parse(storedSelectedQuiz));

        const storedLastQuizResult = sessionStorage.getItem('lastQuizResult');
        if (storedLastQuizResult) setLastQuizResult(JSON.parse(storedLastQuizResult));
      }
    } catch (error) {
      console.error("Failed to load state from storage:", error);
      localStorage.clear();
      sessionStorage.clear();
    }
  }, []); // Empty dependency array means this runs only once

  // Save persistent data to localStorage when it changes
  useEffect(() => {
    if (allUsers.length > 0) {
        localStorage.setItem('allUsers', JSON.stringify(allUsers));
    }
  }, [allUsers]);

  useEffect(() => {
     if (Object.keys(allProgressData).length > 0) {
        localStorage.setItem('allProgressData', JSON.stringify(allProgressData));
    }
  }, [allProgressData]);

  useEffect(() => {
    if (storedFloorplans.length > 0) {
        localStorage.setItem('storedFloorplans', JSON.stringify(storedFloorplans));
    } else {
        localStorage.removeItem('storedFloorplans');
    }
  }, [storedFloorplans]);
  
  useEffect(() => {
    if (aiNotes.length > 0) {
        localStorage.setItem('aiNotes', JSON.stringify(aiNotes));
    } else {
        localStorage.removeItem('aiNotes');
    }
  }, [aiNotes]);

  // Save session data to sessionStorage when relevant state changes
  useEffect(() => {
    if (currentUser) {
      try {
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        sessionStorage.setItem('currentPage', JSON.stringify(currentPage));
        sessionStorage.setItem('dashboardView', JSON.stringify(dashboardView));
        sessionStorage.setItem('labView', JSON.stringify(labView));
        sessionStorage.setItem('lastQuizResult', JSON.stringify(lastQuizResult));
      } catch (error) {
        console.error("Failed to save session state:", error);
      }
    }
  }, [currentUser, currentPage, dashboardView, labView, lastQuizResult]);

  // Save persistent learning state to localStorage
  useEffect(() => {
    try {
        if (selectedModule) {
            localStorage.setItem('selectedModule', JSON.stringify(selectedModule));
        } else {
            localStorage.removeItem('selectedModule');
        }
        if (selectedQuiz) {
            localStorage.setItem('selectedQuiz', JSON.stringify(selectedQuiz));
        } else {
            localStorage.removeItem('selectedQuiz');
        }
    } catch (error) {
        console.error("Failed to save learning state:", error);
    }
  }, [selectedModule, selectedQuiz]);

  // Load historical disaster data once on mount
  useEffect(() => {
    const loadHistoricalData = async () => {
        try {
            const data = await fetchHistoricalDisasters();
            setHistoricalDisasters(data);
        } catch (err) {
            console.error("Failed to load historical disaster data:", err);
        }
    };
    loadHistoricalData();
  }, []);

  // Handle Login
  const handleLogin = (user: User) => {
       const userWithDefaults: User = {
            ...user,
            homeAddress: user.homeAddress ?? '',
            institutionName: user.institutionName || 'My Institution',
            institutionAddress: user.institutionAddress ?? '',
            institutionPhone: user.institutionPhone ?? ''
        };
      setCurrentUser(userWithDefaults);
      setAvatarStyle(user.avatarStyle || 'default');
      
      if (user.role === UserRole.STUDENT) {
        setStudentProgress(allProgressData[user.id] || { quizScores: {}, labScores: {}, timeSpent: 0 });
      } else {
        setStudentProgress(undefined);
      }
  };
  
  // Handle Sign Up
  const handleSignUpAndLogin = (newUserData: Omit<User, 'id' | 'avatarUrl' | 'rollNumber' | 'avatarStyle' | 'homeAddress' | 'institutionAddress' | 'institutionPhone'>) => {
    const newUser: User = {
      ...newUserData,
      id: `user-${Date.now()}`,
      avatarUrl: `https://picsum.photos/seed/${newUserData.name}/100/100`,
      avatarStyle: 'default',
      homeAddress: '', // Start with blank home address
      institutionAddress: '', // Start with blank institution address
      institutionPhone: '', // Start with blank institution phone
    };

    setAllUsers(prev => [...prev, newUser]);
    setAllProgressData(prev => ({
        ...prev,
        [newUser.id]: { quizScores: {}, labScores: {}, timeSpent: 0 }
    }));
    handleLogin(newUser); // Log in the new user immediately
  };

  // Effect for Service Worker Registration and Updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          setServiceWorkerRegistration(registration);

          navigator.serviceWorker.addEventListener('controllerchange', () => {
            // New service worker has taken control, safe to reload.
            window.location.reload();
          });

          // A new service worker is waiting to be activated.
          if (registration.waiting) {
            setShowUpdateToast(true);
          }
          
          // A new service worker has been found and is installing.
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  // If there's an existing SW, an update is ready. Otherwise, it's the first install.
                  if (navigator.serviceWorker.controller) {
                    setShowUpdateToast(true);
                  } else {
                    setShowOfflineToast(true);
                    setTimeout(() => setShowOfflineToast(false), 5000);
                  }
                }
              };
            }
          };
        }).catch(error => {
          console.error('Service Worker registration failed:', error);
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    const worker = serviceWorkerRegistration?.waiting;
    if (worker) {
      worker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdateToast(false);
    }
  };

  // Effect to check if alerts banner was dismissed in the current session
  useEffect(() => {
    const isDismissed = sessionStorage.getItem('alertsDismissed');
    if (isDismissed === 'true') {
      setIsAlertsBannerVisible(false);
    }
  }, []);
  
  // Effect to fetch initial location for alerts banner on login
  useEffect(() => {
    if (isAuthenticated && !location && !locationError) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLocationError(null);
            },
            (error) => {
                console.warn("Could not get initial location for alerts:", error.message);
                // We don't set a user-facing error here, as it's a non-critical background fetch.
                // The app will fall back to using the institution's address for alerts.
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 } // Low accuracy, 10-min cache
        );
    }
  }, [isAuthenticated, location, locationError]);

  // Effect to set initial theme from localStorage, defaulting to light mode
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }
    // By removing the 'else if' for prefers-color-scheme, the app will now
    // default to the initial 'light' state if no theme is stored.
  }, []);

  // Effect to apply theme class to <html> and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Effect to manage avatar messages
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      return;
    }
    
    // Set avatar messages based on the current view
    const timer = setTimeout(() => {
      if (currentPage === 'progress') {
        if (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.GOVERNMENT_OFFICIAL) {
          setAvatarMood('neutral');
          setAvatarMessage(translate('Here you can monitor and manage classroom progress and analytics.'));
        } else {
          setAvatarMood('encouraging');
          setAvatarMessage(translate(`Here's your progress, **${currentUser.name}**. Keep up the great work!`));
        }
      } else if (currentPage === 'lab') {
        switch (labView) {
            case 'lab_dashboard':
                setAvatarMood('happy');
                setAvatarMessage(translate(`Welcome to the Simulation Lab, **${currentUser.name}**! Test your skills.`));
                break;
            case 'simulation':
                setAvatarMood('thinking');
                setAvatarMessage(translate('This is a test of your knowledge. Read the scenario carefully and respond.'));
                break;
            case 'final_certificate':
                setAvatarMood('happy');
                setAvatarMessage(translate(`Congratulations, **${currentUser.name}**! You've mastered all simulations and are officially Disaster Ready!`));
                break;
            case 'solutions':
                setAvatarMood('neutral');
                setAvatarMessage(translate('Here are the answer keys and model responses for teachers.'))
                break;
            default:
                setAvatarMessage('');
        }
      } else if (currentPage === 'distress') {
        setAvatarMood('encouraging');
        setAvatarMessage(translate(`Stay calm, **${currentUser.name}**. Fill out this form accurately to get help quickly.`));
      } else if (currentPage === 'meteo') {
        setAvatarMood('neutral');
        setAvatarMessage(translate('Here you can see live weather patterns. This is crucial for tracking large-scale events like cyclones.'));
      } else if (currentPage === 'tectonic') {
        setAvatarMood('neutral');
        setAvatarMessage(translate('This map shows tectonic plate boundaries and recent seismic activity.'));
      } else if (currentPage === 'news') {
        setAvatarMood('neutral');
        setAvatarMessage(translate('Stay informed with the latest global disaster and weather news.'));
      } else if (currentPage === 'exit_planner') {
        setAvatarMood('neutral');
        setAvatarMessage(translate('Upload a floorplan to begin planning your emergency exit route.'));
      } else if (currentPage === 'notebook') {
        setAvatarMood('neutral');
        setAvatarMessage(translate('Welcome to your AI Notebook! Organize your thoughts, manage tasks, and let me help you with summaries or ideas.'));
      } else {
         switch (dashboardView) {
            case 'dashboard':
              setAvatarMood('happy');
              setAvatarMessage(translate(`Welcome back, **${currentUser.name}**! Select a module to get started.`));
              break;
            case 'module':
              setAvatarMood('neutral');
              setAvatarMessage(translate('This is great information! Take your time to read through it carefully.'));
              break;
            case 'quiz':
              setAvatarMood('encouraging');
              setAvatarMessage(translate("Let's test your knowledge! You can do it!"));
              break;
            case 'profile':
              setAvatarMood('neutral');
              setAvatarMessage(translate('Here you can view and edit your profile information.'));
              break;
            case 'result':
              break;
            default:
              setAvatarMessage('');
          }
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [dashboardView, labView, currentPage, isAuthenticated, currentUser, translate]);
  
  useEffect(() => {
    if (isAuthenticated) {
      setIsAvatarVisible(true);
    }
  }, [dashboardView, labView, currentPage, isAuthenticated]);


  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setStudentProgress(undefined);
    setSelectedModule(null);
    setSelectedQuiz(null);
    setLastQuizResult(null);
    setCurrentPage('dashboard');
    setDashboardView('dashboard');
    sessionStorage.clear(); // Clear all session data on logout
  }, []);


  const handleSelectModule = useCallback((module: LearningModule) => {
    setSelectedModule(module);
    setDashboardView('module');
  }, []);

  const handleStartQuiz = useCallback((moduleId: string) => {
    const module = MODULES.find(m => m.id === moduleId);
    if (module) {
      const quiz = QUIZZES.find(q => q.id === module.quizId);
      if (quiz) {
        setSelectedModule(module);
        setSelectedQuiz(quiz);
        setDashboardView('quiz');
      }
    }
  }, []);
  
  const handleStartSimulation = useCallback((module: LearningModule) => {
      setSelectedModule(module);
      setLabView('simulation');
  }, []);

  const handleSimulationComplete = useCallback((module: LearningModule, score: LabScore) => {
      if (currentUser) {
        const updateUserProgress = (prev: StudentProgress | undefined): StudentProgress => {
            const newProgress = prev || { quizScores: {}, labScores: {}, timeSpent: 0 };
            return {
                ...newProgress,
                labScores: {
                    ...newProgress.labScores,
                    [module.id]: score
                }
            };
        };
        setAllProgressData(prev => ({
            ...prev,
            [currentUser.id]: updateUserProgress(prev[currentUser.id])
        }));
        setStudentProgress(updateUserProgress);
      }
      setLabView('lab_dashboard');
  }, [currentUser]);

  const handleQuizComplete = useCallback((score: number, totalQuestions: number) => {
    if (selectedQuiz && currentUser) {
      const result = { quizId: selectedQuiz.id, score, totalQuestions };
      setLastQuizResult(result);
      
      const updateUserProgress = (prev: StudentProgress | undefined): StudentProgress => {
            const newProgress = prev || { quizScores: {}, labScores: {}, timeSpent: 0 };
            return {
                ...newProgress,
                quizScores: {
                    ...newProgress.quizScores,
                    [selectedQuiz.id]: result
                }
            };
        };
       
       setAllProgressData(prev => ({
            ...prev,
            [currentUser.id]: updateUserProgress(prev[currentUser.id])
       }));
       setStudentProgress(updateUserProgress);
      
      const percentage = Math.round((score / totalQuestions) * 100);
      if (percentage >= 80) {
        setAvatarMood('happy');
        setAvatarMessage(translate("Amazing work! You're a true safety champion!"));
      } else {
        setAvatarMood('encouraging');
        setAvatarMessage(translate("Good try! Review the module and try again. You'll get it!"));
      }

      setDashboardView('result');
    }
  }, [selectedQuiz, translate, currentUser]);

  const handleReturnToDashboard = useCallback(() => {
    setSelectedModule(null);
    setSelectedQuiz(null);
    setLastQuizResult(null);
    setCurrentPage('dashboard');
    setDashboardView('dashboard');
  }, []);
  
  const handleBackToModule = useCallback(() => {
    setDashboardView('module');
  }, []);

  const handleShowProfile = useCallback(() => {
    setPreProfileLocation({
      page: currentPage,
      view: currentPage === 'lab' ? labView : (currentPage === 'dashboard' ? dashboardView : null),
    });
    setCurrentPage('dashboard');
    setDashboardView('profile');
  }, [currentPage, labView, dashboardView]);
  
  const handleReturnFromProfile = useCallback(() => {
    if (preProfileLocation) {
        setCurrentPage(preProfileLocation.page);
        if (preProfileLocation.page === 'lab' && preProfileLocation.view) {
            setLabView(preProfileLocation.view as LabView);
        } else if (preProfileLocation.page === 'dashboard' && preProfileLocation.view) {
            setDashboardView(preProfileLocation.view as DashboardView);
        }
        setPreProfileLocation(null);
    } else {
        handleReturnToDashboard();
    }
  }, [preProfileLocation, handleReturnToDashboard]);


  const handleBackToLabDashboard = useCallback(() => {
    setSelectedModule(null);
    setLabView('lab_dashboard');
  }, []);
  
  const handleShowSolutions = useCallback(() => {
    if (currentUser?.role === UserRole.TEACHER || currentUser?.role === UserRole.GOVERNMENT_OFFICIAL) {
      setCurrentPage('lab');
      setLabView('solutions');
    }
  }, [currentUser]);
  
  const handleViewFinalCertificate = useCallback(() => {
    const passedLabsCount = Object.values(labScores).filter(score => score.score >= 75).length;
    const totalLabs = MODULES.length;
    
    if (passedLabsCount === totalLabs && totalLabs > 0) {
      setLabView('final_certificate');
    } else {
      console.warn('Attempted to view final certificate without completing all labs.');
      setLabView('lab_dashboard');
    }
  }, [labScores]);

  const handleSaveProfile = useCallback(async (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setAllUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (updatedUser.avatarStyle) {
        localStorage.setItem(`avatarStyle-${updatedUser.id}`, updatedUser.avatarStyle);
        setAvatarStyle(updatedUser.avatarStyle);
    }
  }, []);
  
  const handleOpenPanicModal = useCallback(() => {
    setIsPanicModalOpen(true);
    setLocation(null);
    setLocationError(translate('Fetching location...'));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error: GeolocationPositionError) => {
        console.error("Geolocation error:", error.message);
        let message = translate("Could not get your location. Please enable location services.");
        if (error.code === 1) message = translate("Location access denied. To find nearby hospitals, please enable location permissions for this site in your browser settings.");
        if (error.code === 2) message = translate("Your location information is currently unavailable. Please check your connection or try again later.");
        if (error.code === 3) message = translate("Failed to get your location in time. Please try again.");
        setLocationError(message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [translate]);

  const handleClosePanicModal = useCallback(() => setIsPanicModalOpen(false), []);
  const handleDialEmergency = useCallback(() => window.location.href = 'tel:112', []);
  const handleDialAmbulance = useCallback(() => window.location.href = 'tel:108', []);
  const handleFindHospital = useCallback(() => {
    if (location) window.open(`https://www.google.com/maps/search/hospitals/@${location.latitude},${location.longitude},15z`, '_blank');
  }, [location]);

  const handleOpenDistressForm = useCallback(() => {
    setIsPanicModalOpen(false);
    setCurrentPage('distress');
  }, []);

  const handleFooterDashboardClick = useCallback(() => {
    setCurrentPage('dashboard');
    setDashboardView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleFooterLabClick = useCallback(() => {
    setCurrentPage('lab');
    setLabView('lab_dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  const handleOpenChatbot = useCallback(() => setIsChatbotOpen(true), []);
  const handleCloseChatbot = useCallback(() => setIsChatbotOpen(false), []);

  const handleAddStudent = useCallback((studentData: any) => {
    if (!currentUser) return;
    const newStudent: User = {
        id: `user-${Date.now()}`,
        name: studentData.name,
        password: studentData.password,
        role: UserRole.STUDENT,
        institutionName: currentUser.institutionName, // Inherit from teacher
        class: studentData.class,
        avatarUrl: `https://picsum.photos/seed/${studentData.name}/100/100`,
        rollNumber: studentData.rollNumber,
        avatarStyle: 'default',
    };
    setAllUsers(prev => [...prev, newStudent]);
  }, [currentUser]);

  const handleUpdateStudent = useCallback((updatedStudent: User) => {
    setAllUsers(prev => prev.map(u => u.id === updatedStudent.id ? updatedStudent : u));
  }, []);

  const handleDeleteStudent = (studentId: string) => {
    const isOfficial = currentUser?.role === UserRole.GOVERNMENT_OFFICIAL;
    const confirmMessage = isOfficial
        ? translate('Are you sure you want to delete this employee? This action cannot be undone.')
        : translate('Are you sure you want to delete this student? This action cannot be undone.');

    if (window.confirm(confirmMessage)) {
        setAllUsers(prev => prev.filter(u => u.id !== studentId));
        setAllProgressData(prev => {
            const newState = { ...prev };
            delete newState[studentId];
            return newState;
        });
    }
  };

  // --- Resource Management Handlers ---
  const handleAddResource = useCallback((resourceData: Omit<Resource, 'id' | 'lastUpdated'>) => {
    const newResource: Resource = {
        id: `res-${Date.now()}`,
        ...resourceData,
        lastUpdated: new Date().toISOString(),
    };
    setResources(prev => [...prev, newResource]);
  }, []);
  
  const handleUpdateResource = useCallback((updatedResourceData: Omit<Resource, 'lastUpdated'>) => {
    setResources(prev => prev.map(r => r.id === updatedResourceData.id ? { ...updatedResourceData, lastUpdated: new Date().toISOString() } : r));
  }, []);
  
  const handleDeleteResource = (resourceId: string) => {
    if (window.confirm(translate('Are you sure you want to delete this resource? This action cannot be undone.'))) {
        setResources(prev => prev.filter(r => r.id !== resourceId));
    }
  };
  
  // --- Historical Disaster Management Handlers ---
  const handleAddDisaster = useCallback((disasterData: Omit<HistoricalDisaster, 'id'>) => {
    const newDisaster: HistoricalDisaster = {
        id: `dis-${Date.now()}`,
        ...disasterData,
    };
    setHistoricalDisasters(prev => [...prev, newDisaster]);
  }, []);

  const handleUpdateDisaster = useCallback((updatedDisaster: HistoricalDisaster) => {
    setHistoricalDisasters(prev => prev.map(d => d.id === updatedDisaster.id ? updatedDisaster : d));
  }, []);

  const handleDeleteDisaster = (disasterId: string) => {
    if (window.confirm(translate('Are you sure you want to delete this historical event? This action cannot be undone.'))) {
        setHistoricalDisasters(prev => prev.filter(d => d.id !== disasterId));
    }
  };

  // --- Floor Plan Handlers ---
    const handleAddFloorplan = useCallback((plan: Omit<StoredFloorplan, 'id' | 'ownerId'>) => {
        if (!currentUser) return;
        if (plan.isGlobal && currentUser.role !== UserRole.GOVERNMENT_OFFICIAL) {
            console.error("Permission denied: Only officials can add global plans.");
            return;
        }

        const newPlan: StoredFloorplan = {
            ...plan,
            id: `plan-${Date.now()}`,
            ownerId: plan.isGlobal ? undefined : currentUser.id,
        };
        setStoredFloorplans(prev => [...prev, newPlan]);
    }, [currentUser]);

    const handleUpdateFloorplan = useCallback((planId: string, updatedData: Partial<Omit<StoredFloorplan, 'id'>>) => {
        setStoredFloorplans(prev => prev.map(p => {
            if (p.id === planId) {
                if (p.isGlobal && currentUser?.role !== UserRole.GOVERNMENT_OFFICIAL) return p;
                if (!p.isGlobal && p.ownerId !== currentUser?.id) return p;
                return { ...p, ...updatedData };
            }
            return p;
        }));
    }, [currentUser]);

    const handleDeleteFloorplan = useCallback((planId: string) => {
        const planToDelete = storedFloorplans.find(p => p.id === planId);
        if (!planToDelete || !currentUser) return;
        
        if (planToDelete.isGlobal && currentUser.role !== UserRole.GOVERNMENT_OFFICIAL) return;
        if (!planToDelete.isGlobal && planToDelete.ownerId !== currentUser.id) return;
        
        if (window.confirm(translate('Are you sure you want to delete this floor plan?'))) {
             setStoredFloorplans(prev => prev.filter(p => p.id !== planId));
        }
    }, [currentUser, storedFloorplans, translate]);
    
    // --- AI Note Handlers ---
    const handleAddNote = useCallback((noteData: Omit<AINote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!currentUser) return;
        const newNote: AINote = {
            ...noteData,
            id: `note-${Date.now()}`,
            userId: currentUser.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setAiNotes(prev => [...prev, newNote].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    }, [currentUser]);

    const handleUpdateNote = useCallback((updatedNote: AINote) => {
        if (!currentUser) return;
        setAiNotes(prev => prev.map(n => n.id === updatedNote.id ? { ...updatedNote, updatedAt: new Date().toISOString() } : n).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    }, [currentUser]);

    const handleDeleteNote = useCallback((noteId: string) => {
        if (!currentUser) return;
        if (window.confirm(translate('Are you sure you want to delete this note?'))) {
            setAiNotes(prev => prev.filter(n => n.id !== noteId));
        }
    }, [currentUser, translate]);


  const handleCloseAlertsBanner = () => {
    setIsAlertsBannerVisible(false);
    sessionStorage.setItem('alertsDismissed', 'true');
  };

  const profileBackText = preProfileLocation?.page === 'lab' ? translate('Back to Lab') 
    : preProfileLocation?.page === 'progress' ? translate('Back to Progress Tracker')
    : preProfileLocation?.page === 'meteo' ? translate('Back to Meteorology')
    : preProfileLocation?.page === 'tectonic' ? translate('Back to Tectonic Map')
    : preProfileLocation?.page === 'news' ? translate('Back to News Portal')
    : preProfileLocation?.page === 'exit_planner' ? translate('Back to Exit Planner')
    : preProfileLocation?.page === 'notebook' ? translate('Back to AI Notebook')
    : translate('Back to Dashboard');

  const renderContent = () => {
    switch (currentPage) {
        case 'dashboard':
            switch (dashboardView) {
                case 'module':
                    return selectedModule && <ModuleViewer module={selectedModule} onStartQuiz={handleStartQuiz} onBack={handleReturnToDashboard} />;
                case 'quiz':
                    return selectedQuiz && selectedModule && <QuizView quiz={selectedQuiz} moduleTitle={selectedModule.title} onComplete={handleQuizComplete} onBack={handleBackToModule} />;
                case 'result':
                    return lastQuizResult && selectedQuiz && selectedModule && <QuizResult result={lastQuizResult} moduleTitle={selectedModule.title} onRetake={() => handleStartQuiz(selectedModule.id)} onBackToModule={handleBackToModule} onBackToDashboard={handleReturnToDashboard} />;
                case 'profile':
                    return currentUser && <Profile user={currentUser} onBack={handleReturnFromProfile} onSave={handleSaveProfile} backButtonText={profileBackText} />;
                default:
                    const modulesWithProgress = MODULES.map(m => ({
                        ...m,
                        progress: studentProgress?.quizScores[m.quizId] ? 100 : 0
                    }));
                    return <Dashboard 
                                user={currentUser} 
                                theme={theme}
                                modules={modulesWithProgress} 
                                onSelectModule={handleSelectModule} 
                                onStartQuiz={handleStartQuiz} 
                                quizScores={quizScores}
                                resources={resources}
                                historicalDisasters={historicalDisasters}
                                onAddResource={handleAddResource}
                                onUpdateResource={handleUpdateResource}
                                onDeleteResource={handleDeleteResource}
                                onAddDisaster={handleAddDisaster}
                                onUpdateDisaster={handleUpdateDisaster}
                                onDeleteDisaster={handleDeleteDisaster}
                            />;
            }
        case 'lab':
            switch(labView) {
                case 'simulation':
                    return selectedModule && <Simulation module={selectedModule} onComplete={(score) => handleSimulationComplete(selectedModule, score)} onBack={handleBackToLabDashboard} />;
                case 'final_certificate':
                    return currentUser && <Certificate user={currentUser} onBack={handleBackToLabDashboard} />;
                case 'solutions':
                     return <SolutionsView modules={MODULES} quizzes={QUIZZES} allProgressData={allProgressData} onBack={handleBackToLabDashboard} />;
                default:
                    return currentUser && <LabDashboard user={currentUser} modules={MODULES} labScores={labScores} onStartSimulation={handleStartSimulation} onViewFinalCertificate={handleViewFinalCertificate} />;
            }
        case 'distress':
            return currentUser && <DistressForm user={currentUser} onBack={handleReturnToDashboard} />;
        case 'progress':
            let studentsForTracker: User[] = [];
            if (currentUser?.role === UserRole.TEACHER) {
                studentsForTracker = allUsers.filter(u => u.role === UserRole.STUDENT && u.institutionName === currentUser.institutionName);
            } else if (currentUser?.role === UserRole.GOVERNMENT_OFFICIAL) {
                studentsForTracker = allUsers.filter(u => u.role === UserRole.STUDENT);
            }
            return currentUser && <ProgressTracker 
                                    user={currentUser} 
                                    modules={MODULES} 
                                    studentData={studentsForTracker} 
                                    progressData={allProgressData}
                                    onAddStudent={handleAddStudent}
                                    onUpdateStudent={handleUpdateStudent}
                                    onDeleteStudent={handleDeleteStudent}
                                  />;
        case 'meteo':
            return currentUser && <WindyMap user={currentUser} theme={theme} />;
        case 'tectonic':
            return currentUser && <TectonicMap user={currentUser} />;
        case 'news':
            return currentUser && <News currentUser={currentUser} />;
        case 'exit_planner':
             return currentUser && <ExitPlanner 
                currentUser={currentUser}
                storedFloorplans={storedFloorplans}
                onAddFloorplan={handleAddFloorplan}
                onUpdateFloorplan={handleUpdateFloorplan}
                onDeleteFloorplan={handleDeleteFloorplan}
            />;
        case 'notebook':
            return currentUser && <AINotebook 
                notes={aiNotes.filter(n => n.userId === currentUser.id)}
                onAddNote={handleAddNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
            />;
        default:
            return null;
    }
  }

  const alertLocation = (
    currentUser?.homeAddress || 
    (location ? `${location.latitude},${location.longitude}` : null) || 
    currentUser?.institutionAddress ||
    currentUser?.institutionName
  ) || 'India';

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${theme}`}>
      <div className="flex flex-1">
        <Sidebar 
          currentPage={currentPage}
          setCurrentPage={isAuthenticated ? setCurrentPage : () => {}}
          isOpen={isSidebarOpen}
          setIsOpen={isAuthenticated ? setIsSidebarOpen : () => {}}
          user={currentUser}
          labView={labView}
          onShowSolutions={isAuthenticated ? handleShowSolutions : () => {}}
        />

        <div className="flex-1 flex flex-col lg:ml-64">
           {isAuthenticated && currentUser ? (
              <>
               <Header
                  user={currentUser}
                  // Fix: Pass the required 'institution' prop, constructed from the currentUser object.
                  institution={{
                    id: `inst-${currentUser.id}`,
                    name: currentUser.institutionName,
                    address: currentUser.institutionAddress || '',
                    phoneNumber: currentUser.institutionPhone || '',
                  }}
                  onProfileClick={handleShowProfile}
                  onLogout={handleLogout}
                  theme={theme}
                  toggleTheme={toggleTheme}
                  onMenuClick={() => setIsSidebarOpen(prev => !prev)}
                  showMenuButton={true}
               />
               <OfficialBanner />
              </>
           ) : (
            <div className="h-[69px] border-b border-gray-200 dark:border-gray-700 flex-shrink-0"></div>
           )}

          <main className="flex-1 p-4 md:p-6 lg:p-8 relative">
              {isAuthenticated && isAlertsBannerVisible && currentUser && (
                <div className="mb-6">
                    <AlertsBanner
                        location={alertLocation}
                        onClose={handleCloseAlertsBanner}
                    />
                </div>
              )}
              {isAuthenticated ? renderContent() : (
                <Dashboard theme={theme} user={null} modules={MODULES.map(m => ({ ...m, progress: 0 }))} onSelectModule={() => {}} onStartQuiz={() => {}} quizScores={{}} resources={[]} historicalDisasters={[]} onAddResource={()=>{}} onUpdateResource={()=>{}} onDeleteResource={()=>{}} onAddDisaster={()=>{}} onUpdateDisaster={()=>{}} onDeleteDisaster={()=>{}} />
              )}
          </main>
          <AboutUs />
          <Footer 
              onDashboardClick={isAuthenticated ? handleFooterDashboardClick : () => {}}
              onLabClick={isAuthenticated ? handleFooterLabClick : () => {}}
              onOpenPanicModal={isAuthenticated ? handleOpenPanicModal : () => {}}
          />
        </div>
      </div>

      {isAuthenticated && (
        <>
          <GuideAvatar 
            message={avatarMessage} 
            mood={avatarMood}
            isOpen={isAvatarVisible}
            onClose={() => setIsAvatarVisible(false)}
            avatarStyle={avatarStyle}
          />
          <ChatbotButton onClick={handleOpenChatbot} />
          <PanicButton onClick={handleOpenPanicModal} />
        </>
      )}

      <PanicModal
        isOpen={isPanicModalOpen}
        onClose={handleClosePanicModal}
        onDialEmergency={handleDialEmergency}
        onDialAmbulance={handleDialAmbulance}
        onFindHospital={handleFindHospital}
        onOpenDistressForm={handleOpenDistressForm}
        locationError={locationError}
        hasLocation={!!location}
      />
      <Chatbot 
        isOpen={isChatbotOpen} 
        onClose={handleCloseChatbot} 
        currentPage={currentPage} 
        avatarStyle={avatarStyle}
      />
      
      {!isAuthenticated && (
        <Auth 
          allUsers={allUsers}
          onLogin={handleLogin} 
          onSignUp={handleSignUpAndLogin}
        />
      )}

      {showOfflineToast && (
          <OfflineStatusToast type="offlineReady" onClose={() => setShowOfflineToast(false)} />
      )}
      {showUpdateToast && (
          <OfflineStatusToast type="updateAvailable" onClose={() => setShowUpdateToast(false)} onRefresh={handleUpdate} />
      )}
    </div>
  );
};

export default App;