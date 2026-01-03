import React, { useState } from 'react';
import { badgeAPI } from '../../services/api';
import { Award, Calendar, BookOpen, TrendingUp } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import toast from 'react-hot-toast';

interface EarnedBadge {
    badge_id: string;
    badge_name: string;
    skill_name: string;
    badge_level: string;
    progress_percentage: number;
    earned_at: string;
    course_id: string;
    course_name: string;
}

const StudentBadgesTest: React.FC = () => {
    const [studentId, setStudentId] = useState('');
    const [badges, setBadges] = useState<EarnedBadge[]>([]);
    const [totalBadges, setTotalBadges] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!studentId.trim()) {
            toast.error('Please enter a student ID');
            return;
        }

        try {
            setLoading(true);
            const response = await badgeAPI.getStudentEarnedBadges(studentId);
            setBadges(response.data.badges);
            setTotalBadges(response.data.total_badges);
            setSearched(true);
            toast.success(`Found ${response.data.total_badges} badges`);
        } catch (error: any) {
            console.error('Error fetching badges:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch badges');
            setBadges([]);
            setTotalBadges(0);
            setSearched(true);
        } finally {
            setLoading(false);
        }
    };

    const getBadgeLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'beginner': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'advanced': return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'expert': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getBadgeIconColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'beginner': return 'bg-blue-500';
            case 'intermediate': return 'bg-yellow-500';
            case 'advanced': return 'bg-purple-500';
            case 'expert': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Card title="Student Badges Test">
                <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                        Enter a student ID to view all badges they have earned across all courses.
                    </p>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Enter student ID (e.g., s1, s2, s3)"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucf-gold"
                        />
                        <Button onClick={handleSearch} disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </Button>
                    </div>
                </div>

                {searched && (
                    <>
                        {/* Summary */}
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Award className="w-6 h-6 text-blue-600" />
                                    <div>
                                        <p className="font-semibold text-blue-900">
                                            Student ID: {studentId}
                                        </p>
                                        <p className="text-sm text-blue-700">
                                            Total Badges Earned: {totalBadges}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Badges List */}
                        {badges.length > 0 ? (
                            <div className="space-y-4">
                                {badges.map((badge) => (
                                    <div key={badge.badge_id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                                        <div className="flex items-start space-x-4">
                                            {/* Badge Icon */}
                                            <div className={`w-14 h-14 ${getBadgeIconColor(badge.badge_level)} rounded-full flex items-center justify-center flex-shrink-0`}>
                                                <Award className="w-7 h-7 text-white" />
                                            </div>

                                            {/* Badge Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {badge.skill_name}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getBadgeLevelColor(badge.badge_level)}`}>
                                                        {badge.badge_level}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                    <div className="flex items-center text-gray-600">
                                                        <BookOpen className="w-4 h-4 mr-2" />
                                                        <span className="truncate">{badge.course_name}</span>
                                                    </div>
                                                    <div className="flex items-center text-gray-600">
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        <span>Earned: {formatDate(badge.earned_at)}</span>
                                                    </div>
                                                    <div className="flex items-center text-gray-600">
                                                        <TrendingUp className="w-4 h-4 mr-2" />
                                                        <span>Score: {badge.progress_percentage.toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600">No badges found for this student</p>
                                <p className="text-sm text-gray-500 mt-2">
                                    This student hasn't earned any badges yet, or the student ID doesn't exist.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
};

export default StudentBadgesTest;
