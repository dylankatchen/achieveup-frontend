import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { canvasAPI } from '../services/api';
import { CanvasCourse } from '../types';
import { toast } from 'react-hot-toast';
import Card from '../components/common/Card';
import {
  Home,
  Award,
  Target,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Settings,
  Clock,
} from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [coursesError, setCoursesError] = useState(false);
  const [loading, setLoading] = useState(true);

  // A Canvas API token is mandatory at signup, so every account reaching this
  // dashboard is guaranteed to have one — but that doesn't guarantee Canvas
  // itself is reachable right now, so a fetch failure is tracked separately
  // from "the token has no courses."
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // canvasAPI.getCourses() is token-type-agnostic — it just returns whatever
      // courses the stored token has access to.
      const response = await canvasAPI.getCourses();
      setCourses(response.data);
      setCoursesError(false);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Could not load courses from Canvas. Please try refreshing.');
      setCourses([]);
      setCoursesError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
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
      {/* Welcome Section */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {user?.name || 'Student'}!
          </h1>
          <p className="text-gray-600 mt-2">Track your courses and skill progress in one place.</p>
        </div>

        {/* Status Indicators */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-current rounded-full mr-2"></div>
              Student Dashboard
            </div>
          </div>
          {coursesError ? (
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <AlertTriangle className="w-3 h-3 mr-1 inline" />
              Canvas Connection Issue
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1 inline" />
              Canvas Connected
            </div>
          )}
          {courses.length > 0 && (
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <BookOpen className="w-3 h-3 mr-1 inline" />
              {courses.length} Course{courses.length !== 1 ? 's' : ''} Loaded
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
            <Home className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{courses.length}</div>
          <div className="text-sm text-gray-600">Active Courses</div>
          <div className="text-xs text-gray-500 mt-1">From Canvas LMS</div>
        </Card>

        <Card className="text-center opacity-75">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-400">—</div>
          <div className="text-sm text-gray-600">Skills Mastered</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center">
            <Clock className="w-3 h-3 mr-1" />
            Coming soon
          </div>
        </Card>

        <Card className="text-center opacity-75">
          <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-4">
            <Award className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-400">—</div>
          <div className="text-sm text-gray-600">Badges Earned</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center">
            <Clock className="w-3 h-3 mr-1" />
            Coming soon
          </div>
        </Card>
      </div>

      {/* My Courses */}
      <Card title="My Courses" className="mb-8">
        {coursesError ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-10 h-10 text-red-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Couldn't load your courses from Canvas</p>
            <p className="text-sm text-gray-500 mt-1">Please try refreshing the page.</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No courses found in Canvas.</div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mr-4">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{course.name}</p>
                    <p className="text-sm text-gray-500">{course.code}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Skill Progress — placeholder, not fabricated data */}
      <Card title="Skill Progress & Badges" className="mb-8">
        <div className="text-center py-8">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            Skill tracking is being connected to your account
          </p>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Your skill mastery and badges will appear here once your account is linked to your
            Canvas activity. Check back soon.
          </p>
        </div>
      </Card>

      {/* Settings shortcut */}
      <div className="flex justify-end">
        <Link
          to="/settings"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-4 h-4 mr-2" />
          Manage Canvas Token
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
