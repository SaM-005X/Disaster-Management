import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MODULES as INITIAL_MODULES, QUIZZES as INITIAL_QUIZZES } from './constants';
import type { LearningModule, Quiz, User, QuizScore, LabScore, StudentProgress, AvatarStyle, Institution, Resource, HistoricalDisaster, ResourceType, ResourceStatus, StoredFloorplan, AINote, ModelSimulationGuide, NewsArticle, ChatRoom, ChatMessage, ChatInvitation, GlobalNotice } from './types';
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
import { fetchNews } from './services/newsService';
import ExitPlanner from './components/ExitPlanner';
import AINotebook from './components/AINotebook';
import { supabase } from './services/supabaseClient';
import ModuleEditModal from './components/ModuleEditModal';
import QuizEditModal from './components/QuizEditModal';
import SimulationGuideEditModal from './components/SimulationGuideEditModal';
import ChatPage from './components/ChatPage';
import IoTAlertDashboard from './components/IoTAlertDashboard';
import GlobalAlertBanner from './components/GlobalAlertBanner';
import { ShieldCheckIcon } from './components/icons/ShieldCheckIcon';

type Page = 'dashboard' | 'lab' | 'distress' | 'progress' | 'meteo' | 'news' | 'tectonic' | 'exit_planner' | 'notebook' | 'chat' | 'iot';
type DashboardView = 'dashboard' | 'module' | 'quiz' | 'result' | 'profile';
export type LabView = 'lab_dashboard' | 'simulation' | 'final_certificate' | 'solutions';
export type Theme = 'light' | 'dark';
export type AvatarMood = 'neutral' | 'happy' | 'thinking' | 'encouraging';
export type AlertType = 'fire' | 'seismic';

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
        <div className="bg-gradient-to-r from-orange-400 via-white to-green-500 dark:from-orange-500 dark:via-gray-100 dark:to-green-600 py-2 text-center shadow-md">
            <p className="font-extrabold tracking-wide text-sm sm:text-base text-gray-800 dark:text-black">
                {translate('Sikshit Bharat, Surakshit Bharat')}
            </p>
        </div>
    );
};

const FullScreenLoader: React.FC = () => {
    const { translate } = useTranslate();
    return (
        <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center z-[100]">
            <ShieldCheckIcon className="h-20 w-20 text-teal-500 animate-pulse" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mt-4">{translate('Surksha')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{translate('Loading essential data, please wait...')}</p>
        </div>
    );
};


