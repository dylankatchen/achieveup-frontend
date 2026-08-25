import React from 'react';
import { CanvasCourse } from '../../../types';

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Shared course-list state, fetched once in Navigation/index.tsx and passed
// down to both the desktop and mobile header's CourseSearch instance so they
// don't each independently fetch the same list.
export interface CourseSearchState {
  courses: CanvasCourse[];
  loading: boolean;
  error: boolean;
  ensureLoaded: () => void;
}
