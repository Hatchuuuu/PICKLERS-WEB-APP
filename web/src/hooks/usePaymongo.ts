import { useState } from 'react';

export const usePaymongo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const shakeError = (msg: string) => {
    setError(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const createCheckoutSession = async (amount: number, userId: string, description: string = "Picklers Wallet Top-Up") => {
    if (amount < 100) {
      shakeError("Minimum top-up amount is ₱100.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, userId, description })
      });

      const data = await response.json();

      if (!response.ok) {
        setIsLoading(false);
        shakeError(data.error || "Failed to create checkout session.");
        return;
      }

      if (data.checkoutUrl) {
        // Redirect the user to the secure Paymongo hosted checkout page
        window.location.href = data.checkoutUrl;
      } else {
        setIsLoading(false);
        shakeError("Payment gateway did not return a checkout URL.");
      }
    } catch (err) {
      setIsLoading(false);
      shakeError("Network error. Please try again later.");
      console.error(err);
    }
  };

  return {
    isLoading,
    error,
    isShaking,
    createCheckoutSession
  };
};
