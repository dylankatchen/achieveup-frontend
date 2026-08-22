import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Award,
  Home,
  Settings,
  HelpCircle,
  Search,
  ChevronDown,
  LogOut,
  ArrowLeftRight,
  Target,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface StudentPortalLayoutProps {
  children: ReactNode;
}

const ComingSoonNavItem: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}> = ({ icon: Icon, label }) => (
  <button
    type="button"
    disabled
    title="Coming soon"
    className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-gray-300"
  >
    <Icon className="h-[17px] w-[17px] flex-shrink-0" />
    {label}
  </button>
);

const StudentPortalLayout: React.FC<StudentPortalLayoutProps> = ({ children }) => {
  const { user, logout, isInstructor } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // An instructor account whose Canvas token also validates as a student
  // enrollment can land here via the "view as student" toggle in the
  // instructor dashboard; give them a way back.
  const canReturnToInstructor = isInstructor && !!user?.has_student_access;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = (user?.name || user?.email || 'S')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-au-bg">
      <header className="sticky top-0 z-10 flex items-center gap-6 border-b border-gray-200 bg-white px-6 py-3">
        <Link to="/student-dashboard" className="flex flex-shrink-0 items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-au-gold text-gray-900">
            <BookOpen className="h-[18px] w-[18px]" />
          </div>
          <span className="text-[19px] font-bold tracking-tight text-gray-900">AchieveUp</span>
        </Link>

        <div className="relative ml-auto w-80 flex-shrink">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search skills, courses, or badges..."
            className="w-full rounded-[10px] border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2.5 rounded-lg p-1 pr-1.5 hover:bg-gray-50"
          >
            <div className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-gradient-to-br from-au-gold to-au-gold-light text-[13px] font-semibold text-gray-900">
              {initials}
            </div>
            <div className="hidden text-left leading-tight sm:block">
              <div className="text-sm font-semibold text-gray-900">{user?.name || 'Student'}</div>
              <div className="text-xs text-gray-400">Student</div>
            </div>
            <ChevronDown className="h-[15px] w-[15px] text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 text-gray-400" />
                Settings
              </Link>
              {canReturnToInstructor && (
                <Link
                  to="/instructor-dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                  Back to Instructor
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[15.5rem_1fr] items-start">
        <aside className="sticky top-[3.6rem] flex h-[calc(100vh-3.6rem)] flex-col gap-6 border-r border-gray-200 bg-white px-3.5 py-5">
          <nav className="flex flex-col gap-1">
            <Link
              to="/student-dashboard"
              className="flex items-center gap-2.5 rounded-lg bg-au-gold-light px-2.5 py-2 text-sm font-semibold text-au-gold-dark"
            >
              <Home className="h-[17px] w-[17px] flex-shrink-0" />
              Dashboard
            </Link>
            <ComingSoonNavItem icon={BookOpen} label="Courses" />
            <ComingSoonNavItem icon={Target} label="Skills" />
            <ComingSoonNavItem icon={Award} label="Badges" />
          </nav>

          <div className="flex-1" />

          <nav className="flex flex-col gap-1">
            <Link
              to="/settings"
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            >
              <Settings className="h-[17px] w-[17px] flex-shrink-0" />
              Settings
            </Link>
            <ComingSoonNavItem icon={HelpCircle} label="Help" />
          </nav>
        </aside>

        <main className="flex min-w-0 flex-col gap-5 px-8 py-7">{children}</main>
      </div>
    </div>
  );
};

export default StudentPortalLayout;
