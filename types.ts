

export type AlertSeverity = 'Warning' | 'Watch' | 'Advisory';

export interface Alert {
  severity: AlertSeverity;
  title: string;
  details: string;
}

export enum UserRole {
  STUDENT = 'Student',
  TEACHER = 'Teacher',
  ADMIN = 'Admin',
  PARENT = 'Parent',
  SUPER_ADMIN = 'Super Admin',
}

export enum HazardType {
  EARTHQUAKE = 'Earthquake',
  FLOOD = 'Flood',
  CYCLONE = 'Cyclone',
  FIRE = 'Fire',
  LANDSLIDE = 'Landslide',
  TSUNAMI = 'Tsunami',
  THUNDERSTORM = 'Thunderstorm',
  CHEMICAL_SPILL = 'Chemical Spill',
}

export interface Institution {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
}

export type AvatarStyle = 'default' | 'teal' | 'amber' | 'rose';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  institutionId: string;
  class: string;
  avatarUrl: string;
  rollNumber?: string;
  avatarStyle?: AvatarStyle;
}

export interface QuizQuestion {
  id:string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Quiz {
  id: string;
  moduleId: string;
  title: string;
  questions: QuizQuestion[];
}

export interface ModuleContent {
  type: 'heading' | 'paragraph' | 'image' | 'list' | 'video';
  content: string | string[];
}

export interface LearningModule {
  id:string;
  title: string;
  description: string;
  hazardType: HazardType;
  regionTags: string[];
  thumbnailUrl: string;
  content: ModuleContent[];
  quizId: string;
  references?: { title: string; url: string }[];
  progress?: number;
}

export interface QuizScore {
  quizId: string;
  score: number;
  totalQuestions: number;
}

export interface ScenarioContent {
  text: string;
  choices?: string[];
  type: 'multiple-choice' | 'short-answer';
}

export interface LabScore {
  moduleId: string;
  score: number; // as a percentage
  steps: Array<{
    scenario: ScenarioContent;
    response: string;
    feedback: string;
    score: number; // out of 10
  }>;
  completedOn: string; // ISO date string
}

export interface StudentProgress {
  quizScores: Record<string, QuizScore>; // quizId -> score
  labScores: Record<string, LabScore>;   // moduleId -> score
  timeSpent: number; // in hours
}

export interface ForecastDay {
  day: string;
  date: string;
  highTemp: number;
  lowTemp: number;
  condition: string;
  windSpeed: number; // in km/h
  windDirection: string; // e.g., 'NW', 'S', 'E'
  precipitationChance: number; // in %
}

export interface ReliefCamp {
    name: string;
    type: string;
    address: string;
    contact: string;
    website?: string;
    latitude: number;
    longitude: number;
}

export interface NewsArticle {
  title: string;
  summary: string;
  imageUrl: string;
  source: string; // e.g., "Reuters"
  link: string; // URL to the full article
  isLocal?: boolean;
  status?: 'pending' | 'approved';
  type?: 'latest' | 'previous';
  isSummarizing?: boolean;
}