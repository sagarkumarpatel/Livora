const crypto = require("crypto");
const Razorpay = require("razorpay");
const ExpressError = require("../utils/expressError");

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new ExpressError(
      503,
      "Razorpay Test Mode keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env."
    );
  }

  return { keyId, keySecret };
}

function getRazorpayClient() {
  const { keyId, keySecret } = getRazorpayCredentials();
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Verifies Razorpay Checkout signature using HMAC-SHA256 in constant time.
 */
function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) return false;
  const { keySecret } = getRazorpayCredentials();
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(String(signature), "utf8");
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

module.exports = {
  getRazorpayCredentials,
  getRazorpayClient,
  verifyRazorpaySignature,
};
