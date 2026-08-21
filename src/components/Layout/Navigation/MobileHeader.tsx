import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, BookOpen } from 'lucide-react';
import AccountMenu from './AccountMenu';
import CourseSearch from './CourseSearch';
import { User } from '../../../types';

interface MobileHeaderProps {
  isNavOpen: boolean;
  onToggleNav: () => void;
  displayAsInstructor: boolean;
  canSwitchToStudentView: boolean;
  viewingAsStudent: boolean;
  user: User | null;
  onHelpClick: () => void;
  onLogout: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  isNavOpen,
  onToggleNav,
  displayAsInstructor,
  canSwitchToStudentView,
  viewingAsStudent,
  user,
  onHelpClick,
  onLogout,
}) => {
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-3 md:hidden">
        {/* Menu */}
        <button
          onClick={onToggleNav}
          className="flex flex-shrink-0 items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-au-gold"
        >
          {isNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Logo */}
        <Link
          to={displayAsInstructor ? '/' : '/student-dashboard'}
          className="flex flex-shrink-0 items-center"
        >
          <BookOpen className="h-7 w-7 text-au-gold" />
        </Link>

        {/* Search */}
        <CourseSearch variant="mobile" displayAsInstructor={displayAsInstructor} />

        {/* Profile */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowAccountMenu((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-au-gold text-sm font-semibold text-gray-900"
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'S'}
          </button>

          {showAccountMenu && (
            <div className="absolute right-0 top-full z-50 w-56 pt-2">
              <AccountMenu
                user={user}
                displayAsInstructor={displayAsInstructor}
                canSwitchToStudentView={canSwitchToStudentView}
                viewingAsStudent={viewingAsStudent}
                onHelpClick={onHelpClick}
                onLogout={onLogout}
                onItemClick={() => setShowAccountMenu(false)}
                showIdentity
              />
            </div>
          )}
        </div>
      </div>

      {/* Backdrop to close the account menu on outside tap */}
      {showAccountMenu && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowAccountMenu(false)} />
      )}
    </>
  );
};

export default MobileHeader;
