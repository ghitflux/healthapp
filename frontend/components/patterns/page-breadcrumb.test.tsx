import { render, screen } from '@testing-library/react';
import { PageBreadcrumb } from '@/components/patterns/page-breadcrumb';

jest.mock('next/navigation', () => ({
  usePathname: () => '/convenio/dashboard',
}));

describe('PageBreadcrumb', () => {
  it('renders separators as sibling list items instead of nesting li elements', () => {
    const { container } = render(
      <PageBreadcrumb
        items={[
          { label: 'Painel', href: '/convenio/dashboard' },
          { label: 'Dashboard' },
        ]}
      />
    );

    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();

    const list = container.querySelector('ol');
    expect(list).not.toBeNull();

    const topLevelItems = list?.querySelectorAll(':scope > li');
    expect(topLevelItems).toHaveLength(3);

    const nestedListItem = list?.querySelector('li li');
    expect(nestedListItem).toBeNull();
  });
});
