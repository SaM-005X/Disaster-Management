import React from 'react';
import type { User, LearningModule, StudentProgress, Badge } from '../types';
import { UserRole } from '../types';
import TeacherProgressView from './TeacherProgressView';
import StudentProgressView from './StudentProgressView';

interface ProgressTrackerProps {
  user: User;
  allUsers: User[];
  modules: LearningModule[];
  studentData: User[];
  progressData: Record<string, StudentProgress>;
  certificationStatus: Record<string, boolean>;
  onAddStudent: (studentData: Omit<User, 'id' | 'avatarUrl' | 'institutionId' | 'role'>) => void;
  onUpdateStudent: (student: User) => void;
  onDeleteStudent: (studentId: string) => void;
  onToggleCertification: (studentId: string) => void;
  badgesConst: Badge[];
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ 
    user, allUsers, modules, studentData, progressData, onAddStudent, onUpdateStudent, onDeleteStudent,
    certificationStatus, onToggleCertification, badgesConst
}) => {
  if (user.role === UserRole.TEACHER || user.role === UserRole.GOVERNMENT_OFFICIAL) {
    return <TeacherProgressView
              user={user}
              modules={modules} 
              studentData={studentData} 
              progressData={progressData}
              onAddStudent={onAddStudent}
              onUpdateStudent={onUpdateStudent}
              onDeleteStudent={onDeleteStudent}
              certificationStatus={certificationStatus}
              onToggleCertification={onToggleCertification}
            />;
  }
  
  if (user.role === UserRole.STUDENT || user.role === UserRole.USER) {
    const studentProgress = progressData[user.id] || { quizScores: {}, labScores: {}, timeSpent: 0, points: 0, badges: [] };
    return <StudentProgressView 
                user={user} 
                modules={modules} 
                progress={studentProgress}
                allUsers={allUsers}
                progressData={progressData}
                badgesConst={badgesConst}
            />;
  }

  return null; // Or a default view for other roles
};

export default ProgressTracker;