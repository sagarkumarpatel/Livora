import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient, { getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useFlash } from "../context/FlashContext";
import {
  addDaysDateInput,
  calculateNights,
  calculatePriceBreakdown,
  getTodayDateInput,
  hasUnavailableOverlap,
} from "../utils/bookingPricing";

function getDraftKey(listingId) {
  return `livora_booking_draft_${listingId}`;
}

export default function BookingCard({ listing, isOwner }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showSuccess, showError } = useFlash();

  const today = getTodayDateInput();
  const maxGuests = listing.maxGuests ?? 2;

  const [unavailableRanges, setUnavailableRanges] = useState([]);
  const [checkIn, setCheckIn] = useState(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(getDraftKey(listing._id)) || "null"
      );
      return saved?.checkIn || "";
    } catch {
      return "";
    }
  });
  const [checkOut, setCheckOut] = useState(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(getDraftKey(listing._id)) || "null"
      );
      return saved?.checkOut || "";
    } catch {
      return "";
    }
  });
  const [guestsCount, setGuestsCount] = useState(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(getDraftKey(listing._id)) || "null"
      );
      return Math.min(Number(saved?.guestsCount) || 1, maxGuests);
    } catch {
      return 1;
    }
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingBooking, setPendingBooking] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadAvailability() {
      try {
        const { data } = await apiClient.get(
          `/api/listings/${listing._id}/availability`
        );
        if (!ignore) {
          setUnavailableRanges(data.unavailableRanges || []);
        }
      } catch {
        // Non-blocking: backend still enforces availability on submit
      }
    }

    loadAvailability();
    return () => {
      ignore = true;
    };
  }, [listing._id]);

  // Persist draft in sessionStorage so login redirect keeps user's selections
  useEffect(() => {
    if (checkIn || checkOut || guestsCount > 1) {
      sessionStorage.setItem(
        getDraftKey(listing._id),
        JSON.stringify({ checkIn, checkOut, guestsCount })
      );
    }
  }, [listing._id, checkIn, checkOut, guestsCount]);

  const nights = calculateNights(checkIn, checkOut);
  const hasConflict =
    nights > 0 && hasUnavailableOverlap(unavailableRanges, checkIn, checkOut);
  const breakdown =
    nights > 0
      ? calculatePriceBreakdown({
          pricePerNight: listing.price,
          cleaningFee: listing.cleaningFee ?? 0,
          nights,
        })
      : null;

  const priceText =
    listing.price != null
      ? `₹${Number(listing.price).toLocaleString("en-IN")}`
      : "Price unavailable";

  const reviewCount = listing.reviewCount ?? listing.reviews?.length ?? 0;
  const averageRating = listing.averageRating ?? 0;

  const handleReserve = async (e) => {
    e.preventDefault();
    setError("");

    if (!checkIn || !checkOut || nights < 1) {
      setError("Please select valid check-in and check-out dates.");
      return;
    }

    if (hasConflict) {
      setError("Selected dates overlap with unavailable dates.");
      return;
    }

    if (!user) {
      sessionStorage.setItem(
        getDraftKey(listing._id),
        JSON.stringify({ checkIn, checkOut, guestsCount })
      );
      showError("Please log in to reserve this property.");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await apiClient.post("/api/bookings", {
        listingId: listing._id,
        checkIn,
        checkOut,
        guestsCount: Number(guestsCount),
      });
      sessionStorage.removeItem(getDraftKey(listing._id));
      setPendingBooking(data.booking);
      setUnavailableRanges((prev) => [
        ...prev,
        {
          startDate: data.booking.checkIn,
          endDate: data.booking.checkOut,
          source: "booked",
        },
      ]);
      showSuccess("Dates reserved! Payment confirmation will be completed via Razorpay in Phase 5.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to create reservation."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="card p-4 shadow-sm rounded-4 sticky-top"
      style={{ top: "6rem" }}
    >
      <div className="d-flex justify-content-between align-items-baseline mb-3">
        <div>
          <span className="fs-4 fw-bold">{priceText}</span>{" "}
          <span className="text-muted">night</span>
        </div>
        <span className="small text-muted">
          <i className="fa-solid fa-star star-icon me-1" />
          {reviewCount > 0
            ? `${Number(averageRating).toFixed(1)} (${reviewCount})`
            : "New"}
        </span>
      </div>

      {isOwner ? (
        <div className="alert alert-light border small mb-0">
          You own this property. Manage its availability from your Host
          Dashboard.
        </div>
      ) : (
        <form onSubmit={handleReserve}>
          <div className="row g-2 mb-2">
            <div className="col-6">
              <label htmlFor="booking-checkin" className="form-label small fw-semibold mb-1">
                CHECK-IN
              </label>
              <input
                id="booking-checkin"
                type="date"
                className="form-control form-control-sm"
                min={today}
                value={checkIn}
                onChange={(e) => {
                  const val = e.target.value;
                  setCheckIn(val);
                  if (checkOut && checkOut <= val) {
                    setCheckOut(addDaysDateInput(val, 1));
                  }
                  setPendingBooking(null);
                }}
                required
              />
            </div>

            <div className="col-6">
              <label htmlFor="booking-checkout" className="form-label small fw-semibold mb-1">
                CHECKOUT
              </label>
              <input
                id="booking-checkout"
                type="date"
                className="form-control form-control-sm"
                min={checkIn ? addDaysDateInput(checkIn, 1) : addDaysDateInput(today, 1)}
                value={checkOut}
                onChange={(e) => {
                  setCheckOut(e.target.value);
                  setPendingBooking(null);
                }}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="booking-guests" className="form-label small fw-semibold mb-1">
              GUESTS (MAX {maxGuests})
            </label>
            <select
              id="booking-guests"
              className="form-select form-select-sm"
              value={guestsCount}
              onChange={(e) => setGuestsCount(Number(e.target.value))}
            >
              {Array.from({ length: maxGuests }, (_, idx) => idx + 1).map(
                (num) => (
                  <option key={num} value={num}>
                    {num} guest{num === 1 ? "" : "s"}
                  </option>
                )
              )}
            </select>
          </div>

          {hasConflict && (
            <div className="alert alert-warning py-2 px-3 small mb-3">
              These dates conflict with an existing reservation or host block.
            </div>
          )}

          {error && (
            <div className="alert alert-danger py-2 px-3 small mb-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn add-btn text-white w-100 py-2 fw-semibold rounded-3"
            disabled={submitting || hasConflict}
          >
            {submitting
              ? "Reserving..."
              : user
              ? "Reserve"
              : "Log in to Reserve"}
          </button>

          {breakdown && (
            <div className="mt-3 pt-3 border-top small">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">
                  &#8377;{breakdown.pricePerNight.toLocaleString("en-IN")} &times;{" "}
                  {breakdown.nights} night{breakdown.nights === 1 ? "" : "s"}
                </span>
                <span>&#8377;{breakdown.baseAmount.toLocaleString("en-IN")}</span>
              </div>

              {breakdown.cleaningFee > 0 && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Cleaning fee</span>
                  <span>
                    &#8377;{breakdown.cleaningFee.toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Livora service fee (12%)</span>
                <span>&#8377;{breakdown.serviceFee.toLocaleString("en-IN")}</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Taxes (18% GST)</span>
                <span>&#8377;{breakdown.taxes.toLocaleString("en-IN")}</span>
              </div>

              <div className="d-flex justify-content-between fw-bold fs-6 pt-2 border-top">
                <span>Total</span>
                <span>&#8377;{breakdown.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}

          {pendingBooking && (
            <div className="alert alert-info mt-3 mb-0 small">
              <div className="fw-semibold mb-1">
                Reservation Hold Created ({pendingBooking.status})
              </div>
              <div>
                Booking ID: <code>{pendingBooking._id}</code>
              </div>
              <div>
                Total Payable: &#8377;
                {Number(pendingBooking.totalAmount).toLocaleString("en-IN")}
              </div>
            </div>
          )}

          {unavailableRanges.length > 0 && (
            <div className="mt-3 pt-2 border-top">
              <div className="small fw-semibold text-muted mb-1">
                Unavailable dates:
              </div>
              <ul className="list-unstyled small text-muted mb-0">
                {unavailableRanges.slice(0, 4).map((r, i) => (
                  <li key={i}>
                    {String(r.startDate).slice(0, 10)} &rarr;{" "}
                    {String(r.endDate).slice(0, 10)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
