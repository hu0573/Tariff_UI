
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarNew } from './SidebarNew';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

describe('SidebarNew', () => {
  const defaultProps = {
    activeSection: 'tables-charts',
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
  };

  const renderSidebar = (props = defaultProps) => {
    return render(
      <BrowserRouter>
        <SidebarNew {...props} />
      </BrowserRouter>
    );
  };

  it('renders the active section title', () => {
    renderSidebar();
    expect(screen.getByText('Tables & Charts')).toBeInTheDocument();
  });

  it('renders items for the active section', () => {
    renderSidebar();
    expect(screen.getByText('NMI Data Viewer')).toBeInTheDocument();
    expect(screen.getByText('Power Factor Profile')).toBeInTheDocument();
  });

  it('does not render items from other sections', () => {
    renderSidebar();
    expect(screen.queryByText('Pricing Scheme')).not.toBeInTheDocument();
  });

  it('collapses correctly', () => {
    renderSidebar({ ...defaultProps, isCollapsed: true });
    // Should show expand button
    expect(screen.getByTitle('Expand menu')).toBeInTheDocument();
    // Should not show title
    expect(screen.queryByText('Tables & Charts')).not.toBeInTheDocument();
  });

  it('calls onToggleCollapse when expand button is clicked', () => {
    const onToggle = vi.fn();
    renderSidebar({ ...defaultProps, isCollapsed: true, onToggleCollapse: onToggle });
    
    fireEvent.click(screen.getByTitle('Expand menu'));
    expect(onToggle).toHaveBeenCalled();
  });
});
