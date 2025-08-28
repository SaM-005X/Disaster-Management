import React, { useState, useCallback, useEffect } from 'react';
import { MODULES, QUIZZES } from './constants';
import type { LearningModule, Quiz, User, QuizScore, Institution, LabScore, StudentProgress, AvatarStyle } from './types';
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
import { useTranslate } from './contexts/TranslationContext';
import OfflineStatusToast from './components/OfflineStatusToast';
import { supabase, fetchUserProfile, fetchInstitution, fetchStudentProgress, fetchStudentsForInstitution, fetchProgressForStudents, updateProfile, addStudent, updateStudent, deleteStudent } from './services/supabaseClient';
// Fix: Import the 'News' component.
import News from './components/News';


type Page = 'dashboard' | 'lab' | 'distress' | 'progress' | 'meteo' | 'news';
type DashboardView = 'dashboard' | 'module' | 'quiz' | 'result' | 'profile';
export type LabView = 'lab_dashboard' | 'simulation' | 'final_certificate' | 'solutions';
type Theme = 'light' | 'dark';
export type AvatarMood = 'neutral' | 'happy' | 'thinking' | 'encouraging';

const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentInstitution, setCurrentInstitution] = useState<Institution | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress | undefined>(undefined);

  // State for teacher's classroom view
  const [studentsInClass, setStudentsInClass] = useState<User[]>([]);
  const [studentProgressData, setStudentProgressData] = useState<Record<string, StudentProgress>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = !!currentUser && !!currentInstitution;

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

  // Panic Button State
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

  // Supabase Auth Listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        setIsLoading(true);
        if (session?.user) {
            let profile = null;
            let institution = null;
            let progress = undefined;
            let attempt = 0;
            const maxAttempts = 3;

            // Retry loop to patiently wait for the database trigger to create the profile.
            while (!profile && attempt < maxAttempts) {
                attempt++;
                console.log(`Attempting to fetch user profile, attempt #${attempt}`);
                profile = await fetchUserProfile(session.user.id);
                if (!profile && attempt < maxAttempts) {
                    // Wait with an increasing delay (1s, 2s)
                    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                }
            }

            if (profile) {
                // Profile found, load the rest of the user's data.
                institution = await fetchInstitution(profile.institutionId);
                setAvatarStyle(profile.avatarStyle || 'default');
                if (profile.role === UserRole.STUDENT) {
                    progress = await fetchStudentProgress(profile.id);
                }
                setCurrentUser(profile);
                setCurrentInstitution(institution);
                setStudentProgress(progress);
            } else {
                // After multiple tries, the profile is still missing.
                // Instead of logging out and causing a loop, we force the user into the app
                // with partial data and show an alert. This guarantees entry into the site.
                console.error("CRITICAL: User is authenticated but profile could not be found after multiple retries. This might indicate an issue with the `create_user_profile` database trigger.");
                
                const fallbackUser: User = {
                    id: session.user.id,
                    name: session.user.email || 'New User',
                    role: UserRole.STUDENT, // Safe default
                    institutionId: '', // Unknown
                    class: 'Unknown', // Unknown
                    avatarUrl: `https://picsum.photos/seed/${session.user.id}/100/100`,
                    avatarStyle: 'default',
                };
                 const fallbackInstitution: Institution = {
                    id: '',
                    name: 'Unknown Institution',
                    address: '',
                    phoneNumber: '',
                };
                
                setCurrentUser(fallbackUser);
                setCurrentInstitution(fallbackInstitution);
                setStudentProgress(undefined);
                
                // Alert the user about the situation.
                alert("Welcome! We're having trouble loading your full profile right now, but we've logged you in. Some information may be missing. Please try visiting your Profile page to update your details.");
            }

        } else {
            // No session, so clear all user-related state.
            setCurrentUser(null);
            setCurrentInstitution(null);
            setStudentProgress(undefined);
        }
        setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch classroom data if user is a teacher
  useEffect(() => {
    const fetchClassroomData = async () => {
        if (currentUser && currentUser.role === UserRole.TEACHER && currentInstitution) {
            const students = await fetchStudentsForInstitution(currentInstitution.id);
            if (students.length > 0) {
                const progress = await fetchProgressForStudents(students.map(s => s.id));
                setStudentsInClass(students);
                setStudentProgressData(progress);
            } else {
                setStudentsInClass([]);
                setStudentProgressData({});
            }
        }
    };
    fetchClassroomData();
  }, [currentUser, currentInstitution]);

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

  // Effect to set initial theme from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }
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
        if (currentUser.role === UserRole.TEACHER) {
          setAvatarMood('neutral');
          setAvatarMessage(translate('Here you can monitor and manage your classroom.'));
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
      } else if (currentPage === 'news') {
        setAvatarMood('neutral');
        setAvatarMessage(translate('Stay informed with the latest global disaster and weather news.'));
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
    if (error) console.error('Error logging out:', error);
    setSelectedModule(null);
    setSelectedQuiz(null);
    setLastQuizResult(null);
    setCurrentPage('dashboard');
    setDashboardView('dashboard');
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
        // TODO: Update lab score in Supabase
        console.log("Lab completed, score to be saved:", score);
      }
      setLabView('lab_dashboard');
  }, [currentUser]);

  const handleQuizComplete = useCallback((score: number, totalQuestions: number) => {
    if (selectedQuiz && currentUser) {
      const result = { quizId: selectedQuiz.id, score, totalQuestions };
      setLastQuizResult(result);

      // TODO: Update quiz score in Supabase
      console.log("Quiz completed, result to be saved:", result);
      
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
        // No view to restore for 'progress', 'distress', or 'meteo'
        setPreProfileLocation(null);
    } else {
        // Fallback
        handleReturnToDashboard();
    }
  }, [preProfileLocation, handleReturnToDashboard]);


  const handleBackToLabDashboard = useCallback(() => {
    setSelectedModule(null);
    setLabView('lab_dashboard');
  }, []);
  
  const handleShowSolutions = useCallback(() => {
    if (currentUser?.role === UserRole.TEACHER) {
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

  const handleSaveProfile = useCallback(async (updatedUser: User, updatedInstitution: Institution) => {
    const success = await updateProfile(updatedUser, updatedInstitution);
    if (success) {
        setCurrentUser(updatedUser);
        setCurrentInstitution(updatedInstitution);
        if (updatedUser.avatarStyle) {
            localStorage.setItem(`avatarStyle-${updatedUser.id}`, updatedUser.avatarStyle);
            setAvatarStyle(updatedUser.avatarStyle);
        }
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

  const handleAddStudent = useCallback(async (studentData: any) => {
    if (!currentInstitution) return;
    const newStudent = await addStudent(studentData, currentInstitution.id);
    if (newStudent) {
        setStudentsInClass(prev => [...prev, newStudent]);
    }
  }, [currentInstitution]);

  const handleUpdateStudent = useCallback(async (updatedStudent: User) => {
    const success = await updateStudent(updatedStudent);
    if (success) {
      setStudentsInClass(prev => prev.map(u => u.id === updatedStudent.id ? updatedStudent : u));
    }
  }, []);

  const handleDeleteStudent = useCallback(async (studentId: string) => {
    const success = await deleteStudent(studentId);
    if (success) {
      setStudentsInClass(prev => prev.filter(u => u.id !== studentId));
      setStudentProgressData(prev => {
          const newState = { ...prev };
          delete newState[studentId];
          return newState;
      });
    }
  }, []);

  const handleCloseAlertsBanner = () => {
    setIsAlertsBannerVisible(false);
    sessionStorage.setItem('alertsDismissed', 'true');
  };

  const profileBackText = preProfileLocation?.page === 'lab' ? translate('Back to Lab') 
    : preProfileLocation?.page === 'progress' ? translate('Back to Progress Tracker')
    : preProfileLocation?.page === 'meteo' ? translate('Back to Meteorology')
    : preProfileLocation?.page === 'news' ? translate('Back to News Portal')
    : translate('Back to Dashboard');

  if (isLoading) {
      return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-teal-500"></div>
          </div>
      );
  }

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
                    return currentUser && currentInstitution && <Profile user={currentUser} institution={currentInstitution} onBack={handleReturnFromProfile} onSave={handleSaveProfile} backButtonText={profileBackText} />;
                default:
                    const modulesWithProgress = MODULES.map(m => ({
                        ...m,
                        progress: studentProgress?.quizScores[m.quizId] ? 100 : 0
                    }));
                    return <Dashboard modules={modulesWithProgress} onSelectModule={handleSelectModule} onStartQuiz={handleStartQuiz} quizScores={quizScores} />;
            }
        case 'lab':
            switch(labView) {
                case 'simulation':
                    return selectedModule && <Simulation module={selectedModule} onComplete={(score) => handleSimulationComplete(selectedModule, score)} onBack={handleBackToLabDashboard} />;
                case 'final_certificate':
                    return currentUser && currentInstitution && <Certificate user={currentUser} institution={currentInstitution} onBack={handleBackToLabDashboard} />;
                case 'solutions':
                     return <SolutionsView modules={MODULES} quizzes={QUIZZES} onBack={handleBackToLabDashboard} />;
                default:
                    return currentUser && currentInstitution && <LabDashboard user={currentUser} institution={currentInstitution} modules={MODULES} labScores={labScores} onStartSimulation={handleStartSimulation} onViewFinalCertificate={handleViewFinalCertificate} />;
            }
        case 'distress':
            return currentUser && <DistressForm user={currentUser} onBack={handleReturnToDashboard} />;
        case 'progress':
            return currentUser && <ProgressTracker 
                                    user={currentUser} 
                                    modules={MODULES} 
                                    studentData={studentsInClass} 
                                    progressData={studentProgressData}
                                    onAddStudent={handleAddStudent}
                                    onUpdateStudent={handleUpdateStudent}
                                    onDeleteStudent={handleDeleteStudent}
                                  />;
        case 'meteo':
            return currentInstitution && <WindyMap institution={currentInstitution} />;
        case 'news':
            return currentUser && <News currentUser={currentUser} />;
        default:
            return null;
    }
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${theme}`}>
      {/* App Shell: Always rendered. The Auth component will overlay this with a backdrop filter. */}
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
           {isAuthenticated && currentUser && currentInstitution ? (
               <Header
                  user={currentUser}
                  institution={currentInstitution}
                  onProfileClick={handleShowProfile}
                  onLogout={handleLogout}
                  theme={theme}
                  toggleTheme={toggleTheme}
                  onMenuClick={() => setIsSidebarOpen(prev => !prev)}
                  showMenuButton={true}
               />
           ) : (
            // Placeholder for header to prevent layout shift on login/logout
            <div className="h-[69px] border-b border-gray-200 dark:border-gray-700 flex-shrink-0"></div>
           )}

          <main className="flex-1 p-4 md:p-6 lg:p-8 relative">
              {isAuthenticated && isAlertsBannerVisible && currentInstitution && (
                <div className="mb-6">
                    <AlertsBanner
                        location={currentInstitution.address.split(',')[1]?.trim() ?? currentInstitution.address}
                        onClose={handleCloseAlertsBanner}
                    />
                </div>
              )}
              {isAuthenticated ? renderContent() : (
                // Show a non-interactive dashboard as the background for the login screen
                <Dashboard modules={MODULES.map(m => ({ ...m, progress: 0 }))} onSelectModule={() => {}} onStartQuiz={() => {}} quizScores={{}} />
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

      {/* --- Overlays --- */}

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

      {/* These modals can be opened by various actions, so they live here */}
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
      
      {/* Auth Modal Overlay: Renders on top of the app shell when not authenticated */}
      {!isAuthenticated && (
        <Auth />
      )}

      {/* Offline/Update Toasts */}
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