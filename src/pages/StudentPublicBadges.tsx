import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { badgeAPI } from '../services/api';
import Card from '../components/common/Card';
import { Award, Share2, AlertCircle, Copy, Check } from 'lucide-react';

interface BadgeData {
    badge_id: string;
    badge_name: string;
    skill_name: string;
    badge_level: string;
    progress_percentage: number;
    earned_at: string;
    course_id: string;
    course_name?: string;
}

const StudentPublicBadges: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const [badges, setBadges] = useState<BadgeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadBadges = async () => {
            if (!studentId) return;
            try {
                setLoading(true);
                const response = await badgeAPI.getPublicStudentBadges(studentId);
                setBadges(response.data.badges || []);
                setError(null);
            } catch (err: any) {
                console.error('Error loading public badges:', err);
                setError(err.response?.data?.message || 'Failed to load badges. The student ID might be invalid.');
            } finally {
                setLoading(false);
            }
        };

        loadBadges();
    }, [studentId]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => {
                console.error("Failed to copy link: ", err);
            });
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const getBadgeColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'expert': return 'bg-purple-600';
            case 'advanced': return 'bg-blue-600';
            case 'intermediate': return 'bg-ucf-gold';
            case 'beginner': return 'bg-green-600';
            default: return 'bg-gray-600';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ucf-gold"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
                <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center border-t-4 border-red-500">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Badges</h2>
                    <p className="text-gray-600">{error}</p>
                    <Link to="/login" className="mt-6 inline-block text-ucf-gold hover:text-yellow-600 font-medium">
                        Return to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Simple Public Header */}
            <nav className="bg-white shadow-sm mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex-shrink-0 flex items-center">
                                <div className="w-8 h-8 bg-ucf-gold rounded-lg flex items-center justify-center">
                                    <span className="text-ucf-black font-bold text-lg">A</span>
                                </div>
                                <span className="ml-2 text-xl font-bold text-gray-900">AchieveUp</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
                        Student Achievements
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                        View the verified skills and badges earned through AchieveUp.
                    </p>

                    <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all"
                    >
                        {copied ? (
                            <><Check className="w-5 h-5 mr-2 text-green-400" /> Copied to Clipboard!</>
                        ) : (
                            <><Share2 className="w-5 h-5 mr-2" /> Share Profile</>
                        )}
                    </button>
                </div>

                {badges.length === 0 ? (
                    <Card className="text-center p-12">
                        <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-medium text-gray-900 mb-2">No Badges Yet</h3>
                        <p className="text-gray-600">This student has not earned any badges yet.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {badges.map((badge) => (
                            <div key={badge.badge_id} className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
                                <div className={`h-44 ${getBadgeColor(badge.badge_level)} flex flex-col items-center justify-center p-4 relative overflow-hidden`}>
                                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                                    <Award className="absolute w-40 h-40 text-white opacity-20 z-0" />
                                    <div className="z-10 text-center flex flex-col items-center">
                                        <Award className="w-8 h-8 text-white mb-2 shadow-sm" />
                                        <h3 className="text-lg font-bold text-white leading-tight px-2 drop-shadow-md">
                                            {badge.badge_name}
                                        </h3>
                                        <p className="text-xs text-white opacity-90 mt-2 font-medium bg-black bg-opacity-20 px-3 py-1 rounded-full drop-shadow-sm">
                                            {badge.course_name || 'AchieveUp Verified'}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm font-semibold text-ucf-gold uppercase tracking-wider mb-1">
                                                {badge.badge_level} Level
                                            </p>
                                            <h3 className="text-xl font-bold text-gray-900 leading-tight">
                                                {badge.badge_name}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                            <div className="sm:col-span-1">
                                                <dt className="text-sm font-medium text-gray-500">Skill</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-medium">{badge.skill_name || 'N/A'}</dd>
                                            </div>
                                            <div className="sm:col-span-1">
                                                <dt className="text-sm font-medium text-gray-500">Class</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-medium">{badge.course_name || 'N/A'}</dd>
                                            </div>
                                            <div className="sm:col-span-1">
                                                <dt className="text-sm font-medium text-gray-500">Earned</dt>
                                                <dd className="mt-1 text-sm text-gray-900">{formatDate(badge.earned_at)}</dd>
                                            </div>
                                            <div className="sm:col-span-1">
                                                <dt className="text-sm font-medium text-gray-500">Proficiency</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-semibold">{Number(badge.progress_percentage).toFixed(2)}%</dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentPublicBadges;
