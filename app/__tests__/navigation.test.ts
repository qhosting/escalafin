import { filterNavigation, getActiveNavHref, getNavigation, getPrimaryNavItems } from '@/lib/navigation';

describe('navigation', () => {
  const enabled = () => true;
  it('keeps one role aware tree for desktop and mobile primaries', () => {
    const nav = getNavigation('ADMIN');
    expect(nav.flatMap(s => s.groups).flatMap(g => g.items).some(i => i.href === '/admin/storage')).toBe(true);
    expect(getPrimaryNavItems('ADMIN', enabled)).toHaveLength(4);
  });
  it('selects the most specific active route', () => {
    const nav = filterNavigation(getNavigation('ADMIN'), enabled);
    expect(getActiveNavHref('/admin/payments/transactions', nav)).toBe('/admin/payments/transactions');
  });
});
