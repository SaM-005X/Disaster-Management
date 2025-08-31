import React, { useState, useMemo, useEffect } from 'react';
import type { User, LearningModule, StudentProgress } from '../types';
import { UserRole } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import BarChart from './charts/BarChart';
import StudentEditModal from './StudentEditModal';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';


interface TeacherProgressViewProps {
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

const TeacherProgressView: React.FC<TeacherProgressViewProps> = ({ 
    user, modules, studentData, progressData, certificationStatus,
    onAddStudent, onUpdateStudent, onDeleteStudent, onToggleCertification 
}) => {
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId } = useTTS();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<User | null>(null);

    const totalModules = modules.length;
    const totalLabs = modules.length; 
    const totalTasks = totalModules + totalLabs;
    const isOfficial = user.role === UserRole.GOVERNMENT_OFFICIAL;
    const userType = isOfficial ? 'employee' : 'student';

    const headerTitle = isOfficial ? translate('National Analytics Dashboard') : translate('Classroom Analytics');
    const subheaderText = isOfficial 
        ? translate('Monitor national employee progress, completion rates, and certification status across all institutions.') 
        : translate('Monitor student progress, completion rates, and certification status.');
    
    const rosterTitle = isOfficial ? translate('Employee Roster & Progress') : translate('Student Roster & Progress');
    const addButtonText = isOfficial ? translate('Add Employee') : translate('Add Student');
    const classHeader = isOfficial ? translate('Department') : translate('Class/Grade');
    const nameHeader = isOfficial ? translate('Employee Name') : translate('Student Name');
    const idHeader = isOfficial ? translate('Employee ID') : translate('Roll No.');


    useEffect(() => {
        const textsToRead: TTSText[] = [];
        textsToRead.push({ id: 'progress-teacher-header', text: headerTitle });
        textsToRead.push({ id: 'progress-teacher-subheader', text: subheaderText });
        textsToRead.push({ id: 'progress-teacher-chart-header', text: isOfficial ? translate('Institution Certification Progress (%)') : translate('Class Certification Progress (%)') });
        textsToRead.push({ id: 'progress-teacher-roster-header', text: rosterTitle });
        
        if (studentData.length > 0) {
            textsToRead.push({ id: 'roster-th-class', text: classHeader });
            textsToRead.push({ id: 'roster-th-name', text: nameHeader });
            textsToRead.push({ id: 'roster-th-roll', text: idHeader });
            textsToRead.push({ id: 'roster-th-completion', text: translate('Module Completion') });
            textsToRead.push({ id: 'roster-th-cert', text: translate('Certification') });
            
            studentData.forEach(student => {
                const progress = progressData[student.id] || { quizScores: {}, labScores: {} };
                const completedQuizzes = Object.keys(progress.quizScores).length;
                const completedLabs = Object.keys(progress.labScores).length;
                const completionPercentage = totalTasks > 0 ? Math.round(((completedQuizzes + completedLabs) / totalTasks) * 100) : 0;
                
                textsToRead.push({ id: `roster-student-${student.id}-class`, text: student.class });
                textsToRead.push({ id: `roster-student-${student.id}-name`, text: student.name });
                textsToRead.push({ id: `roster-student-${student.id}-roll`, text: student.rollNumber || translate('N/A') });
                textsToRead.push({ id: `roster-student-${student.id}-completion`, text: `${completionPercentage} percent` });
            });
        } else {
            const noDataText = isOfficial ? translate('No employees have been added to your roster yet.') : translate('No students have been added to your roster yet.');
            const ctaText = isOfficial ? translate('Click the "Add Employee" button to get started.') : translate('Click the "Add Student" button to get started.');
            textsToRead.push({ id: 'roster-no-students', text: noDataText });
            textsToRead.push({ id: 'roster-no-students-cta', text: ctaText });
        }
        registerTexts(textsToRead);
    }, [studentData, progressData, registerTexts, translate, totalTasks, headerTitle, subheaderText, isOfficial, rosterTitle, classHeader, nameHeader, idHeader]);

    const studentProgressList = useMemo(() => studentData.map(student => {
        const progress = progressData[student.id] || { quizScores: {}, labScores: {} };
        const completedQuizzes = Object.keys(progress.quizScores).length;
        const completedLabs = Object.keys(progress.labScores).length;
        const completionPercentage = totalTasks > 0 ? Math.round(((completedQuizzes + completedLabs) / totalTasks) * 100) : 0;
        
        return {
            ...student,
            completionPercentage,
        };
    }), [studentData, progressData, totalTasks]);

    const chartData = useMemo(() => {
        const groupingKey = isOfficial ? 'institutionName' : 'class';
        const groups: Record<string, { total: number, certified: number }> = {};

        studentProgressList.forEach(student => {
            const key = (student as any)[groupingKey] as string;
            if (!groups[key]) {
                groups[key] = { total: 0, certified: 0 };
            }
            groups[key].total++;
            if (certificationStatus[student.id]) {
                groups[key].certified++;
            }
        });

        return Object.entries(groups).map(([groupName, data]) => ({
            label: groupName,
            value: data.total > 0 ? Math.round((data.certified / data.total) * 100) : 0,
        }));
    }, [studentProgressList, certificationStatus, isOfficial]);

