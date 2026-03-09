import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Download, Filter, TrendingUp, Users, Target, Award, BarChart3, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { analyticsAPI, instructorAPI, canvasInstructorAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../common/Card';
import Button from '../common/Button';
import { AnalyticsDashboardProps, AnalyticsFilters, PerformanceData, SkillDistributionData, TrendData, RadarData } from '../../types';
import toast from 'react-hot-toast';

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ courseId }) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<AnalyticsFilters>({
    skillLevel: 'all',
    performanceRange: 'all',
    dateRange: '30'
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCourse, setSelectedCourse] = useState<string>(courseId || '');
  const [courses, setCourses] = useState<any[]>([]);
  const [data, setData] = useState<{
    performance: PerformanceData[];
    distribution: SkillDistributionData[];
    trends: TrendData[];
    radar: RadarData[];
    summary?: {
      totalStudents: number;
      averageScore: number;
      badgesEarned: number;
      skillsTracked: number;
    };
  }>({
    performance: [],
    distribution: [],
    trends: [],
    radar: [],
    summary: {
      totalStudents: 0,
      averageScore: 0,
      badgesEarned: 0,
      skillsTracked: 0
    }
  });

  const [studentAnalytics, setStudentAnalytics] = useState<{
    students: Array<{
      id: string;
      name: string;
      progress: number;
      skillsMastered: number;
      badgesEarned: number;
      riskLevel: 'low' | 'medium' | 'high';
    }>;
    skillDistribution: Record<string, number>;
    averageScores: Record<string, number>;
  }>({
    students: [],
    skillDistribution: {},
    averageScores: {}
  });

  const isInstructor = user?.canvasTokenType === 'instructor';
  const [syncing, setSyncing] = useState<boolean>(false);

  const loadAnalyticsData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      if (isInstructor && selectedCourse) {
        // Load instructor-specific analytics
        const [courseAnalytics, studentData] = await Promise.all([
          instructorAPI.getCourseStudentAnalytics(selectedCourse),
          analyticsAPI.getIndividualGraphs(selectedCourse)
        ]);

        const studentAnalyticsData = courseAnalytics.data.analytics;

        setStudentAnalytics(studentAnalyticsData);
        setData({
          performance: studentData.data.performance || [],
          distribution: studentData.data.distribution || [],
          trends: studentData.data.trends || [],
          radar: studentData.data.radar || [],
          summary: {
            totalStudents: studentAnalyticsData.students.length,
            averageScore: studentAnalyticsData.students.reduce((acc, s) => acc + s.progress, 0) / studentAnalyticsData.students.length || 0,
            badgesEarned: studentAnalyticsData.students.reduce((acc, s) => acc + s.badgesEarned, 0),
            skillsTracked: Object.keys(studentAnalyticsData.skillDistribution).length
          }
        });
      } else {
        // Load regular analytics data
        const response = await analyticsAPI.getIndividualGraphs(courseId);
        setData({
          performance: response.data.performance || [],
          distribution: response.data.distribution || [],
          trends: response.data.trends || [],
          radar: response.data.radar || [],
          summary: response.data.summary || {
            totalStudents: 0,
            averageScore: 0,
            badgesEarned: 0,
            skillsTracked: 0
          }
        });
      }

    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Set empty data when API fails
      setData({
        performance: [],
        distribution: [],
        trends: [],
        radar: [],
        summary: {
          totalStudents: 0,
          averageScore: 0,
          badgesEarned: 0,
          skillsTracked: 0
        }
      });
      setStudentAnalytics({
        students: [],
        skillDistribution: {},
        averageScores: {}
      });
      toast.error('Failed to load analytics data. Backend endpoints need to be implemented.');
    } finally {
      setLoading(false);
    }
  }, [courseId, isInstructor, selectedCourse]);

  const loadCourses = useCallback(async () => {
    if (isInstructor) {
      try {
        const response = await canvasInstructorAPI.getInstructorCourses();
        setCourses(response.data);
      } catch (error) {
        console.error('Error loading courses:', error);
        setCourses([]);
      }
    }
  }, [isInstructor]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const handleFilterChange = (key: keyof AnalyticsFilters, value: string): void => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportData = async (): Promise<void> => {
    try {
      const response = await analyticsAPI.exportCourseData(selectedCourse || courseId);

      // Create and download CSV file
      const csvContent = convertToCSV(response.data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${selectedCourse || courseId}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const convertToCSV = (data: any): string => {
    // Simple CSV conversion - can be enhanced based on actual data structure
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Students', data.totalStudents || 0],
      ['Average Score', data.averageScore || 0],
      ['Total Skills', data.totalSkills || 0],
      ['Badges Awarded', data.badgesAwarded || 0],
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const getRiskLevelColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const COLORS = ['#ffca06', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ucf-gold"></div>
      </div>
    );
  }

  // Check if we have any data
  const hasData = data.performance.length > 0 || data.distribution.length > 0 || data.trends.length > 0 || data.radar.length > 0 || studentAnalytics.students.length > 0;

  if (!hasData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Course Selection for Instructors */}
        {isInstructor && (
          <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <Target className="w-5 h-5 text-gray-500" />
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucf-gold"
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              {selectedCourse && (
                <Button
                  onClick={async () => {
                    setSyncing(true);
                    try {
                      const result = await instructorAPI.forceSyncCourse(selectedCourse);
                      toast.success(
                        `Sync complete! ${result.data.details.progress_synced} students updated.`
                      );
                      await loadAnalyticsData();
                    } catch (error) {
                      console.error('Force sync error:', error);
                      toast.error('Failed to sync data. Please try again.');
                    } finally {
                      setSyncing(false);
                    }
                  }}
                  className="flex items-center gap-2"
                  disabled={syncing}
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data Available</h2>
          <p className="text-gray-600 mb-4">
            {isInstructor
              ? 'Select a course above, assign skills to questions, then click Sync Now to populate analytics.'
              : 'Analytics data will appear here once the backend endpoints are implemented and you have course data.'
            }
          </p>
          <p className="text-sm text-gray-500">
            {isInstructor
              ? 'This feature requires: Canvas integration, skill matrices, and student progress data.'
              : 'This feature requires: Canvas integration, skill matrices, and student progress data.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Export & Sync Buttons */}
      <div className="flex justify-end gap-3 mb-8">
        {isInstructor && selectedCourse && (
          <Button
            onClick={async () => {
              setSyncing(true);
              try {
                const result = await instructorAPI.forceSyncCourse(selectedCourse);
                toast.success(
                  `Sync complete! ${result.data.details.progress_synced} students updated.`
                );
                // Refresh the dashboard data
                await loadAnalyticsData();
              } catch (error) {
                console.error('Force sync error:', error);
                toast.error('Failed to sync data. Please try again.');
              } finally {
                setSyncing(false);
              }
            }}
            className="flex items-center gap-2"
            disabled={syncing}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        )}
        <Button onClick={exportData} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </Button>
      </div>

      {/* Course Selection for Instructors */}
      {isInstructor && (
        <Card className="mb-8">
          <div className="flex items-center gap-4">
            <Target className="w-5 h-5 text-gray-500" />
            <div className="flex gap-4">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucf-gold"
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-8">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex gap-4">
            <select
              value={filters.skillLevel}
              onChange={(e) => handleFilterChange('skillLevel', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucf-gold"
            >
              <option value="all">All Skill Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={filters.performanceRange}
              onChange={(e) => handleFilterChange('performanceRange', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucf-gold"
            >
              <option value="all">All Performance Levels</option>
              <option value="high">High Performers (&gt;80%)</option>
              <option value="medium">Medium Performers (60-80%)</option>
              <option value="low">Low Performers (&lt;60%)</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucf-gold"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.summary?.totalStudents || 0}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </Card>

        <Card className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.summary?.averageScore || 0}%</div>
          <div className="text-sm text-gray-600">Average Score</div>
        </Card>

        <Card className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-ucf-gold bg-opacity-20 rounded-lg mx-auto mb-4">
            <Award className="w-6 h-6 text-ucf-gold" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.summary?.badgesEarned || 0}</div>
          <div className="text-sm text-gray-600">Badges Earned</div>
        </Card>

        <Card className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.summary?.skillsTracked || 0}</div>
          <div className="text-sm text-gray-600">Skills Tracked</div>
        </Card>
      </div>

      {/* Instructor-specific Student Analytics */}
      {isInstructor && studentAnalytics.students.length > 0 && (
        <Card title="Student Performance Overview" className="mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skills Mastered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Badges Earned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentAnalytics.students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.skillsMastered}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.badgesEarned}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(student.riskLevel)}`}>
                        {student.riskLevel === 'low' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {student.riskLevel === 'medium' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {student.riskLevel === 'high' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {student.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Performance Comparison */}
        <Card title="Student Performance Comparison">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="studentId" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="averageScore" fill="#ffca06" name="Average Score" />
              <Bar dataKey="masteredSkills" fill="#10b981" name="Mastered Skills" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Skill Distribution */}
        <Card title="Skill Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Trend Analysis */}
      <Card title="Skill Progress Trends" className="mb-8">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="skill" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="week1" stroke="#ffca06" name="Week 1" />
            <Line type="monotone" dataKey="week2" stroke="#3b82f6" name="Week 2" />
            <Line type="monotone" dataKey="week3" stroke="#10b981" name="Week 3" />
            <Line type="monotone" dataKey="week4" stroke="#f59e0b" name="Week 4" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Radar Chart */}
      <Card title="Skill Proficiency Radar">
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.radar}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name="Proficiency" dataKey="A" stroke="#ffca06" fill="#ffca06" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard; 