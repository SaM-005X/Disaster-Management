import React, { useMemo } from 'react';
import type { User, StudentProgress } from '../../types';
import { useTranslate } from '../../contexts/TranslationContext';
import { AwardIcon } from '../icons/AwardIcon';

interface LeaderboardProps {
    students: User[];
    progressData: Record<string, StudentProgress>;
    currentUser: User;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ students, progressData, currentUser }) => {
    const { translate } = useTranslate();

    const rankedStudents = useMemo(() => {
        return students
            .map(student => ({
                ...student,
                points: progressData[student.id]?.points || 0,
            }))
            .sort((a, b) => b.points - a.points);
    }, [students, progressData]);

    return (
        <div className="space-y-3">
            {rankedStudents.map((student, index) => {
                const rank = index + 1;
                const isCurrentUser = student.id === currentUser.id;
                
                let rankIcon = <span className="font-bold text-lg w-8 text-center">{rank}</span>;
                if (rank === 1) rankIcon = <AwardIcon className="h-8 w-8 text-amber-400" />;
                if (rank === 2) rankIcon = <AwardIcon className="h-8 w-8 text-slate-400" />;
                if (rank === 3) rankIcon = <AwardIcon className="h-8 w-8 text-amber-600" />;

                return (
                    <div key={student.id} className={`flex items-center p-3 rounded-lg transition-all ${isCurrentUser ? 'bg-teal-100 dark:bg-teal-900/50 border-2 border-teal-500' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                        <div className="flex-shrink-0 w-10 flex items-center justify-center">{rankIcon}</div>
                        <img src={student.avatarUrl} alt={student.name} className="h-12 w-12 rounded-full mx-4" />
                        <div className="flex-grow">
                            <p className="font-bold text-gray-800 dark:text-white">{student.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{student.class}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-extrabold text-teal-600 dark:text-teal-400">{student.points.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{translate('Points')}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default Leaderboard;
