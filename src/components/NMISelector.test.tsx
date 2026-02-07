
import { render, screen, fireEvent } from '@testing-library/react';
import { NMISelector, NMIItem } from './NMISelector';
import { vi } from 'vitest';

const mockNMIs: NMIItem[] = [
  {
    nmi: '20010000001',
    name: 'Site A',
    description: 'Main Site',
    address: '123 Main St',
    suburb: 'Adelaide',
    state: 'SA',
    postcode: '5000',
  },
  {
    nmi: '20010000002',
    name: 'Site B',
    description: 'Backup Site',
    address: '456 Side St',
    suburb: 'Norwood',
    state: 'SA',
    postcode: '5067',
  },
];

describe('NMISelector', () => {
  it('renders correctly with default state', () => {
    render(<NMISelector nmis={mockNMIs} onChange={vi.fn()} />);
    expect(screen.getByText('-- Select NMI --')).toBeInTheDocument();
  });

  it('renders selected NMI correctly', () => {
    render(<NMISelector nmis={mockNMIs} value="20010000001" onChange={vi.fn()} />);
    const button = screen.getByRole('button');
    // Format logic: 2001000000-(1)
    expect(button).toHaveTextContent('2001000000-(1)');
  });

  it('filters items based on search', async () => {
    render(<NMISelector nmis={mockNMIs} onChange={vi.fn()} />);
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'));
    
    // Type in search
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Backup' } });
    
    // Expect Site B to be visible and Site A to be hidden logic (or filtered out)
    expect(screen.getByText('Site B')).toBeInTheDocument();
    expect(screen.queryByText('Site A')).not.toBeInTheDocument();
  });

  it('calls onChange when an item is selected', () => {
    const handleChange = vi.fn();
    render(<NMISelector nmis={mockNMIs} onChange={handleChange} />);
    
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Site A'));
    
    expect(handleChange).toHaveBeenCalledWith('20010000001');
  });

  it('shows loading state', () => {
    render(<NMISelector nmis={[]} isLoading={true} onChange={vi.fn()} />);
    expect(screen.getByText('Loading NMI list...')).toBeInTheDocument();
  });

  it('shows empty state message when no NMIs and not loading', () => {
    render(<NMISelector nmis={[]} isLoading={false} onChange={vi.fn()} />);
    expect(screen.getByText('No NMIs available. Please refresh the list.')).toBeInTheDocument();
  });

  it('displays detailed info for selected NMI', () => {
     render(<NMISelector nmis={mockNMIs} value="20010000001" onChange={vi.fn()} showInfo={true} />);
     expect(screen.getByText('Selected NMI Information')).toBeInTheDocument();
     expect(screen.getByText('Main Site')).toBeInTheDocument();
     expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });
});
