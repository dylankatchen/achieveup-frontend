import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, HelpCircle, LogOut, ArrowLeftRight } from 'lucide-react';
import { User } from '../../../types';

interface AccountMenuProps {
  user?: User | null;
  displayAsInstructor: boolean;
  canSwitchToStudentView?: boolean;
  viewingAsStudent?: boolean;
  onHelpClick: () => void;
  onLogout: () => void;
  onItemClick?: () => void;
  showIdentity?: boolean;
}

const AccountMenu: React.FC<AccountMenuProps> = ({
  user,
  displayAsInstructor,
  canSwitchToStudentView,
  viewingAsStudent,
  onHelpClick,
  onLogout,
  onItemClick,
  showIdentity,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
      {showIdentity && (
        <>
          <div className="px-4 py-2.5">
            <p className="truncate text-sm font-semibold text-gray-900">
              {user?.name || user?.email || 'User'}
            </p>
            <p className="text-xs text-gray-400">{displayAsInstructor ? 'Instructor' : 'Student'}</p>
          </div>

          <div className="my-1 border-t border-gray-100" />
        </>
      )}

      {/* Switch View */}
      {canSwitchToStudentView && (
        <Link
          to={viewingAsStudent ? '/instructor-dashboard' : '/student-dashboard'}
          onClick={onItemClick}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowLeftRight className="h-4 w-4" />
          {viewingAsStudent ? 'Back to Instructor' : 'View as Student'}
        </Link>
      )}

      {/* Settings */}
      <Link
        to="/settings"
        onClick={onItemClick}
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
            onItemClick?.();
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
        onClick={() => {
          onLogout();
          onItemClick?.();
        }}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  );
};

export default AccountMenu;
