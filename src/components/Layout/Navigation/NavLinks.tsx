import React from 'react';
import { Link } from 'react-router-dom';
import { NavigationItem } from './types';

interface NavLinksProps {
  items: NavigationItem[];
  currentPath: string;
  variant: 'desktop' | 'mobile';
  onNavigate?: () => void;
}

const NavLinks: React.FC<NavLinksProps> = ({ items, currentPath, variant, onNavigate }) => {
  const isDesktop = variant === 'desktop';

  const links = items.map((item) => {
    const Icon = item.icon;
    const isActive = currentPath === item.href;

    return (
      <Link
        key={item.name}
        to={item.href}
        onClick={onNavigate}
        className={
          isDesktop
            ? `flex h-[42px] items-center gap-4 rounded-lg px-4 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-au-gold-light text-au-gold-dark'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            : `flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                isActive
                  ? 'bg-au-gold-light text-au-gold-dark'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
        }
      >
        <Icon className={isDesktop ? 'h-[18px] w-[18px] flex-shrink-0' : 'mr-3 h-5 w-5'} />
        <span>{item.name}</span>
      </Link>
    );
  });

  return isDesktop ? <nav className="space-y-2">{links}</nav> : <div className="space-y-1">{links}</div>;
};

export default NavLinks;
