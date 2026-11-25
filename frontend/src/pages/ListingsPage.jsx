import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import apiClient, { getApiErrorMessage } from "../api/client";
import ListingCard from "../components/ListingCard";
import { LISTING_CATEGORIES } from "../constants/categories";

export default function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTaxes, setShowTaxes] = useState(false);

  const activeSearch = searchParams.get("search") || "";
  const activeCategory = searchParams.get("category") || "";

  useEffect(() => {
    let ignore = false;

    async function loadListings() {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (activeSearch) params.search = activeSearch;
        if (activeCategory) params.category = activeCategory;

        const { data } = await apiClient.get("/api/listings", { params });
        if (!ignore) {
          setListings(data.listings || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(getApiErrorMessage(err, "Failed to load listings."));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadListings();
    return () => {
      ignore = true;
    };
  }, [activeSearch, activeCategory]);

  const handleCategoryClick = (category) => {
    const next = new URLSearchParams(searchParams);
    if (activeCategory === category) {
      next.delete("category");
    } else {
      next.set("category", category);
    }
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <>
      <div id="filters">
        {LISTING_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.label;
          return (
            <button
              key={cat.label}
              type="button"
              className={`filter btn btn-link text-decoration-none text-dark p-0 ${
                isActive ? "filter-active" : ""
              }`}
              onClick={() => handleCategoryClick(cat.label)}
            >
              <div>
                <i className={cat.icon} />
              </div>
              <p>{cat.label}</p>
            </button>
          );
        })}

        <div className="tax-toggle">
          <div className="form-check-reverse form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="switchCheckDefault"
              checked={showTaxes}
              onChange={(e) => setShowTaxes(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="switchCheckDefault">
              Display total after taxes
            </label>
          </div>
        </div>
      </div>

      {(activeSearch || activeCategory) && (
        <div className="d-flex align-items-center justify-content-between mt-3 mb-1">
          <span className="text-muted small">
            Showing {listings.length} stay{listings.length === 1 ? "" : "s"}
            {activeCategory ? ` in "${activeCategory}"` : ""}
            {activeSearch ? ` for "${activeSearch}"` : ""}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      )}

      {loading && (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading listings...</span>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="alert alert-danger mt-4" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && listings.length === 0 && (
        <div className="text-center py-5 text-muted">
          <p className="fs-5 mb-2">No published listings match your search.</p>
          {(activeSearch || activeCategory) && (
            <button
              type="button"
              className="btn btn-outline-dark btn-sm"
              onClick={clearFilters}
            >
              Show all listings
            </button>
          )}
        </div>
      )}

      {!loading && !error && listings.length > 0 && (
        <div className="row row-cols-lg-3 row-cols-md-2 row-cols-1 g-4 mt-2 mb-5">
          {listings.map((listing) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              showTaxes={showTaxes}
            />
          ))}
        </div>
      )}
    </>
  );
}
