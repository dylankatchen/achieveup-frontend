import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import AccountMenu from './AccountMenu';
import { User } from '../../../types';

interface UserMenuProps {
  user: User | null;
  displayAsInstructor: boolean;
  onHelpClick: () => void;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, displayAsInstructor, onHelpClick, onLogout }) => {
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
          <p className="text-sm font-semibold text-gray-900">{user?.name || user?.email || 'User'}</p>

          <p className="text-[11px] text-gray-400">{displayAsInstructor ? 'Instructor' : 'Student'}</p>
        </div>

        {/* Arrow */}
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {showUserMenu && (
        <div className="absolute right-0 top-full z-50 w-52 pt-2">
          <AccountMenu
            displayAsInstructor={displayAsInstructor}
            onHelpClick={onHelpClick}
            onLogout={onLogout}
            onItemClick={() => setShowUserMenu(false)}
          />
        </div>
      )}
    </div>
  );
};

export default UserMenu;
