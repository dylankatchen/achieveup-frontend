import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getNavigationItems } from './navigationItems';
import DesktopSidebar from './DesktopSidebar';
import DesktopHeader from './DesktopHeader';
import MobileHeader from './MobileHeader';
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

      {/* mobile header: menu on the left, search, profile on the right */}

      <MobileHeader
        isNavOpen={isOpen}
        onToggleNav={() => setIsOpen(!isOpen)}
        displayAsInstructor={displayAsInstructor}
        canSwitchToStudentView={canSwitchToStudentView}
        viewingAsStudent={viewingAsStudent}
        user={user}
        onHelpClick={() => setShowHelpModal(true)}
        onLogout={handleLogout}
      />

      {/* mobile navigation drawer */}

      {isOpen && (
        <MobileNav
          navigationItems={navigationItems}
          currentPath={location.pathname}
          onClose={() => setIsOpen(false)}
        />
      )}

      {/* how it works Modal*/}

      {showHelpModal && <HowItWorksModal onClose={() => setShowHelpModal(false)} />}
    </nav>
  );
};

export default Navigation;
