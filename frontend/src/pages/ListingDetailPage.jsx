import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiClient, { getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useFlash } from "../context/FlashContext";
import ListingMap from "../components/ListingMap";
import StarRating from "../components/StarRating";

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
      await apiClient.delete(`/api/listings/${id}/reviews/${reviewId}`);
      setListing((prev) => ({
        ...prev,
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

  const isOwner = Boolean(
    user && listing.owner && user._id === listing.owner._id
  );
  const priceText =
    listing.price != null
      ? `₹${Number(listing.price).toLocaleString("en-IN")}`
      : "Price unavailable";

  return (
    <div className="row mt-3 mb-5">
      <div className="col-lg-8 offset-lg-2">
        <h3 className="mb-3">{listing.title}</h3>

        <div className="card show-card listing-card mb-3">
          <img
            src={listing.image?.url}
            className="card-img-top show-img"
            alt={listing.title}
          />
          <div className="card-body mt-3">
            <p className="card-text">
              Owned by{" "}
              <i>@{listing.owner?.username || "Livora Host"}</i>
              {listing.category && (
                <span className="badge text-bg-light border ms-2">
                  {listing.category}
                </span>
              )}
            </p>
            <p className="card-text">{listing.description}</p>
            <p className="card-text fw-semibold">{priceText} / night</p>
            <p className="card-text">
              {listing.location || "Location unavailable"}
            </p>
            <p className="card-text">
              {listing.country || "Country unavailable"}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="d-flex gap-3 mb-4">
            <Link
              to={`/listings/${listing._id}/edit`}
              className="btn btn-dark edit-btn px-4"
            >
              Edit
            </Link>
            <button
              type="button"
              className="btn btn-dark px-4"
              onClick={handleDeleteListing}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}

        {user && (
          <div className="mb-4">
            <hr />
            <h4>Leave a Review</h4>
            <form
              onSubmit={handleReviewSubmit}
              noValidate
              className={`needs-validation ${
                reviewValidated ? "was-validated" : ""
              }`}
            >
              <div className="mb-3 mt-3">
                <label className="form-label d-block">Rating</label>
                <StarRating value={rating} onChange={setRating} />
              </div>

              <div className="mb-3">
                <label htmlFor="comment" className="form-label">
                  Comments
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  className="form-control"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
                <div className="invalid-feedback">
                  Please add a comment for your review.
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-outline-dark"
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? "Submitting..." : "Submit"}
              </button>
            </form>
            <hr />
          </div>
        )}

        {listing.reviews && listing.reviews.length > 0 && (
          <div className="mb-4">
            <p className="fw-bold mb-3">All Reviews</p>
            <div className="row g-3">
              {listing.reviews.map((review) => {
                const isAuthor = Boolean(
                  user && review.author && user._id === review.author._id
                );
                return (
                  <div key={review._id} className="col-md-6">
                    <div className="card h-100 p-3">
                      <div className="card-body">
                        <h6 className="card-title mb-2">
                          @{review.author?.username || "Anonymous"}
                        </h6>
                        <div className="mb-2">
                          <StarRating value={review.rating} readOnly />
                        </div>
                        <p className="card-text">{review.comment}</p>
                      </div>
                      {isAuthor && (
                        <div className="mt-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-dark"
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
          </div>
        )}

        <div className="mt-4">
          <h4 className="mb-3">Where you&apos;ll be</h4>
          <ListingMap
            coordinates={listing.geometry?.coordinates}
            placeName={listing.location}
          />
        </div>
      </div>
    </div>
  );
}