    const handleOpenAddModal = () => {
        setEditingStudent(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (student: User) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };
    
    const handleSaveStudent = (student: User | Omit<User, 'id' | 'avatarUrl' | 'institutionId' | 'role'>) => {
        if ('id' in student) {
            onUpdateStudent(student);
        } else {
            onAddStudent(student);
        }
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="mb-8">
                <h1 id="progress-teacher-header" className={`text-4xl font-extrabold text-gray-800 dark:text-white ${currentlySpokenId === 'progress-teacher-header' ? 'tts-highlight' : ''}`}>{headerTitle}</h1>
                <p id="progress-teacher-subheader" className={`text-gray-600 dark:text-gray-400 mt-2 ${currentlySpokenId === 'progress-teacher-subheader' ? 'tts-highlight' : ''}`}>{subheaderText}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md mb-8">
                <h2 id="progress-teacher-chart-header" className={`text-2xl font-bold text-gray-800 dark:text-white mb-4 ${currentlySpokenId === 'progress-teacher-chart-header' ? 'tts-highlight' : ''}`}>
                    {isOfficial ? translate('Institution Certification Progress (%)') : translate('Class Certification Progress (%)')}
                </h2>
                <div className="h-64">
                    <BarChart data={chartData} />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
                <div className="p-6 flex justify-between items-center">
                    <h2 id="progress-teacher-roster-header" className={`text-2xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === 'progress-teacher-roster-header' ? 'tts-highlight' : ''}`}>{rosterTitle}</h2>
                     <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors"
                    >
                        <UserPlusIcon className="h-5 w-5" />
                        <span>{addButtonText}</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                {isOfficial && <th scope="col" className="px-6 py-3">{translate('Institution')}</th>}
                                <th scope="col" id="roster-th-class" className={`px-6 py-3 ${currentlySpokenId === 'roster-th-class' ? 'tts-highlight' : ''}`}>{classHeader}</th>
                                <th scope="col" id="roster-th-name" className={`px-6 py-3 ${currentlySpokenId === 'roster-th-name' ? 'tts-highlight' : ''}`}>{nameHeader}</th>
                                <th scope="col" id="roster-th-roll" className={`px-6 py-3 ${currentlySpokenId === 'roster-th-roll' ? 'tts-highlight' : ''}`}>{idHeader}</th>
                                <th scope="col" id="roster-th-completion" className={`px-6 py-3 ${currentlySpokenId === 'roster-th-completion' ? 'tts-highlight' : ''}`}>{translate('Module Completion')}</th>
                                <th scope="col" id="roster-th-cert" className={`px-6 py-3 text-center ${currentlySpokenId === 'roster-th-cert' ? 'tts-highlight' : ''}`}>{translate('Certification')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{translate('Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentProgressList.length > 0 ? studentProgressList.map(student => (
                                <tr key={student.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    {isOfficial && <td className="px-6 py-4">{student.institutionName}</td>}
                                    <td id={`roster-student-${student.id}-class`} className={`px-6 py-4 ${currentlySpokenId === `roster-student-${student.id}-class` ? 'tts-highlight' : ''}`}>{student.class}</td>
                                    <th scope="row" id={`roster-student-${student.id}-name`} className={`px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white ${currentlySpokenId === `roster-student-${student.id}-name` ? 'tts-highlight' : ''}`}>
                                        {student.name}
                                    </th>
                                    <td id={`roster-student-${student.id}-roll`} className={`px-6 py-4 ${currentlySpokenId === `roster-student-${student.id}-roll` ? 'tts-highlight' : ''}`}>{student.rollNumber}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                <div className="bg-teal-600 h-2.5 rounded-full" style={{width: `${student.completionPercentage}%`}}></div>
                                            </div>
                                            <span id={`roster-student-${student.id}-completion`} className={`font-semibold ${currentlySpokenId === `roster-student-${student.id}-completion` ? 'tts-highlight' : ''}`}>{student.completionPercentage}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => onToggleCertification(student.id)}
                                            className={`w-full flex items-center justify-center gap-2 text-xs font-bold py-2 px-3 rounded-full transition-colors ${
                                                certificationStatus[student.id] 
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                                            }`}
                                        >
                                            {certificationStatus[student.id] && <CheckCircleIcon className="h-4 w-4" />}
                                            {certificationStatus[student.id] ? translate('Certified') : translate('Mark Complete')}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <button onClick={() => handleOpenEditModal(student)} className="p-2 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400" aria-label={isOfficial ? translate("Edit employee") : translate("Edit student")}>
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => onDeleteStudent(student.id)} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" aria-label={isOfficial ? translate("Delete employee") : translate("Delete student")}>
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={isOfficial ? 7 : 6} className="text-center py-8 px-6 text-gray-500 dark:text-gray-400">
                                        <span id="roster-no-students" className={currentlySpokenId === 'roster-no-students' ? 'tts-highlight' : ''}>
                                            {isOfficial ? translate('No employees have been added to your roster yet.') : translate('No students have been added to your roster yet.')}
                                        </span><br/>
                                        <span id="roster-no-students-cta" className={currentlySpokenId === 'roster-no-students-cta' ? 'tts-highlight' : ''}>
                                            {isOfficial ? translate('Click the "Add Employee" button to get started.') : translate('Click the "Add Student" button to get started.')}
                                        </span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && (
                <StudentEditModal 
                    student={editingStudent}
                    onSave={handleSaveStudent}
                    onClose={() => setIsModalOpen(false)}
                    userType={userType}
                />
            )}
        </div>
    );
};

export default TeacherProgressView;