let razorpayScriptPromise = null;

/**
 * Loads the official Razorpay Checkout script once on demand.
 */
export function loadRazorpayScript() {
  if (typeof window !== "undefined" && window.Razorpay) {
    return Promise.resolve(true);
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        razorpayScriptPromise = null;
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

/**
 * Opens Razorpay Checkout modal and resolves with payment response or rejects on failure/cancel.
 */
export async function openRazorpayCheckout({
  keyId,
  orderId,
  amount,
  currency = "INR",
  title,
  description,
  prefill = {},
}) {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Failed to load Razorpay Checkout SDK. Check your network.");
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const rzp = new window.Razorpay({
      key: keyId,
      order_id: orderId,
      amount,
      currency,
      name: title || "Livora",
      description: description || "Property Reservation",
      prefill,
      theme: {
        color: "#fe424d",
      },
      handler: (response) => {
        settled = true;
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          if (!settled) {
            reject(new Error("Payment cancelled by user."));
          }
        },
      },
    });

    rzp.on("payment.failed", (resp) => {
      settled = true;
      const reason =
        resp?.error?.description ||
        resp?.error?.reason ||
        "Payment failed in Razorpay Checkout.";
      reject(new Error(reason));
    });

    rzp.open();
  });
}