const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allProgressData, setAllProgressData] = useState<Record<string, StudentProgress>>({});
  const [certificationStatus, setCertificationStatus] = useState<Record<string, boolean>>({});

  // Content Management State
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [simulationGuides, setSimulationGuides] = useState<Record<string, ModelSimulationGuide>>({});
  const [isModuleEditorOpen, setIsModuleEditorOpen] = useState(false);
  const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);
  const [isGuideEditorOpen, setIsGuideEditorOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<LearningModule | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<{ quiz: Quiz | null, forModule: LearningModule }>({ quiz: null, forModule: null! });
  const [editingGuide, setEditingGuide] = useState<{ guide: ModelSimulationGuide | null, forModule: LearningModule }>({ guide: null, forModule: null! });

  
  // Government Official Widgets State
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [historicalDisasters, setHistoricalDisasters] = useState<HistoricalDisaster[]>([]);
  const [storedFloorplans, setStoredFloorplans] = useState<StoredFloorplan[]>([]);
  const [aiNotes, setAiNotes] = useState<AINote[]>([]);
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([]);
  const [previousNews, setPreviousNews] = useState<NewsArticle[]>([]);
    
  // Chat State
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInvitations, setChatInvitations] = useState<ChatInvitation[]>([]);
  const [globalNotices, setGlobalNotices] = useState<GlobalNotice[]>([]);

  // IoT Alert State
  const [activeAlert, setActiveAlert] = useState<AlertType | null>(null);
  const beepIntervalRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

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
  const studentProgress = currentUser ? allProgressData[currentUser.id] : undefined;
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Hooks
  const { translate } = useTranslate();
  
  // Network Status Listener
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            const pendingCallJSON = localStorage.getItem('pendingDistressCall');
            if (pendingCallJSON) {
                console.log("Connection restored. Sending pending distress call:", JSON.parse(pendingCallJSON));
                // In a real app, you would actually send the data to the server here.
                localStorage.removeItem('pendingDistressCall');
                alert(translate('Your saved distress call has been sent now that you are back online.'));
            }
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [translate]);

  // Supabase Realtime Listener for IoT Alerts
  useEffect(() => {
    const channel = supabase
      .channel('alerts')
      .on('broadcast', { event: 'new-alert' }, ({ payload }) => {
        console.log('Received alert from IoT device:', payload);
        if (payload && (payload.type === 'fire' || payload.type === 'seismic')) {
          setActiveAlert(payload.type);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Runs only once

  // Audible Alert Effect
  useEffect(() => {
    if (activeAlert) {
      // Start beeping
      if (!audioCtxRef.current) {
        try {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          console.error("Web Audio API is not supported in this browser.", e);
          return;
        }
      }

      const playBeep = () => {
        if (!audioCtxRef.current) return;
        const oscillator = audioCtxRef.current.createOscillator();
        const gainNode = audioCtxRef.current.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1000, audioCtxRef.current.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioCtxRef.current.currentTime);
        
        oscillator.start(audioCtxRef.current.currentTime);
        oscillator.stop(audioCtxRef.current.currentTime + 0.1);
      };

      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
      }
      playBeep(); // Play immediately once
      beepIntervalRef.current = window.setInterval(playBeep, 1000);

    } else {
      // Stop beeping
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
    }

    // Cleanup for this effect
    return () => {
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
      }
    };
  }, [activeAlert]);


  // Supabase Auth Listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
            const { user } = session;

            const userProfile: User = {
                id: user.id,
                name: user.user_metadata.fullName,
                email: user.email,
                role: user.user_metadata.role,
                institutionName: user.user_metadata.institutionName,
                class: user.user_metadata.class,
                avatarUrl: user.user_metadata.avatar_url || `https://picsum.photos/seed/${user.user_metadata.fullName}/100/100`,
                avatarStyle: 'default',
                homeAddress: '',
                institutionAddress: '',
                institutionPhone: '',
            };

            setCurrentUser(userProfile);
            setAvatarStyle(userProfile.avatarStyle || 'default');

            // Use functional updates to prevent stale state in closure
            setAllUsers(currentUsers => {
                const userExists = currentUsers.some(u => u.id === userProfile.id);
                if (!userExists) {
                    setAllProgressData(prev => ({
                        ...prev,
                        [userProfile.id]: { quizScores: {}, labScores: {}, timeSpent: 0 }
                    }));
                    setChatRooms(prevRooms => prevRooms.map(room => {
                        if (room.id === 'global-chat') {
                            return { ...room, memberIds: [...room.memberIds, userProfile.id] };
                        }
                        return room;
                    }));
                    return [...currentUsers, userProfile];
                }
                return currentUsers;
            });
        } else {
            setCurrentUser(null);
            setSelectedModule(null);
            setSelectedQuiz(null);
            setLastQuizResult(null);
            setCurrentPage('dashboard');
            setDashboardView('dashboard');
            sessionStorage.removeItem('lastQuizResult');
        }
    });

    return () => subscription.unsubscribe();
  }, []); // Empty dependency array is correct to set up the listener only once.
  
  // Automatic Time Tracking for Student/User Progress
  useEffect(() => {
    let interval: number | undefined;

    const shouldTrackTime = currentUser && 
                            (currentUser.role === UserRole.STUDENT || currentUser.role === UserRole.USER) &&
                            ((currentPage === 'dashboard' && (dashboardView === 'module' || dashboardView === 'quiz')) ||
                             (currentPage === 'lab' && labView === 'simulation'));

    if (shouldTrackTime) {
      interval = window.setInterval(() => {
        setAllProgressData(prev => {
            if (!currentUser) return prev;
            const currentProgress = prev[currentUser.id] || { quizScores: {}, labScores: {}, timeSpent: 0 };
            const newTimeSpent = currentProgress.timeSpent + (1 / 3600); // Add 1 second in hours
            return {
                ...prev,
                [currentUser.id]: {
                    ...currentProgress,
                    timeSpent: newTimeSpent
                }
            };
        });
      }, 1000); // Update every second
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentUser, currentPage, dashboardView, labView]);

  // --- STATE PERSISTENCE & INITIALIZATION ---
  // Load state from storage on initial mount
  useEffect(() => {
    const loadInitialData = async () => {
        try {
            // Content Management Data from localStorage
            const storedModulesJSON = localStorage.getItem('learningModules');
            setModules(storedModulesJSON ? JSON.parse(storedModulesJSON) : INITIAL_MODULES);

            const storedQuizzesJSON = localStorage.getItem('learningQuizzes');
            setQuizzes(storedQuizzesJSON ? JSON.parse(storedQuizzesJSON) : INITIAL_QUIZZES);

            const storedGuidesJSON = localStorage.getItem('simulationGuides');
            setSimulationGuides(storedGuidesJSON ? JSON.parse(storedGuidesJSON) : {});

            const storedLatestNews = localStorage.getItem('latestNews');
            const storedPreviousNews = localStorage.getItem('previousNews');

            if (storedLatestNews && storedPreviousNews) {
                setLatestNews(JSON.parse(storedLatestNews));
                setPreviousNews(JSON.parse(storedPreviousNews));
            } else {
                // Initial data seed for news
                try {
                    const [latest, previous] = await Promise.all([
                        fetchNews('latest'),
                        fetchNews('previous')
                    ]);
                    const latestWithIds = latest.map((a, i) => ({ ...a, id: `latest-seed-${Date.now()}-${i}`, type: 'latest' as const }));
                    const previousWithIds = previous.map((a, i) => ({ ...a, id: `previous-seed-${Date.now()}-${i}`, type: 'previous' as const }));
                    setLatestNews(latestWithIds);
                    setPreviousNews(previousWithIds);
                } catch (err) {
                    console.error("Failed to seed news data:", err);
                }
            }

            // Persistent data from localStorage
            const storedUsersJSON = localStorage.getItem('allUsers');
            const storedUsers = storedUsersJSON ? JSON.parse(storedUsersJSON) : [];
            setAllUsers(storedUsers);

            // Initialize Chat Rooms
            const storedChatRoomsJSON = localStorage.getItem('chatRooms');
            let storedChatRooms = storedChatRoomsJSON ? JSON.parse(storedChatRoomsJSON) : [];
            let globalChatExists = storedChatRooms.some((room: ChatRoom) => room.id === 'global-chat');
            if (!globalChatExists) {
                const globalChat: ChatRoom = {
                    id: 'global-chat',
                    name: 'Global Chat',
                    type: 'global',
                    memberIds: storedUsers.map((u: User) => u.id),
                };
                storedChatRooms.push(globalChat);
            }
            setChatRooms(storedChatRooms);

            const storedChatMessagesJSON = localStorage.getItem('chatMessages');
            setChatMessages(storedChatMessagesJSON ? JSON.parse(storedChatMessagesJSON) : []);

            const storedChatInvitesJSON = localStorage.getItem('chatInvitations');
            setChatInvitations(storedChatInvitesJSON ? JSON.parse(storedChatInvitesJSON) : []);

            const storedNoticesJSON = localStorage.getItem('globalNotices');
            setGlobalNotices(storedNoticesJSON ? JSON.parse(storedNoticesJSON) : []);

            const storedProgressJSON = localStorage.getItem('allProgressData');
            const storedProgress = storedProgressJSON ? JSON.parse(storedProgressJSON) : {};
            setAllProgressData(storedProgress);

            const storedCertStatusJSON = localStorage.getItem('certificationStatus');
            const storedCertStatus = storedCertStatusJSON ? JSON.parse(storedCertStatusJSON) : {};
            setCertificationStatus(storedCertStatus);

            const storedPlansJSON = localStorage.getItem('storedFloorplans');
            const storedPlans = storedPlansJSON ? JSON.parse(storedPlansJSON) : [];
            setStoredFloorplans(storedPlans);

            const storedAiNotesJSON = localStorage.getItem('aiNotes');
            const storedAiNotes = storedAiNotesJSON ? JSON.parse(storedAiNotesJSON) : [];
            setAiNotes(storedAiNotes);

            // Restore non-user navigation and content state from session
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

        } catch (error) {
            console.error("Failed to load state from storage:", error);
            localStorage.clear();
            sessionStorage.clear();
        } finally {
            setIsDataLoaded(true);
        }
    };
    loadInitialData();
}, []); // Empty dependency array means this runs only once

  // Save persistent data to localStorage when it changes (consolidated for performance)
  useEffect(() => {
    if (isDataLoaded) {
      localStorage.setItem('learningModules', JSON.stringify(modules));
      localStorage.setItem('learningQuizzes', JSON.stringify(quizzes));
      localStorage.setItem('simulationGuides', JSON.stringify(simulationGuides));
      localStorage.setItem('latestNews', JSON.stringify(latestNews));
      localStorage.setItem('previousNews', JSON.stringify(previousNews));
      localStorage.setItem('allUsers', JSON.stringify(allUsers));
      localStorage.setItem('allProgressData', JSON.stringify(allProgressData));
      localStorage.setItem('certificationStatus', JSON.stringify(certificationStatus));
      localStorage.setItem('storedFloorplans', JSON.stringify(storedFloorplans));
      localStorage.setItem('aiNotes', JSON.stringify(aiNotes));
      localStorage.setItem('chatRooms', JSON.stringify(chatRooms));
      localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
      localStorage.setItem('chatInvitations', JSON.stringify(chatInvitations));
      localStorage.setItem('globalNotices', JSON.stringify(globalNotices));
    }
  }, [
      isDataLoaded, modules, quizzes, simulationGuides, latestNews, previousNews,
      allUsers, allProgressData, certificationStatus, storedFloorplans, aiNotes,
      chatRooms, chatMessages, chatInvitations, globalNotices
  ]);


  // Save session data to sessionStorage when relevant state changes
  useEffect(() => {
    try {
        sessionStorage.setItem('currentPage', JSON.stringify(currentPage));
        sessionStorage.setItem('dashboardView', JSON.stringify(dashboardView));
        sessionStorage.setItem('labView', JSON.stringify(labView));
        sessionStorage.setItem('lastQuizResult', JSON.stringify(lastQuizResult));
    } catch (error) {
        console.error("Failed to save session state:", error);
    }
  }, [currentPage, dashboardView, labView, lastQuizResult]);

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
                setAvatarMessage(translate(`Congratulations, **${currentUser.name}**! You've mastered all simulations and are officially Surksha!`));
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
      } else if (currentPage === 'chat') {
        setAvatarMood('happy');
        setAvatarMessage(translate('Connect with peers and educators. Share knowledge and stay prepared together!'));
      } else if (currentPage === 'iot') {
        setAvatarMood('neutral');
        setAvatarMessage(translate('This is the IoT Alert dashboard. You can monitor the status of your connected devices here.'));
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

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error logging out:", error);
    }
    // The onAuthStateChange listener will handle clearing state.
  }, []);


  const handleSelectModule = useCallback((module: LearningModule) => {
    setSelectedModule(module);
    setDashboardView('module');
  }, []);

  const handleStartQuiz = useCallback((moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      const quiz = quizzes.find(q => q.id === module.quizId);
      if (quiz) {
        setSelectedModule(module);
        setSelectedQuiz(quiz);
        setDashboardView('quiz');
      }
    }
  }, [modules, quizzes]);
  
  const handleStartSimulation = useCallback((module: LearningModule) => {
      setSelectedModule(module);
      setLabView('simulation');
  }, []);

  const handleSimulationComplete = useCallback((module: LearningModule, score: LabScore) => {
      if (currentUser) {
        setAllProgressData(prev => {
            const currentProgress = prev[currentUser.id] || { quizScores: {}, labScores: {}, timeSpent: 0 };
            return {
                ...prev,
                [currentUser.id]: {
                    ...currentProgress,
                    labScores: {
                        ...currentProgress.labScores,
                        [module.id]: score
                    }
                }
            };
        });
      }
      setLabView('lab_dashboard');
  }, [currentUser]);

  const handleQuizComplete = useCallback((score: number, totalQuestions: number) => {
    if (selectedQuiz && currentUser) {
      const result = { quizId: selectedQuiz.id, score, totalQuestions };
      setLastQuizResult(result);
      
       setAllProgressData(prev => {
           const currentProgress = prev[currentUser.id] || { quizScores: {}, labScores: {}, timeSpent: 0 };
           return {
               ...prev,
               [currentUser.id]: {
                   ...currentProgress,
                   quizScores: {
                       ...currentProgress.quizScores,
                       [selectedQuiz.id]: result
                   }
               }
           };
       });
      
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
    if (currentUser?.role === UserRole.TEACHER || currentUser?.role === UserRole.GOVERNMENT_OFFICIAL || currentUser?.role === UserRole.USER) {
      setCurrentPage('lab');
      setLabView('solutions');
    }
  }, [currentUser]);
  
  const handleViewFinalCertificate = useCallback(() => {
    const passedLabsCount = Object.values(labScores).filter(score => score.score >= 75).length;
    const totalLabs = modules.filter(m => m.hasLab).length;
    const overallProgress = totalLabs > 0 ? Math.round((passedLabsCount / totalLabs) * 100) : 0;
    
    if (overallProgress >= 70 && totalLabs > 0) {
      setLabView('final_certificate');
    } else {
      console.warn('Attempted to view final certificate without completing at least 70% of labs.');
      setLabView('lab_dashboard');
    }
  }, [labScores, modules]);

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

  const handleDistressSubmit = useCallback((formData: { name: string, contact: string, location: string }): boolean => {
    if (isOnline) {
        console.log('Distress call submitted online:', formData);
        // In a real app, this would send to a backend.
        return true; // Indicates immediate submission
    } else {
        console.log('Offline. Saving distress call to be sent later:', formData);
        localStorage.setItem('pendingDistressCall', JSON.stringify(formData));
        return false; // Indicates offline save
    }
  }, [isOnline]);

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
  
  const handleFooterDistressClick = useCallback(() => {
    setCurrentPage('distress');
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

  const handleToggleCertification = useCallback((studentId: string) => {
    setCertificationStatus(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  }, []);

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

  // --- News Management Handlers ---
  const handleSaveNewsArticle = useCallback((articleData: NewsArticle) => {
    if (articleData.id) { // Update existing article
        setLatestNews(prev => prev.map(a => a.id === articleData.id ? articleData : a));
        setPreviousNews(prev => prev.map(a => a.id === articleData.id ? articleData : a));
    } else { // Add new article
        const newArticle = { ...articleData, id: `user-news-${Date.now()}` };
        if (newArticle.type === 'latest') {
            setLatestNews(prev => [newArticle, ...prev]);
        } else {
            setPreviousNews(prev => [newArticle, ...prev]);
        }
    }
  }, []);

  const handleDeleteNewsArticle = useCallback((articleId: string) => {
    if (window.confirm(translate('Are you sure you want to delete this news article?'))) {
        setLatestNews(prev => prev.filter(a => a.id !== articleId));
        setPreviousNews(prev => prev.filter(a => a.id !== articleId));
    }
  }, [translate]);


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

  const handleDismissGlobalAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  // --- CMS Handlers ---
  const handleSaveModule = (moduleData: Omit<LearningModule, 'id' | 'quizId' | 'hasLab' | 'progress'> & { id?: string }) => {
    if (moduleData.id) { // Editing existing module
      setModules(prev => prev.map(m => m.id === moduleData.id ? { ...m, ...moduleData } : m));
    } else { // Creating new module
      const newModule: LearningModule = {
        ...moduleData,
        id: `mod-${Date.now()}`,
        quizId: null,
        hasLab: false,
      };
      setModules(prev => [newModule, ...prev]);
    }
    setIsModuleEditorOpen(false);
  };
  
  const handleDeleteModule = (moduleId: string) => {
    if (window.confirm(translate('Are you sure you want to delete this entire module? This action cannot be undone.'))) {
      setModules(prev => prev.filter(m => m.id !== moduleId));
      setQuizzes(prev => prev.filter(q => q.moduleId !== moduleId));
    }
  };

  const handleSaveQuiz = (quizData: Omit<Quiz, 'id' | 'moduleId'> & { id?: string }, forModuleId: string) => {
    if (quizData.id) { // Editing existing quiz
      setQuizzes(prev => prev.map(q => q.id === quizData.id ? { ...q, ...quizData } : q));
    } else { // Creating new quiz for a module
      const newQuiz: Quiz = {
        ...quizData,
        id: `quiz-${Date.now()}`,
        moduleId: forModuleId,
      };
      setQuizzes(prev => [...prev, newQuiz]);
      setModules(prev => prev.map(m => m.id === forModuleId ? { ...m, quizId: newQuiz.id, hasLab: true } : m));
    }
    setIsQuizEditorOpen(false);
  };
  
  const handleSaveSimulationGuide = (guideData: ModelSimulationGuide) => {
    setSimulationGuides(prev => ({ ...prev, [guideData.moduleId]: guideData }));
    setIsGuideEditorOpen(false);
  };
  
  const handleDisableLab = (moduleId: string) => {
    if (window.confirm(translate('Are you sure you want to disable the lab for this module? The associated quiz and guide will be removed.'))) {
      const moduleToUpdate = modules.find(m => m.id === moduleId);
      if (moduleToUpdate?.quizId) {
        setQuizzes(prev => prev.filter(q => q.id !== moduleToUpdate.quizId));
      }
      setSimulationGuides(prev => {
        const newGuides = { ...prev };
        delete newGuides[moduleId];
        return newGuides;
      });
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, quizId: null, hasLab: false } : m));
    }
  };

  const handleOpenModuleEditor = (module: LearningModule | null) => {
    setEditingModule(module);
    setIsModuleEditorOpen(true);
  };

  const handleOpenQuizEditor = (forModule: LearningModule) => {
    const quizToEdit = quizzes.find(q => q.id === forModule.quizId);
    setEditingQuiz({ quiz: quizToEdit || null, forModule });
    setIsQuizEditorOpen(true);
  };
  
  const handleOpenGuideEditor = (forModule: LearningModule) => {
    const guideToEdit = simulationGuides[forModule.id] || null;
    setEditingGuide({ guide: guideToEdit, forModule });
    setIsGuideEditorOpen(true);
  };

  // --- Chat Handlers ---
  const handleCreateChatRoom = useCallback((newRoom: Omit<ChatRoom, 'id'>) => {
    setChatRooms(prev => [...prev, { ...newRoom, id: `chat-${Date.now()}` }]);
  }, []);

  const handleSendMessage = useCallback((roomId: string, text: string) => {
      if (!currentUser) return;
      const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          chatRoomId: roomId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatarUrl: currentUser.avatarUrl,
          text,
          timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, newMessage]);
  }, [currentUser]);
  
  const handleSendInvitations = useCallback((roomId: string, roomName: string, inviteeIds: string[]) => {
      if (!currentUser) return;
      const newInvitations: ChatInvitation[] = inviteeIds.map(inviteeId => ({
          id: `invite-${Date.now()}-${inviteeId}`,
          roomId,
          roomName,
          inviterId: currentUser.id,
          inviterName: currentUser.name,
          inviteeId,
          status: 'pending',
          timestamp: new Date().toISOString(),
      }));
      setChatInvitations(prev => [...prev.filter(inv => !(inv.roomId === roomId && inviteeIds.includes(inv.inviteeId))), ...newInvitations]);
  }, [currentUser]);

  const handleAcceptInvitation = useCallback((invitationId: string) => {
      const invitation = chatInvitations.find(inv => inv.id === invitationId);
      if (!invitation || !currentUser) return;

      setChatRooms(prevRooms => prevRooms.map(room => {
          if (room.id === invitation.roomId) {
              return { ...room, memberIds: [...new Set([...room.memberIds, currentUser.id])] };
          }
          return room;
      }));

      setChatInvitations(prevInvites => prevInvites.map(inv => 
          inv.id === invitationId ? { ...inv, status: 'accepted' } : inv
      ));
  }, [chatInvitations, currentUser]);

  const handleDeclineInvitation = useCallback((invitationId: string) => {
      setChatInvitations(prevInvites => prevInvites.map(inv => 
          inv.id === invitationId ? { ...inv, status: 'declined' } : inv
      ));
  }, []);

  const handleUpdateChatRoom = useCallback((updatedRoom: ChatRoom) => {
      setChatRooms(prev => prev.map(room => room.id === updatedRoom.id ? updatedRoom : room));
  }, []);

  const handleDeleteChatRoom = useCallback((roomId: string) => {
      if (window.confirm(translate('Are you sure you want to permanently delete this chat room? This action cannot be undone.'))) {
        setChatMessages(prev => prev.filter(msg => msg.chatRoomId !== roomId));
        setChatInvitations(prev => prev.filter(inv => inv.roomId !== roomId));
        setChatRooms(prev => prev.filter(room => room.id !== roomId));
      }
  }, [translate]);

  const handlePostNotice = useCallback((text: string, imageUrl?: string) => {
      if (!currentUser || currentUser.role !== UserRole.GOVERNMENT_OFFICIAL) return;
      const newNotice: GlobalNotice = {
          id: `notice-${Date.now()}`,
          text,
          imageUrl,
          postedById: currentUser.id,
          postedByName: currentUser.name,
          timestamp: new Date().toISOString(),
      };
      setGlobalNotices(prev => [newNotice, ...prev]);
  }, [currentUser]);


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
                    return selectedModule && <ModuleViewer module={selectedModule} onStartQuiz={handleStartQuiz} onBack={handleReturnToDashboard} isOnline={isOnline} onEdit={() => handleOpenModuleEditor(selectedModule)} currentUser={currentUser} />;
                case 'quiz':
                    return selectedQuiz && selectedModule && <QuizView quiz={selectedQuiz} moduleTitle={selectedModule.title} onComplete={handleQuizComplete} onBack={handleBackToModule} />;
                case 'result':
                    return lastQuizResult && selectedQuiz && selectedModule && <QuizResult result={lastQuizResult} moduleTitle={selectedModule.title} onRetake={() => handleStartQuiz(selectedModule.id)} onBackToModule={handleBackToModule} onBackToDashboard={handleReturnToDashboard} />;
                case 'profile':
                    return currentUser && <Profile user={currentUser} onBack={handleReturnFromProfile} onSave={handleSaveProfile} backButtonText={profileBackText} />;
                default:
                    const modulesWithProgress = modules.map(m => {
                        const quizDone = studentProgress?.quizScores[m.quizId || ''];
                        const labDone = studentProgress?.labScores[m.id];
                        let progress = 0;
                        if (quizDone) progress += 50;
                        if (labDone) progress += 50;
                        return { ...m, progress };
                    });
                    return <Dashboard 
                                user={currentUser} 
                                theme={theme}
                                modules={modulesWithProgress} 
                                onSelectModule={handleSelectModule} 
                                onStartQuiz={handleStartQuiz} 
                                quizScores={quizScores}
                                labScores={labScores}
                                resources={resources}
                                historicalDisasters={historicalDisasters}
                                onAddResource={handleAddResource}
                                onUpdateResource={handleUpdateResource}
                                onDeleteResource={handleDeleteResource}
                                onAddDisaster={handleAddDisaster}
                                onUpdateDisaster={handleUpdateDisaster}
                                onDeleteDisaster={handleDeleteDisaster}
                                onAddModule={() => handleOpenModuleEditor(null)}
                                onEditModule={handleOpenModuleEditor}
                                onDeleteModule={handleDeleteModule}
                            />;
            }
        case 'lab':
            switch(labView) {
                case 'simulation':
                    return selectedModule && <Simulation module={selectedModule} onComplete={(score) => handleSimulationComplete(selectedModule, score)} onBack={handleBackToLabDashboard} />;
                case 'final_certificate':
                    return currentUser && <Certificate user={currentUser} onBack={handleBackToLabDashboard} />;
                case 'solutions':
                     return <SolutionsView 
                                currentUser={currentUser}
                                modules={modules} 
                                quizzes={quizzes} 
                                simulationGuides={simulationGuides}
                                onBack={handleBackToLabDashboard}
                                onOpenQuizEditor={handleOpenQuizEditor}
                                onOpenGuideEditor={handleOpenGuideEditor}
                                onDisableLab={handleDisableLab}
                            />;
                default:
                    return currentUser && <LabDashboard user={currentUser} modules={modules} labScores={labScores} onStartSimulation={handleStartSimulation} onViewFinalCertificate={handleViewFinalCertificate} onOpenQuizEditor={handleOpenQuizEditor} onDisableLab={handleDisableLab} />;
            }
        case 'distress':
            return currentUser && <DistressForm user={currentUser} onBack={handleReturnToDashboard} onSubmit={handleDistressSubmit} isOnline={isOnline} />;
        case 'progress':
            let studentsForTracker: User[] = [];
            if (currentUser?.role === UserRole.TEACHER) {
                studentsForTracker = allUsers.filter(u => u.role === UserRole.STUDENT && u.institutionName === currentUser.institutionName);
            } else if (currentUser?.role === UserRole.GOVERNMENT_OFFICIAL) {
                studentsForTracker = allUsers.filter(u => u.role === UserRole.STUDENT);
            }
            return currentUser && <ProgressTracker 
                                    user={currentUser} 
                                    modules={modules} 
                                    studentData={studentsForTracker} 
                                    progressData={allProgressData}
                                    onAddStudent={handleAddStudent}
                                    onUpdateStudent={handleUpdateStudent}
                                    onDeleteStudent={handleDeleteStudent}
                                    certificationStatus={certificationStatus}
                                    onToggleCertification={handleToggleCertification}
                                  />;
        case 'meteo':
            return currentUser && <WindyMap user={currentUser} theme={theme} />;
        case 'tectonic':
            return currentUser && <TectonicMap user={currentUser} />;
        case 'news':
            return currentUser && <News 
                                    currentUser={currentUser} 
                                    latestNews={latestNews}
                                    previousNews={previousNews}
                                    onSave={handleSaveNewsArticle}
                                    onDelete={handleDeleteNewsArticle}
                                />;
        case 'exit_planner':
             return currentUser && <ExitPlanner 
                currentUser={currentUser}
                storedFloorplans={storedFloorplans}
                onAddFloorplan={handleAddFloorplan}
                onUpdateFloorplan={handleUpdateFloorplan}
                onDeleteFloorplan={handleDeleteFloorplan}
                isOnline={isOnline}
            />;
        case 'notebook':
            return currentUser && <AINotebook 
                notes={aiNotes.filter(n => n.userId === currentUser.id)}
                onAddNote={handleAddNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
            />;
        case 'chat':
            return currentUser && <ChatPage 
                currentUser={currentUser}
                allUsers={allUsers}
                chatRooms={chatRooms}
                chatMessages={chatMessages}
                onCreateRoom={handleCreateChatRoom}
                onSendMessage={handleSendMessage}
                chatInvitations={chatInvitations}
                onSendInvitations={handleSendInvitations}
                onAcceptInvitation={handleAcceptInvitation}
                onDeclineInvitation={handleDeclineInvitation}
                onUpdateRoom={handleUpdateChatRoom}
                onDeleteRoom={handleDeleteChatRoom}
                globalNotices={globalNotices}
                onPostNotice={handlePostNotice}
            />;
        case 'iot':
            return <IoTAlertDashboard activeAlert={activeAlert} />;
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
  
  if (!isDataLoaded) {
    return <FullScreenLoader />;
  }

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
              {activeAlert && (
                <GlobalAlertBanner alertType={activeAlert} onDismiss={handleDismissGlobalAlert} />
              )}
              {isAuthenticated && isAlertsBannerVisible && currentUser && (
                <div className="mb-6">
                    <AlertsBanner
                        location={alertLocation}
                        onClose={handleCloseAlertsBanner}
                        isOnline={isOnline}
                    />
                </div>
              )}
              {isAuthenticated ? renderContent() : (
                <Dashboard theme={theme} user={null} modules={modules.map(m => ({ ...m, progress: 0 }))} onSelectModule={() => {}} onStartQuiz={() => {}} quizScores={{}} labScores={{}} resources={[]} historicalDisasters={[]} onAddResource={()=>{}} onUpdateResource={()=>{}} onDeleteResource={()=>{}} onAddDisaster={()=>{}} onUpdateDisaster={()=>{}} onDeleteDisaster={()=>{}} onAddModule={()=>{}} onEditModule={()=>{}} onDeleteModule={()=>{}} />
              )}
          </main>
          <AboutUs />
          <Footer 
              onDashboardClick={isAuthenticated ? handleFooterDashboardClick : () => {}}
              onLabClick={isAuthenticated ? handleFooterLabClick : () => {}}
              onDistressClick={isAuthenticated ? handleFooterDistressClick : () => {}}
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
            onClick={handleOpenChatbot}
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
        isOnline={isOnline}
      />
      <Chatbot 
        isOpen={isChatbotOpen} 
        onClose={handleCloseChatbot} 
        currentPage={currentPage} 
        avatarStyle={avatarStyle}
        currentUser={currentUser}
        isOnline={isOnline}
      />
      
      {!isAuthenticated && (
        <Auth />
      )}

      {showOfflineToast && (
          <OfflineStatusToast type="offlineReady" onClose={() => setShowOfflineToast(false)} />
      )}
      {showUpdateToast && (
          <OfflineStatusToast type="updateAvailable" onClose={() => setShowUpdateToast(false)} onRefresh={handleUpdate} />
      )}

      {isModuleEditorOpen && (
        <ModuleEditModal
            isOpen={isModuleEditorOpen}
            onClose={() => setIsModuleEditorOpen(false)}
            onSave={handleSaveModule}
            existingModule={editingModule}
        />
      )}

      {isQuizEditorOpen && (
        <QuizEditModal
            isOpen={isQuizEditorOpen}
            onClose={() => setIsQuizEditorOpen(false)}
            onSave={(quiz) => handleSaveQuiz(quiz, editingQuiz.forModule.id)}
            existingQuiz={editingQuiz.quiz}
            forModule={editingQuiz.forModule}
        />
      )}
      
      {isGuideEditorOpen && (
        <SimulationGuideEditModal
            isOpen={isGuideEditorOpen}
            onClose={() => setIsGuideEditorOpen(false)}
            onSave={handleSaveSimulationGuide}
            existingGuide={editingGuide.guide}
            forModule={editingGuide.forModule}
        />
      )}
    </div>
  );
};

export default App;
