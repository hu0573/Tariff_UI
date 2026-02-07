import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DemandConfigModal } from './DemandConfigModal';
import { pricingSchemesApi } from '@/api/pricingSchemes';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock the API client
vi.mock('@/api/pricingSchemes', () => ({
  pricingSchemesApi: {
    createDemand: vi.fn(),
    updateDemand: vi.fn(),
    deleteDemand: vi.fn(),
  }
}));

// Mock the child components to simplify testing focus
// We mock Modal to just render children immediately to avoid portal issues in some envs
// and to keep the DOM tree simple.
vi.mock('@/components/common/Modal', () => ({
  Modal: ({ children, isOpen, title }: any) => {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-label={title}>
        <h1>{title}</h1>
        {children}
      </div>
    );
  }
}));

// Mock Tooltip as it might handle hover state which can be finicky
vi.mock('@/components/common/Tooltip', () => ({
  Tooltip: ({ children, content }: any) => (
    <div data-testid="tooltip-wrapper">
      {children}
      <div data-testid="tooltip-content" className="hidden-tooltip">{content}</div>
    </div>
  )
}));

describe('DemandConfigModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const schemeId = 100;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    schemeId,
    onSuccess: mockOnSuccess,
  };

  it('renders correctly for creating new demand', () => {
    render(<DemandConfigModal {...defaultProps} />);
    
    expect(screen.getByRole('dialog', { name: 'Add Demand' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Demand Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sampling Method/i)).toBeInTheDocument();
    
    // Check default sampling method
    const select = screen.getByLabelText(/Sampling Method/i) as HTMLSelectElement;
    expect(select.value).toBe('maximum_interval');
  });

  it('renders correctly for editing existing demand', () => {
    const demandToEdit: any = {
      id: 1,
      name: 'Existing Demand',
      description: 'Test Desc',
      start_time: '10:00',
      end_time: '14:00',
      start_month: 1,
      end_month: 12,
      lookback_days: 100,
      price_base: 0.5,
      weekday_pricing: 'weekday',
      sampling_method: 'daily_window_average' // Key thing to test
    };

    render(<DemandConfigModal {...defaultProps} demandToEdit={demandToEdit} />);
    
    expect(screen.getByRole('dialog', { name: 'Edit Demand' })).toBeInTheDocument();
    
    // Check values are pre-filled
    expect(screen.getByLabelText(/Demand Name/i)).toHaveValue('Existing Demand');
    
    // Check sampling method is echoed back correctly
    const select = screen.getByLabelText(/Sampling Method/i) as HTMLSelectElement;
    expect(select.value).toBe('daily_window_average');
  });

  it('allows changing sampling method', async () => {
    const user = userEvent.setup();
    render(<DemandConfigModal {...defaultProps} />);
    
    const select = screen.getByLabelText(/Sampling Method/i);
    
    // Change to Daily Window Average
    await user.selectOptions(select, 'daily_window_average');
    expect(select).toHaveValue('daily_window_average');
    
    // Change back
    await user.selectOptions(select, 'maximum_interval');
    expect(select).toHaveValue('maximum_interval');
  });

  it('submits correct payload including sampling_method', async () => {
    const user = userEvent.setup();
    render(<DemandConfigModal {...defaultProps} />);
    
    // Fill required fields
    await user.type(screen.getByLabelText(/Demand Name/i), 'New Rule');
    await user.type(screen.getByLabelText(/Description/i), 'Desc');
    
    const startTimeInput = screen.getByLabelText(/Start Time/i);
    await user.clear(startTimeInput);
    await user.type(startTimeInput, '12:00');
    
    const endTimeInput = screen.getByLabelText(/End Time/i);
    await user.clear(endTimeInput);
    await user.type(endTimeInput, '13:00');

    // Months (defaults are 1 and 12, but let's be explicit)
    const startMonthInput = screen.getByLabelText(/Start Month/i);
    await user.clear(startMonthInput);
    await user.type(startMonthInput, '1');

    const endMonthInput = screen.getByLabelText(/End Month/i);
    await user.clear(endMonthInput);
    await user.type(endMonthInput, '12');

    const lookbackInput = screen.getByLabelText(/Lookback Days/i);
    await user.clear(lookbackInput);
    await user.type(lookbackInput, '365');

    const priceInput = screen.getByLabelText(/Price Base/i);
    await user.clear(priceInput);
    await user.type(priceInput, '1.5');
    
    // Select sampling method
    await user.selectOptions(screen.getByLabelText(/Sampling Method/i), 'daily_window_average');
    
    // Submit
    await user.click(screen.getByRole('button', { name: /Create Demand/i }));
    
    await waitFor(() => {
      expect(pricingSchemesApi.createDemand).toHaveBeenCalledWith(schemeId, expect.objectContaining({
        name: 'New Rule',
        start_time: '12:00',
        end_time: '13:00',
        sampling_method: 'daily_window_average',
        price_base: 1.5
      }));
    });
    
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows validation error if fields are invalid', async () => {
    const user = userEvent.setup();
    render(<DemandConfigModal {...defaultProps} />);
    
    // Leave fields empty and try to submit
    await user.click(screen.getByRole('button', { name: /Create Demand/i }));
    
    expect(screen.getByText(/Demand name is required/i)).toBeInTheDocument();
    expect(pricingSchemesApi.createDemand).not.toHaveBeenCalled();
  });

  it('displays tooltip content for Sampling Method', () => {
    render(<DemandConfigModal {...defaultProps} />);
    
    // Since we mocked Tooltip to render content in specific way
    const tooltipContent = screen.getByTestId('tooltip-content');
    expect(tooltipContent).toHaveTextContent(/Daily Window Average/i);
    expect(tooltipContent).toHaveTextContent(/Maximum Interval Value/i);
  });
});
