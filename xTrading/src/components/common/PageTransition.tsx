import React from 'react';
import usePageTransition from '@/hooks/usePageTransition';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const { shouldRender, className: transitionClass } = usePageTransition(true);

  if (!shouldRender) return null;

  return (
    <div className={`animate-fade-in ${transitionClass} ${className}`}>
      {children}
    </div>
  );
};

export default PageTransition;
