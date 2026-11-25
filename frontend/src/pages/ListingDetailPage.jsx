import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import apiClient, { getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useFlash } from "../context/FlashContext";
import ListingMap from "../components/ListingMap";
import StarRating from "../components/StarRating";

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showSuccess, showError } = useFlash();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewValidated, setReviewValidated] = useState(false);

  const fetchListing = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await apiClient.get(`/api/listings/${id}`);
      setListing(data.listing);
    } catch (err) {
      setError(getApiErrorMessage(err, "Listing not found."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const handleDeleteListing = async () => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    setDeleting(true);
    try {
      await apiClient.delete(`/api/listings/${id}`);
      showSuccess("Listing Deleted!");
      navigate("/listings");
    } catch (err) {
      showError(getApiErrorMessage(err, "Failed to delete listing."));
      setDeleting(false);
    }
  };

  const handleBookingIntent = () => {
    if (!user) {
      showError("Please log in to book this property.");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    showSuccess(
      "Booking checkout and availability selection will be enabled in Phase 4."
    );
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setReviewValidated(true);
      return;
    }

    setReviewSubmitting(true);
    try {
      const { data } = await apiClient.post(`/api/listings/${id}/reviews`, {
        rating,
        comment: comment.trim(),
      });
      setListing((prev) => ({
        ...prev,
        averageRating: data.averageRating ?? prev.averageRating,
        reviewCount: data.reviewCount ?? (prev.reviews?.length || 0) + 1,
        reviews: [data.review, ...(prev.reviews || [])],
      }));
      setComment("");
      setRating(5);
      setReviewValidated(false);
      showSuccess("New Review Created!");
    } catch (err) {
      showError(getApiErrorMessage(err, "Failed to submit review."));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      const { data } = await apiClient.delete(
        `/api/listings/${id}/reviews/${reviewId}`
      );
      setListing((prev) => ({
        ...prev,
        averageRating: data.averageRating ?? 0,
        reviewCount:
          data.reviewCount ?? Math.max((prev.reviews?.length || 1) - 1, 0),
        reviews: (prev.reviews || []).filter((r) => r._id !== reviewId),
      }));
      showSuccess("Review deleted!");
    } catch (err) {
      showError(getApiErrorMessage(err, "Failed to delete review."));
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading listing...</span>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="row mt-4">
        <div className="col-md-8 offset-md-2">
          <div className="alert alert-danger" role="alert">
            {error || "Listing not found."}
          </div>
          <Link to="/listings" className="btn btn-dark">
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  const galleryImages =
    listing.images?.length > 0
      ? listing.images
      : listing.image?.url
      ? [listing.image]
      : [];
  const heroImage = galleryImages[0]?.url;
  const secondaryImages = galleryImages.slice(1, 5);

  const isOwner = Boolean(
    user && listing.owner && user._id === listing.owner._id
  );
  const priceText =
    listing.price != null
      ? `₹${Number(listing.price).toLocaleString("en-IN")}`
      : "Price unavailable";
  const reviewCount = listing.reviewCount ?? listing.reviews?.length ?? 0;
  const averageRating = listing.averageRating ?? 0;

  return (
    <div className="mt-3 mb-5">
      <div className="mb-3">
        <h2 className="fw-semibold mb-1">{listing.title}</h2>
        <div className="d-flex flex-wrap align-items-center gap-3 text-muted small">
          <span>
            <i className="fa-solid fa-star star-icon me-1" />
            {reviewCount > 0 ? (
              <>
                <strong className="text-dark">
                  {Number(averageRating).toFixed(1)}
                </strong>{" "}
                &middot; {reviewCount} review{reviewCount === 1 ? "" : "s"}
              </>
            ) : (
              "New listing"
            )}
          </span>
          <span>&middot;</span>
          <span>
            <i className="fa-solid fa-location-dot me-1" />
            {listing.location}, {listing.country}
          </span>
          {listing.category && (
            <>
              <span>&middot;</span>
              <span className="badge text-bg-light border">
                {listing.category}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      <div className="row g-2 mb-4">
        <div className={secondaryImages.length > 0 ? "col-md-7" : "col-12"}>
          <img
            src={heroImage}
            alt={listing.title}
            className="w-100 rounded-4 object-fit-cover"
            style={{
              height: secondaryImages.length > 0 ? "420px" : "460px",
            }}
          />
        </div>
        {secondaryImages.length > 0 && (
          <div className="col-md-5">
            <div className="row g-2">
              {secondaryImages.map((img, idx) => (
                <div key={img.filename || idx} className="col-6">
                  <img
                    src={img.url}
                    alt={`${listing.title} ${idx + 2}`}
                    className="w-100 rounded-3 object-fit-cover"
                    style={{ height: "206px" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* Left column: details, amenities, reviews */}
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center pb-3 border-bottom">
            <div>
              <h4 className="mb-1">
                {listing.propertyType || "Entire home"} in {listing.location}
              </h4>
              <p className="text-muted mb-0">
                {listing.maxGuests ?? 2} guests &middot;{" "}
                {listing.bedrooms ?? 1} bedroom
                {(listing.bedrooms ?? 1) === 1 ? "" : "s"} &middot;{" "}
                {listing.bathrooms ?? 1} bath
                {(listing.bathrooms ?? 1) === 1 ? "" : "s"}
              </p>
            </div>
            <div className="text-end">
              <div className="small text-muted">Hosted by</div>
              <div className="fw-semibold">
                @{listing.owner?.username || "Livora Host"}
              </div>
            </div>
          </div>

          <div className="py-4 border-bottom">
            <h5 className="mb-2">About this place</h5>
            <p className="mb-0 text-secondary" style={{ lineHeight: 1.7 }}>
              {listing.description}
            </p>
          </div>

          {listing.amenities && listing.amenities.length > 0 && (
            <div className="py-4 border-bottom">
              <h5 className="mb-3">What this place offers</h5>
              <div className="row row-cols-2 g-2">
                {listing.amenities.map((amenity) => (
                  <div key={amenity} className="col text-secondary">
                    <i className="fa-solid fa-check text-success me-2" />
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOwner && (
            <div className="d-flex gap-3 py-3 border-bottom">
              <Link
                to={`/listings/${listing._id}/edit`}
                className="btn btn-dark edit-btn px-4"
              >
                Edit Listing
              </Link>
              <button
                type="button"
                className="btn btn-outline-dark px-4"
                onClick={handleDeleteListing}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Listing"}
              </button>
            </div>
          )}

          {/* Reviews Section */}
          <div className="py-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h4 className="mb-0">
                <i className="fa-solid fa-star star-icon me-2" />
                {reviewCount > 0
                  ? `${Number(averageRating).toFixed(1)} · ${reviewCount} Review${
                      reviewCount === 1 ? "" : "s"
                    }`
                  : "No reviews yet"}
              </h4>
            </div>

            {user ? (
              <form
                onSubmit={handleReviewSubmit}
                noValidate
                className={`card p-3 mb-4 border rounded-4 needs-validation ${
                  reviewValidated ? "was-validated" : ""
                }`}
              >
                <h6 className="mb-2">Leave a Review</h6>
                <div className="mb-2">
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <div className="mb-3">
                  <textarea
                    id="comment"
                    rows={3}
                    placeholder="Share your experience..."
                    className="form-control"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                  <div className="invalid-feedback">
                    Please add a comment for your review.
                  </div>
                </div>
                <div>
                  <button
                    type="submit"
                    className="btn btn-outline-dark btn-sm px-3"
                    disabled={reviewSubmitting}
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-muted small mb-4">
                <Link
                  to="/login"
                  state={{ from: location.pathname }}
                  className="fw-semibold"
                >
                  Log in
                </Link>{" "}
                to leave a review after your stay.
              </p>
            )}

            {listing.reviews && listing.reviews.length > 0 && (
              <div className="row g-3">
                {listing.reviews.map((review) => {
                  const isAuthor = Boolean(
                    user && review.author && user._id === review.author._id
                  );
                  const reviewDate = review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })
                    : "";

                  return (
                    <div key={review._id} className="col-md-6">
                      <div className="card h-100 p-3 rounded-4">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <h6 className="card-title mb-0">
                              @{review.author?.username || "Guest"}
                            </h6>
                            {reviewDate && (
                              <span className="text-muted small">
                                {reviewDate}
                              </span>
                            )}
                          </div>
                          <div className="mb-2">
                            <StarRating value={review.rating} readOnly />
                          </div>
                          <p className="card-text mb-0">{review.comment}</p>
                        </div>
                        {isAuthor && (
                          <div className="mt-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteReview(review._id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Booking summary card */}
        <div className="col-lg-4">
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
                {reviewCount > 0 ? Number(averageRating).toFixed(1) : "New"}
              </span>
            </div>

            <div className="border rounded-3 p-3 mb-3 bg-light small text-muted">
              <div>
                <strong>Max capacity:</strong> {listing.maxGuests ?? 2} guests
              </div>
              {listing.cleaningFee > 0 && (
                <div>
                  <strong>Cleaning fee:</strong> &#8377;
                  {Number(listing.cleaningFee).toLocaleString("en-IN")}
                </div>
              )}
              <div>
                <strong>Location:</strong> {listing.location}, {listing.country}
              </div>
            </div>

            <button
              type="button"
              className="btn add-btn text-white w-100 py-2 fw-semibold rounded-3"
              onClick={handleBookingIntent}
            >
              {user ? "Reserve" : "Log in to Reserve"}
            </button>
            <p className="text-center text-muted small mt-2 mb-0">
              {user
                ? "Select dates & complete reservation"
                : "Browsing is free — sign in only when you book"}
            </p>
          </div>
        </div>
      </div>

      {/* Location Map */}
      <div className="mt-5">
        <h4 className="mb-3">Where you&apos;ll be</h4>
        <ListingMap
          coordinates={listing.geometry?.coordinates}
          placeName={`${listing.location}, ${listing.country}`}
        />
      </div>
    </div>
  );
}
