import Razorpay from "razorpay";

/**
 * Checks whether genuine Razorpay credentials are configured.
 * Rejects missing keys and placeholder values.
 */
export function isRazorpayConfigured() {
  const key_id = process.env.RAZORPAY_KEY_ID?.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!key_id || !key_secret) return false;

  // This lab uses Razorpay Test Mode only. A live key must never be used by
  // accident while developing or demonstrating the project.
  if (!key_id.startsWith("rzp_test_")) return false;

  const lowerId = key_id.toLowerCase();
  const lowerSecret = key_secret.toLowerCase();

  if (
    lowerId.includes("placeholder") ||
    lowerSecret.includes("placeholder") ||
    lowerId.includes("your_") ||
    lowerSecret.includes("your_")
  ) {
    return false;
  }

  return true;
}

/**
 * Returns a server-only Razorpay instance initialized from environment variables.
 * Keys are never exposed to the client.
 */
export function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID?.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!isRazorpayConfigured()) {
    throw new Error(
      "Razorpay API keys (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured."
    );
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}
