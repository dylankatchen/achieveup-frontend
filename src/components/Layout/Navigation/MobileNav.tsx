import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, User as UserIcon, ArrowLeftRight, HelpCircle, Settings, LogOut } from 'lucide-react';
import NavLinks from './NavLinks';
import { NavigationItem } from './types';
import { User } from '../../../types';

interface MobileNavProps {
  user: User | null;
  displayAsInstructor: boolean;
  navigationItems: NavigationItem[];
  currentPath: string;
  canSwitchToStudentView: boolean;
  viewingAsStudent: boolean;
  onClose: () => void;
  onHelpClick: () => void;
  onLogout: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({
  user,
  displayAsInstructor,
  navigationItems,
  currentPath,
  canSwitchToStudentView,
  viewingAsStudent,
  onClose,
  onHelpClick,
  onLogout,
}) => {
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      {/* Background overlay */}

      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Mobile sidebar */}

      <div className="absolute left-0 top-0 h-full w-[280px] bg-white shadow-xl">
        {/* Mobile logo */}

        <div className="flex h-[72px] items-center border-b border-gray-200 px-6">
          <Link
            to={displayAsInstructor ? '/' : '/student-dashboard'}
            className="flex items-center gap-3"
            onClick={onClose}
          >
            <BookOpen className="h-8 w-8 text-au-gold" />

            <span className="text-xl font-bold text-gray-900">AchieveUp</span>
          </Link>
        </div>

        <div className="p-4">
          {/* Navigation */}

          <NavLinks items={navigationItems} currentPath={currentPath} variant="mobile" onNavigate={onClose} />

          {/* Mobile More */}

          <div className="mt-6 border-t border-gray-200 pt-5">
            <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">More</p>

            {/* User */}

            <div className="flex items-center px-4 py-3">
              <UserIcon className="mr-3 h-5 w-5 text-gray-500" />

              <div>
                <div className="text-sm text-gray-700">{user?.name || user?.email || 'Student'}</div>

                <div className="text-xs text-au-gold-dark">
                  {displayAsInstructor ? 'Instructor Portal' : 'Student Portal'}
                </div>
              </div>
            </div>

            {/* Switch */}

            {canSwitchToStudentView && (
              <Link
                to={viewingAsStudent ? '/instructor-dashboard' : '/student-dashboard'}
                className="flex w-full items-center rounded-lg px-4 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                onClick={onClose}
              >
                <ArrowLeftRight className="mr-3 h-5 w-5" />

                {viewingAsStudent ? 'Back to Instructor' : 'Switch to Student'}
              </Link>
            )}

            {/* How It Works */}

            <button
              onClick={() => {
                onHelpClick();
                onClose();
              }}
              className="flex w-full items-center rounded-lg px-4 py-3 text-left text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <HelpCircle className="mr-3 h-5 w-5" />
              How It Works
            </button>

            {/* Settings */}

            <Link
              to="/settings"
              className="flex w-full items-center rounded-lg px-4 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              onClick={onClose}
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Link>

            {/* Logout */}

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="flex w-full items-center rounded-lg px-4 py-3 text-left text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
