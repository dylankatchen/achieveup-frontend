import React, { ReactNode } from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="min-h-screen bg-gray-50 pt-[72px] md:ml-[230px]">
        <div className="w-full px-6 py-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
