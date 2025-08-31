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
  certificationStatus: Record<string, boolean>;
  onAddStudent: (studentData: Omit<User, 'id' | 'avatarUrl' | 'institutionId' | 'role'>) => void;
  onUpdateStudent: (student: User) => void;
  onDeleteStudent: (studentId: string) => void;
  onToggleCertification: (studentId: string) => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ 
    user, modules, studentData, progressData, onAddStudent, onUpdateStudent, onDeleteStudent,
    certificationStatus, onToggleCertification
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
    const studentProgress = progressData[user.id] || { quizScores: {}, labScores: {}, timeSpent: 0 };
    return <StudentProgressView user={user} modules={modules} progress={studentProgress} />;
  }

  return null; // Or a default view for other roles
};

export default ProgressTracker;