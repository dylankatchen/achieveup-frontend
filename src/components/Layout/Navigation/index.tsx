import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { getNavigationItems } from './navigationItems';
import DesktopSidebar from './DesktopSidebar';
import DesktopHeader from './DesktopHeader';
import MobileNav from './MobileNav';
import HowItWorksModal from './HowItWorksModal';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const { user, logout, isInstructor } = useAuth();

  const location = useLocation();

  // Instructor accounts with student access can switch between views
  const canSwitchToStudentView = isInstructor && !!user?.has_student_access;

  // Determine which dashboard is currently being viewed
  const viewingAsStudent = canSwitchToStudentView && location.pathname.startsWith('/student-dashboard');

  const displayAsInstructor = isInstructor && !viewingAsStudent;

  const navigationItems = getNavigationItems(displayAsInstructor);

  const handleLogout = (): void => {
    logout();
  };

  return (
    <nav className="bg-[#F7F6F2]">
      {/* desktop layout*/}

      <div className="hidden md:block">
        <DesktopSidebar
          displayAsInstructor={displayAsInstructor}
          navigationItems={navigationItems}
          currentPath={location.pathname}
          onHelpClick={() => setShowHelpModal(true)}
          onLogout={handleLogout}
        />

        <DesktopHeader
          user={user}
          displayAsInstructor={displayAsInstructor}
          canSwitchToStudentView={canSwitchToStudentView}
          viewingAsStudent={viewingAsStudent}
          onHelpClick={() => setShowHelpModal(true)}
          onLogout={handleLogout}
        />
      </div>

      {/* mobile menu button */}

      <div className="fixed right-4 top-4 z-50 md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-au-gold"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* mobile navigation */}

      {isOpen && (
        <MobileNav
          user={user}
          displayAsInstructor={displayAsInstructor}
          navigationItems={navigationItems}
          currentPath={location.pathname}
          canSwitchToStudentView={canSwitchToStudentView}
          viewingAsStudent={viewingAsStudent}
          onClose={() => setIsOpen(false)}
          onHelpClick={() => setShowHelpModal(true)}
          onLogout={handleLogout}
        />
      )}

      {/* how it works Modal*/}

      {showHelpModal && <HowItWorksModal onClose={() => setShowHelpModal(false)} />}
    </nav>
  );
};

export default Navigation;
