import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import './index.css';
import SkillMatrixCreator from './components/SkillMatrixCreator/SkillMatrixCreator';
import SkillAssignmentInterface from './components/SkillAssignmentInterface/SkillAssignmentInterface';
import BadgesDashboard from './components/BadgesDashboard/BadgesDashboard';
import StudentBadgesTest from './components/StudentBadgesTest/StudentBadgesTest';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Student Progress Component
const StudentProgress: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [studentData, setStudentData] = useState<{
    students: Array<{
      id: string;
      name: string;
      skillsMastered: number;
      badgesEarned: number;
      riskLevel: 'low' | 'medium' | 'high';
      topSkills: Array<{ skill: string; score: number; level: string }>;
      skillBreakdown?: Record<string, { score: number; level: string; questionsAttempted: number; questionsCorrect: number }>;
    }>;
    skillDistribution: Record<string, number>;
    averageScores: Record<string, number>;
  } | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // Load courses on component mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Load student data when course is selected
  useEffect(() => {
    if (selectedCourse) {
      loadStudentData(selectedCourse);
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const { canvasInstructorAPI } = await import('./services/api');
      const response = await canvasInstructorAPI.getInstructorCourses();
      setCourses(response.data);

      // Auto-select first course if available
      if (response.data.length > 0) {
        setSelectedCourse(response.data[0].id);
      }
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses. Please check your Canvas integration.');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentData = async (courseId: string) => {
    try {
      setLoading(true);
      setError('');

      const { instructorAPI } = await import('./services/api');
      const response = await instructorAPI.getCourseStudentAnalytics(courseId);

      // Check if we have actual student data
      if (response.data && response.data.students && response.data.students.length > 0) {
        // Transform the API response to match our new interface
        const transformedData = {
          ...response.data,
          students: response.data.students.map((student: any) => {
            // Extract top 3 skills from skillBreakdown if it exists
            let topSkills: Array<{ skill: string; score: number; level: string }> = [];

            if (student.skillBreakdown) {
              topSkills = Object.entries(student.skillBreakdown)
                .map(([skill, data]: [string, any]) => ({
                  skill,
                  score: Math.round(data.score || 0),
                  level: data.level || 'beginner'
                }))
                .sort((a, b) => b.score - a.score) // Sort by score descending
                .slice(0, 3); // Take top 3
            }

            return {
              id: student.id,
              name: student.name,
              skillsMastered: student.skillsMastered || 0,
              badgesEarned: student.badgesEarned || 0,
              riskLevel: student.riskLevel || 'medium',
              topSkills,
              skillBreakdown: student.skillBreakdown || {}
            };
          })
        };

        setStudentData(transformedData);
      } else {
        // API succeeded but no students - this means we need to set up skill matrix and assignments
        setStudentData({ students: [], skillDistribution: {}, averageScores: {} });
        setError('');
      }
    } catch (err: any) {
      console.error('Error loading student data:', err);
      setError(`Failed to load student data. ${err.response?.status === 404 ? 'No data found for this course.' : 'Please try again.'}`);
      setStudentData(null);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'medium': case 'high': return <AlertTriangle className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ucf-gold"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Student Progress Tracking</h1>
        <p className="text-gray-600">
          Monitor student skill development and progress across courses and assignments.
        </p>
      </div>

      {/* Course Selection */}
      {courses.length > 0 && (
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucf-gold"
          >
            <option value="">Choose a course...</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* No Courses */}
      {courses.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">📚</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Courses Found</h2>
          <p className="text-gray-600 mb-4">
            Make sure your Canvas instructor token is set up correctly.
          </p>
          <a
            href="/settings"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ucf-gold hover:bg-yellow-600"
          >
            Configure Canvas Token
          </a>
        </div>
      )}

      {/* Student Data Display */}
      {studentData && studentData.students.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">{studentData.students.length}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Students</p>
                  <p className="text-lg font-semibold text-gray-900">{studentData.students.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">
                      {Math.round(studentData.students.reduce((acc, s) => acc + s.skillsMastered, 0) / studentData.students.length)}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Avg Skills Mastered</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {Math.round(studentData.students.reduce((acc, s) => acc + s.skillsMastered, 0) / studentData.students.length)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold">
                      {Object.keys(studentData.skillDistribution).length}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Skills Tracked</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {Object.keys(studentData.skillDistribution).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Progress Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Student Performance Overview</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Top 3 Skills
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skills Mastered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studentData.students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {student.topSkills && student.topSkills.length > 0 ? (
                            student.topSkills.slice(0, 3).map((skill, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm text-gray-900 font-medium">{skill.skill}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-600">{skill.score}%</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${skill.level === 'advanced' ? 'bg-green-100 text-green-800' :
                                    skill.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                    {skill.level}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500 italic">No skills data yet</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="text-lg font-semibold">{student.skillsMastered}</span>
                          <span className="text-sm text-gray-500 ml-1">skills</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(student.riskLevel)}`}>
                          {getRiskIcon(student.riskLevel)}
                          {student.riskLevel}
                        </span>
                        {student.skillBreakdown && (
                          <div className="text-xs text-gray-500 mt-1">
                            {Object.keys(student.skillBreakdown).length > 0 && (
                              <span>Based on {Object.values(student.skillBreakdown).reduce((acc, skill) => acc + skill.questionsAttempted, 0)} questions</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ucf-gold"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Skill Distribution */}
          {Object.keys(studentData.skillDistribution).length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Skill Distribution</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(studentData.skillDistribution).map(([skill, count]) => (
                    <div key={skill} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">{skill}</span>
                      <span className="text-sm text-gray-600">{count} students</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div>
            <BadgesDashboard courseId={selectedCourse} />
          </div>
        </>
      )}

      {/* No Data State */}
      {selectedCourse && studentData && studentData.students.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">📊</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Student Progress Data Yet</h2>
          <p className="text-gray-600 mb-6">
            Student progress tracking requires completing the skill mapping workflow first.
          </p>

          <div className="max-w-md mx-auto bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">Complete Setup Steps:</h3>
            <div className="space-y-4 text-left">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-bold text-green-800">✓</span>
                </div>
                <div>
                  <p className="text-green-800 font-medium">Skill matrix created</p>
                  <p className="text-green-600 text-sm">Skills are defined for this course</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-bold text-blue-800">2</span>
                </div>
                <div>
                  <p className="text-blue-800 font-medium">Assign skills to quiz questions</p>
                  <p className="text-blue-600 text-sm">Map quiz questions to specific skills</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-bold text-gray-600">3</span>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Students complete assessments</p>
                  <p className="text-gray-600 text-sm">Progress data will appear automatically</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-x-4">
            <a
              href="/skill-assignment"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-ucf-gold hover:bg-yellow-600 transition-colors"
            >
              Assign Skills to Questions
            </a>
            <a
              href="/skill-matrix"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Manage Skill Matrix
            </a>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedStudent.name} - Detailed View
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedStudent(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Student Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">{selectedStudent.skillsMastered}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Skills Mastered</p>
                      <p className="text-xs text-blue-600">Advanced or Intermediate level</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-lg">{selectedStudent.badgesEarned}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-900">Badges Earned</p>
                      <p className="text-xs text-purple-600">Achievement recognition</p>
                    </div>
                  </div>
                </div>

                <div className={`rounded-lg p-4 ${selectedStudent.riskLevel === 'low' ? 'bg-green-50' :
                  selectedStudent.riskLevel === 'medium' ? 'bg-yellow-50' : 'bg-red-50'
                  }`}>
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedStudent.riskLevel === 'low' ? 'bg-green-100' :
                      selectedStudent.riskLevel === 'medium' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                      {getRiskIcon(selectedStudent.riskLevel)}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${selectedStudent.riskLevel === 'low' ? 'text-green-900' :
                        selectedStudent.riskLevel === 'medium' ? 'text-yellow-900' : 'text-red-900'
                        }`}>
                        Risk Level: {selectedStudent.riskLevel}
                      </p>
                      <p className={`text-xs ${selectedStudent.riskLevel === 'low' ? 'text-green-600' :
                        selectedStudent.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {selectedStudent.riskLevel === 'low' ? 'Performing well across most skills' :
                          selectedStudent.riskLevel === 'medium' ? 'Some areas need attention' :
                            'Multiple skills need significant improvement'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* All Skills Breakdown */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Skills Breakdown</h3>
                {selectedStudent.skillBreakdown && Object.keys(selectedStudent.skillBreakdown).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(selectedStudent.skillBreakdown).map(([skillName, skillData]: [string, any]) => (
                      <div key={skillName} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-md font-medium text-gray-900">{skillName}</h4>
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-semibold text-gray-900">{skillData.score}%</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${skillData.level === 'advanced' ? 'bg-green-100 text-green-800' :
                              skillData.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {skillData.level}
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div
                            className={`h-2 rounded-full ${skillData.score >= 80 ? 'bg-green-500' :
                              skillData.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            style={{ width: `${skillData.score}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Questions attempted: {skillData.questionsAttempted}</span>
                          <span>Correct answers: {skillData.questionsCorrect}</span>
                          <span>Accuracy: {skillData.questionsAttempted > 0 ? Math.round((skillData.questionsCorrect / skillData.questionsAttempted) * 100) : 0}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-2xl">📊</span>
                    </div>
                    <p className="text-gray-600">No detailed skill data available yet.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Skills data will appear once the student completes assessments with assigned skills.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/skill-matrix" element={
        <ProtectedRoute>
          <Layout>
            <SkillMatrixCreator />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/skill-assignment" element={
        <ProtectedRoute>
          <Layout>
            <SkillAssignmentInterface />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/progress" element={
        <ProtectedRoute>
          <Layout>
            <StudentProgress />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/badges-test" element={
        <ProtectedRoute>
          <Layout>
            <StudentBadgesTest />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App; 