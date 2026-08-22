import { Home, BookOpen, Sparkles, Award } from 'lucide-react';
import { NavigationItem } from './types';

const instructorNavigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    name: 'Skill Matrix',
    href: '/skill-matrix',
    icon: Sparkles,
  },
  {
    name: 'Skill Assignment',
    href: '/skill-assignment',
    icon: BookOpen,
  },
  {
    name: 'Student Progress',
    href: '/progress',
    icon: Award,
  },
];

const studentNavigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/student-dashboard',
    icon: Home,
  },
  {
    name: 'Courses',
    href: '/courses',
    icon: BookOpen,
  },
  {
    name: 'Skills',
    href: '/skills',
    icon: Sparkles,
  },
  {
    name: 'Badges',
    href: '/badges',
    icon: Award,
  },
];

export function getNavigationItems(displayAsInstructor: boolean): NavigationItem[] {
  return displayAsInstructor ? instructorNavigationItems : studentNavigationItems;
}
