import { Link } from "react-router-dom";

export default function ListingCard({ listing, showTaxes }) {
  const basePrice = listing.price != null ? Number(listing.price) : null;
  const displayPrice =
    basePrice != null
      ? showTaxes
        ? Math.round(basePrice * 1.18)
        : basePrice
      : null;

  const coverUrl = listing.images?.[0]?.url || listing.image?.url;
  const reviewCount = listing.reviewCount ?? 0;
  const averageRating = listing.averageRating ?? 0;

  return (
    <div className="col">
      <Link
        to={`/listings/${listing._id}`}
        className="listing-link text-dark d-block"
      >
        <div className="card listing-card h-100">
          <div className="position-relative">
            <img
              src={coverUrl}
              className="card-img-top"
              alt={listing.title}
              style={{ height: "19rem" }}
            />
            <div className="card-img-overlay" />
            {listing.category && (
              <span className="badge bg-white text-dark position-absolute top-0 start-0 m-3 shadow-sm">
                {listing.category}
              </span>
            )}
          </div>

          <div className="card-body mt-2">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <h6 className="fw-semibold mb-0 text-truncate">
                {listing.title}
              </h6>
              <span className="small text-nowrap fw-medium">
                <i className="fa-solid fa-star star-icon me-1" />
                {reviewCount > 0 ? (
                  <>
                    {Number(averageRating).toFixed(1)}{" "}
                    <span className="text-muted fw-normal">
                      ({reviewCount})
                    </span>
                  </>
                ) : (
                  <span className="text-muted fw-normal">New</span>
                )}
              </span>
            </div>

            <p className="text-muted small mb-1 text-truncate">
              {listing.location}, {listing.country}
            </p>

            <p className="text-muted small mb-1 text-truncate">
              {listing.propertyType || "Entire home"} &middot;{" "}
              {listing.maxGuests ?? 2} guests
            </p>

            <p className="card-text mb-0">
              {displayPrice != null ? (
                <>
                  <span className="fw-semibold">
                    &#8377;{displayPrice.toLocaleString("en-IN")}
                  </span>{" "}
                  <span className="text-muted small">/ night</span>
                </>
              ) : (
                "Price unavailable"
              )}
              {showTaxes && (
                <span className="tax-info ms-1">(incl. 18% GST)</span>
              )}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
