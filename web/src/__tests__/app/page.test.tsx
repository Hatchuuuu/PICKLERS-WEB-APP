import { render, screen } from '@testing-library/react';
import { vi, beforeAll } from 'vitest';
import { FacilityCard } from '@/components/shared/FacilityCard';

const mockPush = vi.fn();

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
});

describe('LandingPage FacilityCard Navigation', () => {
  const mockFacility: any = {
    id: "1",
    name: 'Metro Smashers Hub',
    location: 'BGC, Taguig',
    courts: 5,
    rating: 4.8,
    price: 400,
    type: 'Indoor',
    hours: '6am – 10pm',
    moto: '5 min',
    car: '15 min',
    image: '/test.jpg',
    is_favorite: false
  };

  test('should render FacilityCard with correct props', () => {
    render(<FacilityCard f={mockFacility} onFav={() => {}} onViewCourts={() => {}} />);

    // Check that Metro Smashers Hub title and location render
    expect(screen.getByText('Metro Smashers Hub')).toBeInTheDocument();
    expect(screen.getByText('BGC, Taguig')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  test('FacilityCard should call onViewCourts when View Courts is clicked', () => {
    const onViewCourtsMock = vi.fn();

    // Render the FacilityCard component directly
    render(<FacilityCard f={mockFacility} onFav={() => {}} onViewCourts={onViewCourtsMock} />);

    // Find the "View Courts" button
    const viewCourtsButton = screen.getByRole('button', { name: /view courts/i });
    expect(viewCourtsButton).toBeInTheDocument();

    // Click the button
    viewCourtsButton.click();

    // Check that onViewCourts was called
    expect(onViewCourtsMock).toHaveBeenCalled();
  });
});