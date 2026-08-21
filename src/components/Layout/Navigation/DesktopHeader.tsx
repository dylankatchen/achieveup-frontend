import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import UserMenu from './UserMenu';
import CourseSearch from './CourseSearch';
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
        <CourseSearch variant="desktop" displayAsInstructor={displayAsInstructor} />
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
