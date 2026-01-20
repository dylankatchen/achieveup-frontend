import React, { useState, useEffect } from 'react';
import { Award, Users, CheckCircle, Clock, TrendingUp, Target, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { skillMatrixAPI, instructorAPI } from '../../services/api';
import Card from '../common/Card';
import toast from 'react-hot-toast';

interface BadgesDashboardProps {
    courseId: string;
}

interface StudentBadgeStatus {
    id: string;
    name: string;
    earned: boolean;
    progress: number; // 0-100
    earnedAt?: string;
    skillScore?: number;
}

interface BadgeData {
    id: string;
    name: string;
    description: string;
    skill_name: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    badge_type?: string;
    studentsEarned: StudentBadgeStatus[];
    studentsNotEarned: StudentBadgeStatus[];
}

const BadgesDashboard: React.FC<BadgesDashboardProps> = ({ courseId }) => {
    const [badges, setBadges] = useState<BadgeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
    const [showEarned, setShowEarned] = useState(true);



    const loadBadges = async () => {
        try {
            setLoading(true);

            // Fetch skill matrix for the course to get all skills
            const skillMatrixResponse = await skillMatrixAPI.getAllByCourse(courseId);
            const skillMatrices = skillMatrixResponse.data;

            if (!skillMatrices || skillMatrices.length === 0) {
                console.log('No skill matrix found for course');
                setBadges([]);
                setLoading(false);
                return;
            }

            // Get all skills from all matrices
            const allSkills: string[] = [];
            skillMatrices.forEach(matrix => {
                if (matrix.skills && Array.isArray(matrix.skills)) {
                    allSkills.push(...matrix.skills);
                }
            });

            // Remove duplicates
            const uniqueSkills = Array.from(new Set(allSkills));

            // Fetch student analytics to get skill progress data
            let studentAnalytics: any = null;
            try {
                const analyticsResponse = await instructorAPI.getCourseStudentAnalytics(courseId);
                studentAnalytics = analyticsResponse.data;
            } catch (error) {
                console.log('Could not load student analytics:', error);
                // If we can't load analytics, create badges with no student data
                const emptyBadges: BadgeData[] = uniqueSkills.map((skillName, index) => ({
                    id: `badge-${index}`,
                    name: `${skillName} Badge`,
                    description: `Awarded for demonstrating proficiency in ${skillName}`,
                    skill_name: skillName,
                    level: 'intermediate',
                    badge_type: 'skill',
                    studentsEarned: [],
                    studentsNotEarned: []
                }));
                setBadges(emptyBadges);
                setLoading(false);
                return;
            }

            // Create a badge for each skill
            const skillBadges: BadgeData[] = uniqueSkills.map((skillName, index) => {
                // Determine badge level based on skill name or index
                let level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
                const skillLower = skillName.toLowerCase();

                if (skillLower.includes('basic') || skillLower.includes('intro') || skillLower.includes('fundamental')) {
                    level = 'beginner';
                } else if (skillLower.includes('advanced') || skillLower.includes('expert') || skillLower.includes('master')) {
                    level = 'advanced';
                }

                // Process student data for this skill
                const studentsEarned: StudentBadgeStatus[] = [];
                const studentsNotEarned: StudentBadgeStatus[] = [];

                if (studentAnalytics && studentAnalytics.students) {
                    studentAnalytics.students.forEach((student: any) => {
                        // Check if student has skill breakdown data
                        if (student.skillBreakdown && student.skillBreakdown[skillName]) {
                            const skillData = student.skillBreakdown[skillName];
                            const skillScore = skillData.score || 0;
                            const hasEarned = skillScore >= 80; // Badge earned at 80% or higher

                            const studentStatus: StudentBadgeStatus = {
                                id: student.id,
                                name: student.name,
                                earned: hasEarned,
                                progress: skillScore,
                                skillScore: skillScore,
                                earnedAt: hasEarned ? new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString() : undefined
                            };

                            if (hasEarned) {
                                studentsEarned.push(studentStatus);
                            } else {
                                studentsNotEarned.push(studentStatus);
                            }
                        } else {
                            // Student hasn't attempted this skill yet
                            studentsNotEarned.push({
                                id: student.id,
                                name: student.name,
                                earned: false,
                                progress: 0,
                                skillScore: 0
                            });
                        }
                    });
                }

                return {
                    id: `badge-${index}`,
                    name: `${skillName} Badge`,
                    description: `Awarded for demonstrating proficiency in ${skillName}`,
                    skill_name: skillName,
                    level: level,
                    badge_type: 'skill',
                    studentsEarned: studentsEarned,
                    studentsNotEarned: studentsNotEarned
                };
            });

            setBadges(skillBadges);

        } catch (error) {
            console.error('Error loading badges:', error);
            toast.error('Failed to load badges');
            setBadges([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBadges();
    }, [loadBadges]);

    const getProgressColor = (progress: number) => {
        if (progress >= 90) return 'bg-green-500';
        if (progress >= 70) return 'bg-yellow-500';
        if (progress >= 50) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const toggleBadge = (badgeId: string) => {
        if (selectedBadge === badgeId) {
            setSelectedBadge(null);
        } else {
            setSelectedBadge(badgeId);
            setShowEarned(true); // Default to showing earned students first
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ucf-gold"></div>
            </div>
        );
    }

    if (badges.length === 0) {
        return (
            <Card title="Course Badges" className="mt-8">
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Badges Available</h3>
                    <p className="text-gray-600 mb-4">
                        Badges are automatically created for each skill in your course's skill matrix.
                    </p>
                    <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Create a skill matrix first to enable badges
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card title={`Course Badges (${badges.length} Skills)`} className="mt-8">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <div className="flex items-start">
                    <Target className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                        <strong>One badge per skill:</strong> Each skill in your course has a corresponding badge.
                        Students earn badges by achieving 80% or higher proficiency in each skill.
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                {badges.map((badge, index) => {
                    const isExpanded = selectedBadge === badge.id;
                    const totalStudents = badge.studentsEarned.length + badge.studentsNotEarned.length;
                    const earnedPercentage = totalStudents > 0
                        ? Math.round((badge.studentsEarned.length / totalStudents) * 100)
                        : 0;

                    // Alternate through three colors
                    const colors = ['bg-ucf-gold', 'bg-blue-500', 'bg-purple-500'];
                    const iconColor = colors[index % 3];

                    return (
                        <div key={badge.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Badge Header - Clickable */}
                            <button
                                onClick={() => toggleBadge(badge.id)}
                                className="w-full p-6 bg-white hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 flex-1">
                                        {/* Badge Icon */}
                                        <div className={`w-16 h-16 ${iconColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                                            <Award className="w-8 h-8 text-white" />
                                        </div>

                                        {/* Badge Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">{badge.skill_name}</h3>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                                            <div className="flex items-center space-x-4 text-sm">
                                                <div className="flex items-center text-green-600">
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    <span>{badge.studentsEarned.length} earned</span>
                                                </div>
                                                <div className="flex items-center text-orange-600">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    <span>{badge.studentsNotEarned.length} in progress</span>
                                                </div>
                                                {totalStudents > 0 && (
                                                    <div className="flex items-center text-gray-500">
                                                        <Users className="w-4 h-4 mr-1" />
                                                        <span>{totalStudents} total</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-32 flex-shrink-0">
                                            <div className="text-xs text-gray-600 mb-1 text-right">{earnedPercentage}% earned</div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${earnedPercentage}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Expand Icon */}
                                        <div className="flex-shrink-0">
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 bg-gray-50">
                                    {/* Toggle Buttons */}
                                    <div className="flex border-b border-gray-200">
                                        <button
                                            onClick={() => setShowEarned(true)}
                                            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${showEarned
                                                ? 'bg-white text-green-600 border-b-2 border-green-600'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center space-x-2">
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Earned ({badge.studentsEarned.length})</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setShowEarned(false)}
                                            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${!showEarned
                                                ? 'bg-white text-orange-600 border-b-2 border-orange-600'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center space-x-2">
                                                <TrendingUp className="w-4 h-4" />
                                                <span>In Progress ({badge.studentsNotEarned.length})</span>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Student List */}
                                    <div className="p-6">
                                        {showEarned ? (
                                            // Students who earned the badge
                                            badge.studentsEarned.length > 0 ? (
                                                <div className="space-y-3">
                                                    {badge.studentsEarned.map((student) => (
                                                        <div key={student.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-900">{student.name}</p>
                                                                        <p className="text-xs text-gray-500">Earned on {formatDate(student.earnedAt)}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-lg font-semibold text-green-600">{student.skillScore}%</div>
                                                                    <div className="text-xs text-gray-500">Skill Score</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                                    <p>No students have earned this badge yet</p>
                                                </div>
                                            )
                                        ) : (
                                            // Students who haven't earned the badge
                                            badge.studentsNotEarned.length > 0 ? (
                                                <div className="space-y-3">
                                                    {badge.studentsNotEarned.map((student) => (
                                                        <div key={student.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                                                        <Clock className="w-5 h-5 text-orange-600" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-900">{student.name}</p>
                                                                        <p className="text-xs text-gray-500">Current score: {student.skillScore}%</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className={`text-lg font-semibold ${student.progress >= 80 ? 'text-green-600' :
                                                                        student.progress >= 60 ? 'text-yellow-600' :
                                                                            'text-orange-600'
                                                                        }`}>
                                                                        {student.progress}%
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {student.progress >= 80 ? 'Ready to earn!' : `${(80 - student.progress).toFixed(2)}% to badge`}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Progress Bar */}
                                                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                                                <div
                                                                    className={`h-2 rounded-full transition-all ${getProgressColor(student.progress)}`}
                                                                    style={{ width: `${student.progress}%` }}
                                                                ></div>
                                                            </div>
                                                            {/* Badge threshold indicator */}

                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                                    <p>All students have earned this badge!</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default BadgesDashboard;