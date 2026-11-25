import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient, { getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useFlash } from "../context/FlashContext";
import { openRazorpayCheckout } from "../utils/razorpay";

function statusBadgeClass(status) {
  switch (status) {
    case "Confirmed":
      return "text-bg-success";
    case "Completed":
      return "text-bg-primary";
    case "Pending":
      return "text-bg-warning";
    case "Payment Failed":
      return "text-bg-danger";
    case "Cancelled":
    default:
      return "text-bg-secondary";
  }
}

export default function MyBookingsPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useFlash();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await apiClient.get("/api/bookings/me");
      setBookings(data.bookings || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load your bookings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) {
      return;
    }

    setBusyId(bookingId);
    try {
      const { data } = await apiClient.patch(`/api/bookings/${bookingId}/cancel`);
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? data.booking : b))
      );
      showSuccess(data.message || "Booking cancelled.");
    } catch (err) {
      showError(getApiErrorMessage(err, "Unable to cancel booking."));
    } finally {
      setBusyId("");
    }
  };

  const handlePayNow = async (booking) => {
    setBusyId(booking._id);
    let createdOrderId = null;

    try {
      const { data: orderData } = await apiClient.post(
        "/api/payments/razorpay/order",
        { bookingId: booking._id }
      );
      createdOrderId = orderData.order.id;

      const rzpResp = await openRazorpayCheckout({
        keyId: orderData.order.keyId,
        orderId: orderData.order.id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        title: "Livora",
        description: `${booking.listing?.title || "Stay"} (${booking.nights} nights)`,
        prefill: {
          name: user?.username || "",
          email: user?.email || "",
        },
      });

      const { data: verifyData } = await apiClient.post(
        "/api/payments/razorpay/verify",
        {
          bookingId: booking._id,
          razorpay_order_id: rzpResp.razorpay_order_id,
          razorpay_payment_id: rzpResp.razorpay_payment_id,
          razorpay_signature: rzpResp.razorpay_signature,
        }
      );

      setBookings((prev) =>
        prev.map((b) =>
          b._id === booking._id
            ? {
                ...b,
                status: verifyData.booking.status,
                paymentStatus: verifyData.booking.paymentStatus,
              }
            : b
        )
      );
      showSuccess("Payment verified and booking confirmed!");
    } catch (err) {
      const reason = getApiErrorMessage(err, "Payment failed.");
      if (createdOrderId) {
        try {
          await apiClient.post("/api/payments/razorpay/failure", {
            bookingId: booking._id,
            razorpay_order_id: createdOrderId,
            reason,
          });
          setBookings((prev) =>
            prev.map((b) =>
              b._id === booking._id
                ? { ...b, status: "Payment Failed", paymentStatus: "Failed" }
                : b
            )
          );
        } catch {
          // ignore
        }
      }
      showError(reason);
    } finally {
      setBusyId("");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading bookings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mt-4" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">My Bookings</h2>
          <p className="text-muted mb-0">
            Track your upcoming stays, payment status, and past trips.
          </p>
        </div>
        <Link to="/listings" className="btn btn-outline-dark">
          Explore Stays
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="card p-5 text-center rounded-4">
          <p className="text-muted fs-5 mb-3">You have no reservations yet.</p>
          <div>
            <Link to="/listings" className="btn add-btn text-white px-4">
              Browse Properties
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {bookings.map((booking) => {
            const listing = booking.listing;
            const thumb = listing?.images?.[0]?.url || listing?.image?.url;
            const canPay = ["Pending", "Payment Failed"].includes(
              booking.status
            );
            const canCancel = !["Completed", "Cancelled"].includes(
              booking.status
            );
            const isBusy = busyId === booking._id;

            return (
              <div key={booking._id} className="col-12">
                <div className="card p-3 rounded-4 shadow-sm">
                  <div className="row g-3 align-items-center">
                    <div className="col-md-3">
                      {thumb && (
                        <img
                          src={thumb}
                          alt={listing?.title || "Property"}
                          className="w-100 rounded-3 object-fit-cover"
                          style={{ height: "150px" }}
                        />
                      )}
                    </div>

                    <div className="col-md-6">
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                        <span
                          className={`badge ${statusBadgeClass(booking.status)}`}
                        >
                          {booking.status}
                        </span>
                        <span className="badge text-bg-light border">
                          Payment: {booking.paymentStatus}
                        </span>
                      </div>

                      <h5 className="mb-1">
                        {listing ? (
                          <Link
                            to={`/listings/${listing._id}`}
                            className="text-decoration-none text-dark"
                          >
                            {listing.title}
                          </Link>
                        ) : (
                          "Listing unavailable"
                        )}
                      </h5>

                      {listing && (
                        <p className="text-muted small mb-2">
                          {listing.location}, {listing.country} &middot; Hosted
                          by @{booking.host?.username || "Host"}
                        </p>
                      )}

                      <div className="small text-secondary">
                        <div>
                          <strong>Dates:</strong>{" "}
                          {String(booking.checkIn).slice(0, 10)} &rarr;{" "}
                          {String(booking.checkOut).slice(0, 10)} (
                          {booking.nights} night
                          {booking.nights === 1 ? "" : "s"})
                        </div>
                        <div>
                          <strong>Guests:</strong> {booking.guestsCount}
                        </div>
                      </div>
                    </div>

                    <div className="col-md-3 text-md-end">
                      <div className="text-muted small">Total Paid / Due</div>
                      <div className="fs-4 fw-bold mb-3">
                        &#8377;
                        {Number(booking.totalAmount).toLocaleString("en-IN")}
                      </div>

                      <div className="d-flex flex-md-column gap-2">
                        {canPay && (
                          <button
                            type="button"
                            className="btn btn-sm add-btn text-white"
                            disabled={isBusy}
                            onClick={() => handlePayNow(booking)}
                          >
                            {isBusy ? "Processing..." : "Pay with Razorpay"}
                          </button>
                        )}
                        {canCancel && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            disabled={isBusy}
                            onClick={() => handleCancel(booking._id)}
                          >
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
