import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Target, Users, Settings, LogOut, User, Wifi, WifiOff, HelpCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const { user, logout, backendAvailable } = useAuth();
  const location = useLocation();

  const navigationItems: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Skill Matrix', href: '/skill-matrix', icon: Target },
    { name: 'Skill Assignment', href: '/skill-assignment', icon: Target },
    { name: 'Student Progress', href: '/progress', icon: Users },
  ];

  const handleLogout = (): void => {
    logout();
  };

  return (
    <nav className="bg-ucf-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-ucf-gold rounded-lg flex items-center justify-center">
                <span className="text-ucf-black font-bold text-lg">A</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">AchieveUp</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-4 lg:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${isActive
                      ? 'border-ucf-gold text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                  >
                    <Icon className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="hidden lg:inline">{item.name}</span>
                    <span className="lg:hidden">{item.name.split(' ')[0]}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <div className="hidden md:flex items-center space-x-6">
              {/* Backend Status Indicator */}
              <div className="flex items-center space-x-1">
                {backendAvailable ? (
                  <div className="relative group">
                    <Wifi className="w-4 h-4 text-green-500" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Backend connected
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Backend unavailable
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-ucf-gold bg-ucf-gold bg-opacity-10 px-2 py-1 rounded-full">
                  Instructor
                </span>
              </div>
              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 flex-shrink-0"
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                <span className="hidden lg:inline">How It Works</span>
              </button>
              <Link
                to="/settings"
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 flex-shrink-0"
              >
                <Settings className="w-4 h-4 mr-1" />
                <span className="hidden lg:inline">Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 flex-shrink-0"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ucf-gold"
              >
                {isOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-ucf-white border-t border-gray-200">
            {/* Mobile Backend Status */}
            <div className="flex items-center px-3 py-2">
              {backendAvailable ? (
                <div className="flex items-center">
                  <Wifi className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-600">Backend connected</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <WifiOff className="w-5 h-5 text-red-500 mr-3" />
                  <span className="text-sm text-gray-600">Backend unavailable</span>
                </div>
              )}
            </div>

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive
                    ? 'bg-ucf-gold bg-opacity-10 text-ucf-black'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}

            {/* Mobile User Info */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center px-3 py-2">
                <User className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <div className="text-sm text-gray-700">
                    {user?.name || user?.email || 'Instructor'}
                  </div>
                  <div className="text-xs text-ucf-gold">Instructor Portal</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowHelpModal(true);
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
              >
                <HelpCircle className="w-5 h-5 mr-3" />
                How It Works
              </button>
              <Link
                to="/settings"
                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-5 h-5 mr-3" />
                Settings
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                How AchieveUp Works
              </h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-8">
                {/* Overview */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Overview</h3>
                  <p className="text-gray-600 leading-relaxed">
                    AchieveUp transforms traditional assessment into a comprehensive skill tracking system.
                    Instead of just seeing grades, you get detailed insights into what specific skills
                    each student has mastered and where they need support.
                  </p>
                </div>

                {/* Step by Step Process */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">The Process</h3>

                  <div className="space-y-6">
                    {/* Step 1: Skills */}
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-blue-600 font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-2">Define Skills for Your Course</h4>
                        <p className="text-gray-600 mb-3">
                          Start by creating a <strong>Skill Matrix</strong> that defines what specific skills students
                          should learn in your course. For example, in a web development course, skills might include
                          "HTML/CSS Fundamentals," "JavaScript Programming," or "Responsive Design."
                        </p>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <strong>AI-Powered:</strong> Our system can automatically suggest relevant skills
                            based on your course name and description, saving you time.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Assignment */}
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-green-600 font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-2">Assign Skills to Quiz Questions</h4>
                        <p className="text-gray-600 mb-3">
                          Next, you map your existing Canvas quiz questions to specific skills. This tells the system
                          which skills each question is testing. A single question can test multiple skills, and
                          multiple questions can test the same skill.
                        </p>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-sm text-green-800">
                            <strong>Smart Assignment:</strong> Our AI analyzes your questions and suggests
                            which skills they're testing, making this process much faster.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Student Progress */}
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-purple-600 font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-2">Students Take Assessments</h4>
                        <p className="text-gray-600 mb-3">
                          When students complete quizzes in Canvas, AchieveUp automatically analyzes their responses
                          and calculates their mastery level for each skill. No extra work required from students
                          or instructors!
                        </p>
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-sm text-purple-800">
                            <strong>Automatic Tracking:</strong> Progress updates happen in real-time as
                            students complete assessments.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Understanding Results */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Understanding Student Progress</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Skill Levels</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 mr-2">Beginner</span>
                          <span className="text-gray-600">0-60% accuracy</span>
                        </div>
                        <div className="flex items-center">
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 mr-2">Intermediate</span>
                          <span className="text-gray-600">61-80% accuracy</span>
                        </div>
                        <div className="flex items-center">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 mr-2">Advanced</span>
                          <span className="text-gray-600">81-100% accuracy</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Risk Levels</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 mr-2">Low Risk</span>
                          <span className="text-gray-600">Performing well overall</span>
                        </div>
                        <div className="flex items-center">
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 mr-2">Medium Risk</span>
                          <span className="text-gray-600">Some areas need attention</span>
                        </div>
                        <div className="flex items-center">
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 mr-2">High Risk</span>
                          <span className="text-gray-600">Multiple skills need improvement</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Benefits for Instructors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-ucf-gold rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Identify Struggling Students</p>
                        <p className="text-xs text-gray-600">See which students need help before it's too late</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-ucf-gold rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Target Interventions</p>
                        <p className="text-xs text-gray-600">Know exactly which skills each student needs to work on</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-ucf-gold rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Improve Course Design</p>
                        <p className="text-xs text-gray-600">See which skills the class struggles with most</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-ucf-gold rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Evidence-Based Teaching</p>
                        <p className="text-xs text-gray-600">Make informed decisions based on concrete skill data</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Getting Started */}
                <div className="bg-ucf-gold bg-opacity-10 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Ready to Get Started?</h3>
                  <p className="text-gray-700 mb-4">
                    The best way to understand AchieveUp is to try it! Start by creating a skill matrix
                    for one of your courses, then assign skills to a few quiz questions.
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setShowHelpModal(false);
                        window.location.href = '/skill-matrix';
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ucf-gold hover:bg-yellow-600"
                    >
                      Create Skill Matrix
                    </button>
                    <button
                      onClick={() => {
                        setShowHelpModal(false);
                        window.location.href = '/skill-assignment';
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Assign Skills
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation; 