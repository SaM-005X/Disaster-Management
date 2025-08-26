import React from 'react';
import type { User, LearningModule, StudentProgress } from '../types';
import { UserRole } from '../types';
import TeacherProgressView from './TeacherProgressView';
import StudentProgressView from './StudentProgressView';

interface ProgressTrackerProps {
  user: User;
  modules: LearningModule[];
  studentData: User[];
  progressData: Record<string, StudentProgress>;
  onAddStudent: (studentData: Omit<User, 'id' | 'avatarUrl' | 'institutionId' | 'role'>) => void;
  onUpdateStudent: (student: User) => void;
  onDeleteStudent: (studentId: string) => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ user, modules, studentData, progressData, onAddStudent, onUpdateStudent, onDeleteStudent }) => {
  if (user.role === UserRole.TEACHER) {
    return <TeacherProgressView 
              modules={modules} 
              studentData={studentData} 
              progressData={progressData}
              onAddStudent={onAddStudent}
              onUpdateStudent={onUpdateStudent}
              onDeleteStudent={onDeleteStudent}
            />;
  }
  
  if (user.role === UserRole.STUDENT) {
    const studentProgress = progressData[user.id] || { quizScores: {}, labScores: {}, timeSpent: 0 };
    return <StudentProgressView user={user} modules={modules} progress={studentProgress} />;
  }

  return null; // Or a default view for other roles
};

export default ProgressTracker;
