import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, HelpCircle, LogOut, ChevronDown } from 'lucide-react';
import { User } from '../../../types';

interface UserMenuProps {
  user: User | null;
  displayAsInstructor: boolean;
  onHelpClick: () => void;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  user,
  displayAsInstructor,
  onHelpClick,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowUserMenu(true)}
      onMouseLeave={() => setShowUserMenu(false)}
    >
      {/* User Button */}
      <button className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-gray-50">
        {/* Avatar */}
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-au-gold text-sm font-semibold text-gray-900">
          {user?.name?.charAt(0)?.toUpperCase() || 'S'}
        </div>

        {/* Name + Role */}
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-sm font-semibold text-gray-900">
            {user?.name || user?.email || 'User'}
          </p>

          <p className="text-[11px] text-gray-400">
            {displayAsInstructor ? 'Instructor' : 'Student'}
          </p>
        </div>

        {/* Arrow */}
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {showUserMenu && (
        <div className="absolute right-0 top-full z-50 w-52 pt-2">
          <div className="rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
            {/* Settings */}
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>

            {/* How It Works - Instructor only */}
            {displayAsInstructor && (
              <button
                onClick={() => {
                  onHelpClick();
                  setShowUserMenu(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <HelpCircle className="h-4 w-4" />
                How It Works
              </button>
            )}

            {/* Divider */}
            <div className="my-1 border-t border-gray-100" />

            {/* Logout */}
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
