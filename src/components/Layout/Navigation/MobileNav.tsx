import React from 'react';
import NavLinks from './NavLinks';
import { NavigationItem } from './types';

interface MobileNavProps {
  navigationItems: NavigationItem[];
  currentPath: string;
  onClose: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ navigationItems, currentPath, onClose }) => {
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      {/* Background overlay */}

      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Mobile sidebar - starts below the fixed mobile header */}

      <div className="absolute left-0 top-16 h-[calc(100%-4rem)] w-[280px] overflow-y-auto bg-white shadow-xl">
        <div className="p-4">
          <NavLinks items={navigationItems} currentPath={currentPath} variant="mobile" onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
