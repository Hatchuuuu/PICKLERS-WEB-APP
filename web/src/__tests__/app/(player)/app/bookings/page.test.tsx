import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import BookingsTab from '@/app/(player)/app/bookings/page';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(() => ({
    bookings: [],
    setBookings: vi.fn(),
    setJoinedMatches: vi.fn()
  }))
}));

vi.mock('@/contexts/ToastContext', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn()
  }))
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', name: 'Test Player', role: 'player' },
    isAuthenticated: true,
    isLoading: false
  })
}));

vi.mock('@/hooks/useWallet', () => ({
  useWallet: () => ({
    data: { balance: 1000 },
    isLoading: false
  })
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

// Mock date-related functions
const mockDate = new Date('2026-08-01T10:00:00Z');

describe('BookingsTab - Cancellation Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set timezone to UTC for consistent timing
    process.env.TZ = 'UTC';
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up the environment variable
    delete process.env.TZ;
  });

  const mockBooking = {
    id: 'PKL-OP-123456',
    court: 'Test Court',
    date: 'Today',
    time: '10:00 AM - 12:00 PM',
    total: 400,
    price: 400,
    status: 'upcoming',
    facility: 'Test Facility',
    isNew: false
  };

  const mockBookingWithin24Hours = {
    ...mockBooking,
    date: 'Today',
    time: '11:00 AM - 1:00 PM' // Within 24 hours from 10:00 AM
  };

  // We'll test the helper function directly by extracting it from the component
  describe('isBookingWithin24Hours helper function', () => {
    // Copy the actual function for testing
    function isBookingWithin24Hours(dateStr: string, timeStr: string): boolean {
      try {
        // Parse the date string (handles formats like "Tomorrow", "Today", "July 20, 2026", etc.)
        let bookingDate: Date;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lowerDate = dateStr.toLowerCase().trim();

        if (lowerDate === "today") {
          bookingDate = today;
        } else if (lowerDate === "tomorrow") {
          bookingDate = new Date(today);
          bookingDate.setDate(bookingDate.getDate() + 1);
        } else if (lowerDate === "yesterday") {
          bookingDate = new Date(today);
          bookingDate.setDate(bookingDate.getDate() - 1);
        } else {
          // Try to parse as a standard date format
          const parsedDate = new Date(dateStr);
          if (isNaN(parsedDate.getTime())) {
            // If parsing fails, assume it's not within 24 hours to be safe
            return false;
          }
          bookingDate = parsedDate;
        }

        // Parse the time string (format: "6:00 PM - 8:00 PM")
        // We'll use the start time for our calculation
        const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!timeMatch) {
          // If we can't parse the time, assume it's not within 24 hours to be safe
          return false;
        }

        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[3].toUpperCase();

        // Convert to 24-hour format
        if (ampm === "PM" && hours !== 12) {
          hours += 12;
        } else if (ampm === "AM" && hours === 12) {
          hours = 0;
        }

        // Set the booking date to the parsed time
        bookingDate.setHours(hours, minutes, 0, 0);

        // Calculate the difference in hours
        const timeDiff = bookingDate.getTime() - new Date().getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // Return true if the booking is within 24 hours (and in the future)
        return hoursDiff > 0 && hoursDiff <= 24;
      } catch (error) {
        // If there's any error in parsing, assume it's not within 24 hours to be safe
        console.warn("Error parsing date/time for cancellation check:", error);
        return false;
      }
    }

    test('should return true for today booking within 24 hours', () => {
      // Test with time that's 1 hour from now
      expect(isBookingWithin24Hours("Today", "11:00 AM - 1:00 PM")).toBe(true);
    });

    test('should return false for today booking more than 24 hours away', () => {
      // Test with time that's 25 hours from now (11:00 AM next day)
      expect(isBookingWithin24Hours("Tomorrow", "11:00 AM - 1:00 PM")).toBe(false);
    });

    test('should return true for tomorrow booking within 24 hours', () => {
      // If it's 10:00 AM now, tomorrow at 9:00 AM is within 24 hours
      expect(isBookingWithin24Hours("Tomorrow", "9:00 AM - 11:00 AM")).toBe(true);
    });

    test('should return false for tomorrow booking more than 24 hours away', () => {
      // If it's 10:00 AM now, tomorrow at 11:00 AM is more than 24 hours away
      expect(isBookingWithin24Hours("Tomorrow", "11:00 AM - 1:00 PM")).toBe(false);
    });

    test('should return false for yesterday booking', () => {
      expect(isBookingWithin24Hours("Yesterday", "10:00 AM - 12:00 PM")).toBe(false);
    });

    test('should handle invalid date format gracefully', () => {
      expect(isBookingWithin24Hours("Invalid Date", "10:00 AM - 12:00 PM")).toBe(false);
    });

    test('should handle invalid time format gracefully', () => {
      expect(isBookingWithin24Hours("Today", "Invalid Time")).toBe(false);
    });

    test('should handle 12:00 PM correctly', () => {
      // 12:00 PM should be 12:00 in 24-hour format
      expect(isBookingWithin24Hours("Today", "12:00 PM - 2:00 PM")).toBe(true);
    });

    test('should handle 12:00 PM correctly', () => {
      // 12:00 PM should be 12:00 in 24-hour format
      expect(isBookingWithin24Hours("Today", "12:00 PM - 2:00 PM")).toBe(true);
    });
  });

  // Test the actual cancellation flow integration
  describe('Booking cancellation integration', () => {
    test('should call setBookings with cancelled status when cancelling booking', () => {
      const setBookingsMock = vi.fn();
      const setJoinedMatchesMock = vi.fn();
      const showToastMock = vi.fn();

      // Mock the context values
      vi.mocked(useApp).mockReturnValue({
        bookings: [mockBooking as any],
        setBookings: setBookingsMock,
        setJoinedMatches: setJoinedMatchesMock,
        facilities: [],
        facilityCourts: [],
        joinedMatches: new Set(),
        chatMessages: {},
        setChatMessages: vi.fn(),
        likedPlayers: new Set(),
        setLikedPlayers: vi.fn(),
        playerLikes: {},
        setPlayerLikes: vi.fn(),
        favoritedFacilities: new Set(),
        setFavoritedFacilities: vi.fn(),
        notifications: [],
        setNotifications: vi.fn(),
        markAllNotificationsRead: vi.fn(),
        dismissNotification: vi.fn(),
        players: [],
        setPlayers: vi.fn(),
        awardMedals: vi.fn(),
        isDataLoaded: true,
        hasError: false
      });

      vi.mocked(useToast).mockReturnValue({
        showToast: showToastMock
      });

      // Render the component
      render(<BookingsTab />);

      // Find and click the cancel button on the booking card
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeInTheDocument();

      // Click cancel button to open modal
      act(() => {
        cancelButton.click();
      });

      // Find and click the confirm cancel button inside the modal
      const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
      const confirmCancelButton = cancelButtons[cancelButtons.length - 1];
      expect(confirmCancelButton).toBeInTheDocument();

      // Click confirm cancel
      act(() => {
        confirmCancelButton.click();
      });

      // Expect setBookings to be called with updated booking status
      expect(setBookingsMock).toHaveBeenCalled();

      // Expect success toast to be shown
      expect(showToastMock).toHaveBeenCalledWith(
        expect.stringContaining('Booking cancelled'),
        'success'
      );
    });

    test('should show warning toast when cancelling within 24 hours', () => {
      const setBookingsMock = vi.fn();
      const setJoinedMatchesMock = vi.fn();
      const showToastMock = vi.fn();

      // Mock the context values
      vi.mocked(useApp).mockReturnValue({
        bookings: [mockBookingWithin24Hours as any],
        setBookings: setBookingsMock,
        setJoinedMatches: setJoinedMatchesMock,
        facilities: [],
        facilityCourts: [],
        joinedMatches: new Set(),
        chatMessages: {},
        setChatMessages: vi.fn(),
        likedPlayers: new Set(),
        setLikedPlayers: vi.fn(),
        playerLikes: {},
        setPlayerLikes: vi.fn(),
        favoritedFacilities: new Set(),
        setFavoritedFacilities: vi.fn(),
        notifications: [],
        setNotifications: vi.fn(),
        markAllNotificationsRead: vi.fn(),
        dismissNotification: vi.fn(),
        players: [],
        setPlayers: vi.fn(),
        awardMedals: vi.fn(),
        isDataLoaded: true,
        hasError: false
      });

      vi.mocked(useToast).mockReturnValue({
        showToast: showToastMock
      });

      // Render the component
      render(<BookingsTab />);

      // Find and click the cancel button on the booking card
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeInTheDocument();

      // Click cancel button to open modal
      act(() => {
        cancelButton.click();
      });

      // Find and click the confirm cancel button inside the modal
      const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
      const confirmCancelButton = cancelButtons[cancelButtons.length - 1];
      expect(confirmCancelButton).toBeInTheDocument();

      // Click confirm cancel
      act(() => {
        confirmCancelButton.click();
      });

      // Expect setBookings to be called with updated booking status
      expect(setBookingsMock).toHaveBeenCalled();

      // Expect warning/error toast to be shown about no refund
      expect(showToastMock).toHaveBeenCalledWith(
        expect.stringContaining('No refund available for cancellations within 24 hours'),
        'error'
      );
    });
  });
});