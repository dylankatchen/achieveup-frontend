import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Search } from 'lucide-react';
import UserMenu from './UserMenu';
import { User } from '../../../types';

interface DesktopHeaderProps {
  user: User | null;
  displayAsInstructor: boolean;
  canSwitchToStudentView: boolean;
  viewingAsStudent: boolean;
  onHelpClick: () => void;
  onLogout: () => void;
}

const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  user,
  displayAsInstructor,
  canSwitchToStudentView,
  viewingAsStudent,
  onHelpClick,
  onLogout,
}) => {
  return (
    <header className="fixed left-[230px] right-0 top-0 z-30 flex h-[72px] items-center border-b border-gray-200 bg-white px-8">
      {/* search */}

      <div className="flex flex-1 justify-center">
        <div className="relative w-full max-w-[500px]">
          <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            placeholder="Search skills, courses, or assignments..."
            className="h-[42px] w-full rounded-lg border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-au-gold focus:ring-1 focus:ring-au-gold"
          />
        </div>
      </div>

      {/* Header Right side */}
      <div className="ml-auto flex items-center gap-5">
        {/* Switch View */}
        {canSwitchToStudentView && (
          <Link
            to={viewingAsStudent ? '/instructor-dashboard' : '/student-dashboard'}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeftRight className="h-[18px] w-[18px]" />

            <span className="hidden lg:inline">
              {viewingAsStudent ? 'Back to Instructor' : 'View as Student'}
            </span>
          </Link>
        )}

        <UserMenu
          user={user}
          displayAsInstructor={displayAsInstructor}
          onHelpClick={onHelpClick}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
};

export default DesktopHeader;
