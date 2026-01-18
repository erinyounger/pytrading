import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { cn } from '@/utils/cn';

interface LayoutProps {
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ className }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className={cn('layout min-h-screen bg-[var(--bg-primary)]', className)}>
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-50 md:relative md:z-auto">
        <Sidebar
          collapsed={sidebarCollapsed}
          className={cn(
            'transition-all duration-300',
            'md:translate-x-0',
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          )}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto custom-scrollbar">
          <div className="page-container animate-fade-in">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
