import { getNavigationItems } from './navigationItems';

describe('getNavigationItems', () => {
  test('returns the instructor item set, in order', () => {
    const items = getNavigationItems(true);
    expect(items.map((item) => ({ name: item.name, href: item.href }))).toEqual([
      { name: 'Dashboard', href: '/' },
      { name: 'Skill Matrix', href: '/skill-matrix' },
      { name: 'Skill Assignment', href: '/skill-assignment' },
      { name: 'Student Progress', href: '/progress' },
    ]);
  });

  test('returns the student item set, in order', () => {
    const items = getNavigationItems(false);
    expect(items.map((item) => ({ name: item.name, href: item.href }))).toEqual([
      { name: 'Dashboard', href: '/student-dashboard' },
      { name: 'Courses', href: '/courses' },
      { name: 'Skills', href: '/skills' },
      { name: 'Badges', href: '/badges' },
    ]);
  });

  test('every item exposes an icon component', () => {
    [...getNavigationItems(true), ...getNavigationItems(false)].forEach((item) => {
      expect(item.icon).toBeDefined();
    });
  });
});
