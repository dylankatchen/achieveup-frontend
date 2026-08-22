import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, HelpCircle, LogOut } from 'lucide-react';
import NavLinks from './NavLinks';
import { NavigationItem } from './types';

interface DesktopSidebarProps {
  displayAsInstructor: boolean;
  navigationItems: NavigationItem[];
  currentPath: string;
  onHelpClick: () => void;
  onLogout: () => void;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  displayAsInstructor,
  navigationItems,
  currentPath,
  onHelpClick,
  onLogout,
}) => {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[230px] flex-col border-r border-gray-200 bg-white">
      {/* logo */}

      <div className="flex h-[72px] items-center border-b border-gray-200 px-7">
        <Link to={displayAsInstructor ? '/' : '/student-dashboard'} className="flex items-center gap-3">
          <BookOpen className="h-9 w-9 text-au-gold" />

          <span className="text-[23px] font-bold tracking-tight text-gray-900">AchieveUp</span>
        </Link>
      </div>

      {/* main side bar */}

      <div className="flex flex-1 flex-col px-5 py-6">
        <NavLinks items={navigationItems} currentPath={currentPath} variant="desktop" />

        <div className="mt-7 border-t border-gray-200 pt-5">
          {displayAsInstructor && (
            <button
              onClick={onHelpClick}
              className="flex h-[42px] w-full items-center gap-4 rounded-lg px-4 text-left text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <HelpCircle className="h-[18px] w-[18px]" />
              <span>How It Works</span>
            </button>
          )}

          {/* Logout */}

          <button
            onClick={onLogout}
            className="mt-2 flex h-[42px] w-full items-center gap-4 rounded-lg px-4 text-left text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-[18px] w-[18px]" />

            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
