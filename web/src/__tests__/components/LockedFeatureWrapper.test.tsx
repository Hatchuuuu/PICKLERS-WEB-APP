import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LockedFeatureWrapper } from '@/components/ui/LockedFeatureWrapper';

// Mock contexts
const mockUser = {
  id: 'dev-user-id',
  name: 'PICKLERS Dev',
  email: 'picklersdev@gmail.com',
  role: 'dev',
  isAdmin: true,
  verificationStatus: 'verified'
};

let currentMockUser: any = mockUser;
let currentMockLoading = false;

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: currentMockUser,
    isLoading: currentMockLoading
  })
}));

vi.mock('@/store/useUserStore', () => ({
  useUserStore: () => ({
    role: currentMockUser?.role ?? null,
    verificationStatus: currentMockUser?.verificationStatus ?? null,
    isAdmin: currentMockUser?.role === 'admin' || currentMockUser?.role === 'dev',
    isDev: currentMockUser?.role === 'dev',
    isLoading: currentMockLoading
  })
}));

describe('LockedFeatureWrapper', () => {
  it('renders children unlocked for developer accounts without lock overlay', () => {
    currentMockUser = {
      id: 'dev-1',
      name: 'PICKLERS Dev',
      email: 'picklersdev@gmail.com',
      role: 'dev',
      isAdmin: true,
      verificationStatus: 'verified'
    };

    render(
      <LockedFeatureWrapper featureLabel="join open play sessions">
        <div data-testid="protected-content">Open Play Match Card</div>
      </LockedFeatureWrapper>
    );

    const content = screen.getByTestId('protected-content');
    expect(content).toBeInTheDocument();
    // Content should not be wrapped in disabled grayscale opacity-50 lock container
    expect(screen.queryByText(/verification/i)).not.toBeInTheDocument();
  });

  it('renders children unlocked for admin accounts', () => {
    currentMockUser = {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@picklers.com',
      role: 'admin',
      isAdmin: true,
      verificationStatus: 'verified'
    };

    render(
      <LockedFeatureWrapper featureLabel="join open play sessions">
        <div data-testid="protected-content-admin">Admin Match Card</div>
      </LockedFeatureWrapper>
    );

    expect(screen.getByTestId('protected-content-admin')).toBeInTheDocument();
  });

  it('renders lock overlay for unverified player accounts', () => {
    currentMockUser = {
      id: 'player-1',
      name: 'Regular Player',
      email: 'regularplayer@example.com',
      role: 'player',
      isAdmin: false,
      verificationStatus: 'unverified'
    };

    const { container } = render(
      <LockedFeatureWrapper featureLabel="join open play sessions" showLockIcon={true}>
        <div data-testid="protected-content-unverified">Locked Match Card</div>
      </LockedFeatureWrapper>
    );

    expect(screen.getByTestId('protected-content-unverified')).toBeInTheDocument();
    // The lock container with opacity-50 grayscale must exist for unverified players
    const lockedDiv = container.querySelector('.grayscale');
    expect(lockedDiv).not.toBeNull();
  });
});
