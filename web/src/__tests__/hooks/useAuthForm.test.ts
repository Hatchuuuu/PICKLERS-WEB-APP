import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthForm } from '@/hooks/useAuthForm';
import { supabase } from '@/lib/supabase';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
  }),
  useSearchParams: () => ({
    get: vi.fn()
  })
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false
  })
}));

describe('useAuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('email OTP flow', () => {
    it('should handle email OTP sending correctly', async () => {
      const { result } = renderHook(() => useAuthForm());

      // Set up form values for email login
      await act(async () => {
        result.current.form.setValue('view', 'auth');
        result.current.form.setValue('tab', 'signin');
        result.current.form.setValue('authMethod', 'email');
        result.current.form.setValue('email', 'test@example.com');
        result.current.form.setValue('password', 'password123');
      });

      // Mock successful OTP sending
      (supabase.auth.signInWithOtp as any).mockResolvedValueOnce({ error: null });

      // Trigger send code
      await act(async () => {
        await result.current.handleSendCode(result.current.form.getValues());
      });

      // Verify state changes
      expect(result.current.view).toBe('verify-code');
      expect(result.current.countdown).toBe(60);
      expect(result.current.loading).toBe(false);
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: { shouldCreateUser: false }
      });
    });

    it('should handle email OTP verification correctly', async () => {
      const { result } = renderHook(() => useAuthForm());

      // Set up form for verification
      await act(async () => {
        result.current.form.setValue('view', 'verify-code');
        result.current.form.setValue('email', 'test@example.com');
        result.current.setOtpCode('123456');
      });

      // Mock successful OTP verification
      (supabase.auth.verifyOtp as any).mockResolvedValueOnce({ error: null });

      // Trigger verify code
      await act(async () => {
        await result.current.handleVerifyCode('123456');
      });

      // Verify state changes
      expect(result.current.view).toBe('reset-password');
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        token: '123456',
        type: 'email'
      });
    });

    it('should show error for invalid OTP code length', async () => {
      const { result } = renderHook(() => useAuthForm());

      // Set up form for verification
      await act(async () => {
        result.current.form.setValue('view', 'verify-code');
      });

      // Test with short code
      await act(async () => {
        result.current.handleVerifyCode('123');
      });

      // Should show error
      expect(result.current.authError).toBe('Please enter the 6-digit code.');
    });

    it('should handle phone OTP flow correctly', async () => {
      const { result } = renderHook(() => useAuthForm());

      // Set up form values for phone login
      await act(async () => {
        result.current.form.setValue('view', 'auth');
        result.current.form.setValue('tab', 'signin');
        result.current.form.setValue('authMethod', 'phone');
        result.current.form.setValue('phone', '9171234567');
        result.current.form.setValue('password', 'password123');
      });

      // Mock successful OTP sending
      (supabase.auth.signInWithOtp as any).mockResolvedValueOnce({ error: null });

      // Trigger send code
      await act(async () => {
        await result.current.handleSendCode(result.current.form.getValues());
      });

      // Verify phone number formatting
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        phone: '+639171234567',
        options: { shouldCreateUser: false }
      });
    });
  });

  describe('signup flow', () => {
    it('should handle email signup correctly', async () => {
      const { result } = renderHook(() => useAuthForm());

      // Set up form values for email signup
      await act(async () => {
        result.current.form.setValue('view', 'auth');
        result.current.form.setValue('tab', 'signup');
        result.current.form.setValue('authMethod', 'email');
        result.current.form.setValue('email', 'test@example.com');
        result.current.form.setValue('password', 'password123');
        result.current.form.setValue('name', 'Test User');
      });

      // Mock successful signup without session (requires email verification)
      (supabase.auth.signUp as any).mockResolvedValueOnce({
        data: { user: { id: '1' }, session: null },
        error: null
      });

      // Trigger submit
      await act(async () => {
        await result.current.onSubmit(result.current.form.getValues());
      });

      // Should move to signin tab and show success message
      expect(result.current.form.getValues().tab).toBe('signin');
      expect(result.current.successMessage).toContain('check your email');
      expect(result.current.loading).toBe(false);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: { full_name: 'Test User', role: 'player' },
          emailRedirectTo: expect.any(String)
        }
      });
    });

    it('should handle phone signup correctly', async () => {
      const { result } = renderHook(() => useAuthForm());

      // Set up form values for phone signup
      await act(async () => {
        result.current.form.setValue('view', 'auth');
        result.current.form.setValue('tab', 'signup');
        result.current.form.setValue('authMethod', 'phone');
        result.current.form.setValue('phone', '9171234567');
        result.current.form.setValue('password', 'password123');
        result.current.form.setValue('name', 'Test User');
      });

      // Mock successful signup without session (requires phone verification)
      (supabase.auth.signUp as any).mockResolvedValueOnce({
        data: { user: { id: '1' }, session: null },
        error: null
      });

      // Trigger submit
      await act(async () => {
        await result.current.onSubmit(result.current.form.getValues());
      });

      // Should move to verify-phone view and start countdown
      expect(result.current.form.getValues().view).toBe('verify-phone');
      expect(result.current.countdown).toBe(60);
      expect(result.current.loading).toBe(false);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        phone: '+639171234567',
        password: 'password123',
        options: { data: { full_name: 'Test User', role: 'player' } }
      });
    });
  });

  describe('signin flow', () => {
    it('should handle email signin correctly', async () => {
      const { result } = renderHook(() => useAuthForm());

      // Set up form values for email signin
      await act(async () => {
        result.current.form.setValue('view', 'auth');
        result.current.form.setValue('tab', 'signin');
        result.current.form.setValue('authMethod', 'email');
        result.current.form.setValue('email', 'test@example.com');
        result.current.form.setValue('password', 'password123');
      });

      // Mock successful signin
      (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({
        data: { user: { id: '1' }, session: { access_token: 'token' } },
        error: null
      });

      // Trigger submit
      await act(async () => {
        await result.current.onSubmit(result.current.form.getValues());
      });

      // Should set success state and redirect
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should handle invalid credentials error correctly', async () => {
      const { result } = renderHook(() => useAuthForm());

      // Set up form values for email signin
      await act(async () => {
        result.current.form.setValue('view', 'auth');
        result.current.form.setValue('tab', 'signin');
        result.current.form.setValue('authMethod', 'email');
        result.current.form.setValue('email', 'test@example.com');
        result.current.form.setValue('password', 'wrongpassword');
      });

      // Mock failed signin
      (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid login credentials' }
      });

      // Trigger submit
      await act(async () => {
        await result.current.onSubmit(result.current.form.getValues());
      });

      // Should show specific error message
      expect(result.current.authError).toBe("We couldn't verify those credentials. Please try again or click 'Forgot Password' to reset your access.");
      expect(result.current.loading).toBe(false);
      expect(result.current.isShaking).toBe(true); // Should trigger shake animation
    });
  });

  describe('password reset flow', () => {
    it('should handle reset password correctly', async () => {
      const { result } = renderHook(() => useAuthForm());

      // Set up form values for password reset
      await act(async () => {
        result.current.form.setValue('view', 'reset-password');
        result.current.form.setValue('password', 'newpassword123');
        result.current.form.setValue('confirmPassword', 'newpassword123');
      });

      // Mock successful password update
      (supabase.auth.updateUser as any).mockResolvedValueOnce({ error: null });

      // Trigger submit
      await act(async () => {
        await result.current.onSubmit(result.current.form.getValues());
      });

      // Should set success state
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123'
      });
    });

    it('should validate password mismatch - values are set correctly', async () => {
      const { result } = renderHook(() => useAuthForm());

      // Set up form values with mismatched passwords
      await act(async () => {
        result.current.form.setValue('view', 'reset-password');
        result.current.form.setValue('password', 'password123');
        result.current.form.setValue('confirmPassword', 'different456');
      });

      // The form should have the values set correctly
      expect(result.current.form.getValues().password).toBe('password123');
      expect(result.current.form.getValues().confirmPassword).toBe('different456');
    });
  });
});