import React, { useState, useMemo, useEffect } from 'react';
import type { User, LearningModule, StudentProgress } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import BarChart from './charts/BarChart';
import StudentEditModal from './StudentEditModal';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';


interface TeacherProgressViewProps {
  modules: LearningModule[];
  studentData: User[];
  progressData: Record<string, StudentProgress>;
  onAddStudent: (studentData: Omit<User, 'id' | 'avatarUrl' | 'institutionId' | 'role'>) => void;
  onUpdateStudent: (student: User) => void;
  onDeleteStudent: (studentId: string) => void;
}

const TeacherProgressView: React.FC<TeacherProgressViewProps> = ({ modules, studentData, progressData, onAddStudent, onUpdateStudent, onDeleteStudent }) => {
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId } = useTTS();
    const [certificationStatus, setCertificationStatus] = useState<Record<string, boolean>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<User | null>(null);

    const totalModules = modules.length;
    const totalLabs = modules.length; 
    const totalTasks = totalModules + totalLabs;

    useEffect(() => {
        // Synchronize certificationStatus with the current list of students.
        // This prevents dangling state when a student is deleted, making the component more robust.
        const studentIds = new Set(studentData.map(s => s.id));
        setCertificationStatus(prevStatus => {
            const newStatus: Record<string, boolean> = {};
            for (const id in prevStatus) {
                if (studentIds.has(id)) {
                    newStatus[id] = prevStatus[id];
                }
            }
            return newStatus;
        });
    }, [studentData]);

    useEffect(() => {
        const textsToRead: TTSText[] = [];
        textsToRead.push({ id: 'progress-teacher-header', text: translate('Classroom Analytics') });
        textsToRead.push({ id: 'progress-teacher-subheader', text: translate('Monitor student progress, completion rates, and certification status.') });
        textsToRead.push({ id: 'progress-teacher-chart-header', text: translate('Class Certification Progress (%)') });
        textsToRead.push({ id: 'progress-teacher-roster-header', text: translate('Student Roster & Progress') });
        
        if (studentData.length > 0) {
            textsToRead.push({ id: 'roster-th-class', text: translate('Class/Grade') });
            textsToRead.push({ id: 'roster-th-name', text: translate('Student Name') });
            textsToRead.push({ id: 'roster-th-roll', text: translate('Roll No.') });
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
            textsToRead.push({ id: 'roster-no-students', text: translate('No students have been added to your roster yet.') });
            textsToRead.push({ id: 'roster-no-students-cta', text: translate('Click the "Add Student" button to get started.') });
        }
        registerTexts(textsToRead);
    }, [studentData, progressData, registerTexts, translate, totalTasks]);

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

    const classData = useMemo(() => {
        const classes: Record<string, { total: number, certified: number }> = {};
        studentProgressList.forEach(student => {
            if (!classes[student.class]) {
                classes[student.class] = { total: 0, certified: 0 };
            }
            classes[student.class].total++;
            if (certificationStatus[student.id]) {
                classes[student.class].certified++;
            }
        });
        return Object.entries(classes).map(([className, data]) => ({
            label: className,
            value: data.total > 0 ? Math.round((data.certified / data.total) * 100) : 0,
        }));
    }, [studentProgressList, certificationStatus]);
    
    const toggleCertification = (studentId: string) => {
        setCertificationStatus(prev => ({...prev, [studentId]: !prev[studentId]}));
    };

    const handleOpenAddModal = () => {
        setEditingStudent(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (student: User) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleDelete = (studentId: string) => {
        if (window.confirm(translate('Are you sure you want to delete this student? This action cannot be undone.'))) {
            onDeleteStudent(studentId);
        }
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
                <h1 id="progress-teacher-header" className={`text-4xl font-extrabold text-gray-800 dark:text-white ${currentlySpokenId === 'progress-teacher-header' ? 'tts-highlight' : ''}`}>{translate('Classroom Analytics')}</h1>
                <p id="progress-teacher-subheader" className={`text-gray-600 dark:text-gray-400 mt-2 ${currentlySpokenId === 'progress-teacher-subheader' ? 'tts-highlight' : ''}`}>{translate('Monitor student progress, completion rates, and certification status.')}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md mb-8">
                <h2 id="progress-teacher-chart-header" className={`text-2xl font-bold text-gray-800 dark:text-white mb-4 ${currentlySpokenId === 'progress-teacher-chart-header' ? 'tts-highlight' : ''}`}>{translate('Class Certification Progress (%)')}</h2>
                <div className="h-64">
                    <BarChart data={classData} />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
                <div className="p-6 flex justify-between items-center">
                    <h2 id="progress-teacher-roster-header" className={`text-2xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === 'progress-teacher-roster-header' ? 'tts-highlight' : ''}`}>{translate('Student Roster & Progress')}</h2>
                     <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors"
                    >
                        <UserPlusIcon className="h-5 w-5" />
                        <span>{translate('Add Student')}</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" id="roster-th-class" className={`px-6 py-3 ${currentlySpokenId === 'roster-th-class' ? 'tts-highlight' : ''}`}>{translate('Class/Grade')}</th>
                                <th scope="col" id="roster-th-name" className={`px-6 py-3 ${currentlySpokenId === 'roster-th-name' ? 'tts-highlight' : ''}`}>{translate('Student Name')}</th>
                                <th scope="col" id="roster-th-roll" className={`px-6 py-3 ${currentlySpokenId === 'roster-th-roll' ? 'tts-highlight' : ''}`}>{translate('Roll No.')}</th>
                                <th scope="col" id="roster-th-completion" className={`px-6 py-3 ${currentlySpokenId === 'roster-th-completion' ? 'tts-highlight' : ''}`}>{translate('Module Completion')}</th>
                                <th scope="col" id="roster-th-cert" className={`px-6 py-3 text-center ${currentlySpokenId === 'roster-th-cert' ? 'tts-highlight' : ''}`}>{translate('Certification')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{translate('Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentProgressList.length > 0 ? studentProgressList.map(student => (
                                <tr key={student.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
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
                                            onClick={() => toggleCertification(student.id)}
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
                                            <button onClick={() => handleOpenEditModal(student)} className="p-2 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400" aria-label={translate("Edit student")}>
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleDelete(student.id)} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" aria-label={translate("Delete student")}>
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 px-6 text-gray-500 dark:text-gray-400">
                                        <span id="roster-no-students" className={currentlySpokenId === 'roster-no-students' ? 'tts-highlight' : ''}>{translate('No students have been added to your roster yet.')}</span><br/>
                                        <span id="roster-no-students-cta" className={currentlySpokenId === 'roster-no-students-cta' ? 'tts-highlight' : ''}>{translate('Click the "Add Student" button to get started.')}</span>
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
                />
            )}
        </div>
    );
};

export default TeacherProgressView;