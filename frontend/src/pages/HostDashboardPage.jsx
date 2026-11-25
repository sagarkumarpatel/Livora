import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient, { getApiErrorMessage } from "../api/client";
import StarRating from "../components/StarRating";
import { useFlash } from "../context/FlashContext";

const TABS = [
  { id: "listings", label: "My Listings" },
  { id: "availability", label: "Availability" },
  { id: "bookings", label: "Bookings" },
  { id: "reviews", label: "Reviews" },
  { id: "profile", label: "Host Profile" },
];

export default function HostDashboardPage() {
  const { showSuccess, showError } = useFlash();

  const [activeTab, setActiveTab] = useState("listings");
  const [hostProfile, setHostProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Availability form state
  const [selectedListingId, setSelectedListingId] = useState("");
  const [blockStartDate, setBlockStartDate] = useState("");
  const [blockEndDate, setBlockEndDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  // Profile edit state
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    contactDetails: "",
    bio: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [meRes, listingsRes, bookingsRes, reviewsRes] = await Promise.all([
        apiClient.get("/api/hosts/me"),
        apiClient.get("/api/hosts/listings"),
        apiClient.get("/api/hosts/bookings"),
        apiClient.get("/api/hosts/reviews"),
      ]);

      const profile = meRes.data.hostProfile;
      setHostProfile(profile);
      setProfileForm({
        fullName: profile?.fullName || "",
        email: profile?.email || "",
        phone: profile?.phone || "",
        contactDetails: profile?.contactDetails || "",
        bio: profile?.bio || "",
      });

      const hostListings = listingsRes.data.listings || [];
      setListings(hostListings);
      setSelectedListingId((prev) => prev || hostListings[0]?._id || "");
      setBookings(bookingsRes.data.bookings || []);
      setReviews(reviewsRes.data.reviews || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load host dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleStatusChange = async (listingId, newStatus) => {
    try {
      const { data } = await apiClient.patch(
        `/api/hosts/listings/${listingId}/status`,
        { status: newStatus }
      );
      setListings((prev) =>
        prev.map((item) => (item._id === listingId ? data.listing : item))
      );
      showSuccess(`Listing marked as ${newStatus}.`);
    } catch (err) {
      showError(getApiErrorMessage(err, "Failed to update listing status."));
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Delete this listing permanently?")) return;
    try {
      await apiClient.delete(`/api/listings/${listingId}`);
      setListings((prev) => prev.filter((l) => l._id !== listingId));
      showSuccess("Listing deleted.");
    } catch (err) {
      showError(getApiErrorMessage(err, "Failed to delete listing."));
    }
  };

  const handleAddBlock = async (e) => {
    e.preventDefault();
    if (!selectedListingId || !blockStartDate || !blockEndDate) {
      showError("Please select a listing, start date, and end date.");
      return;
    }

    setBlockSubmitting(true);
    try {
      const { data } = await apiClient.post(
        `/api/hosts/listings/${selectedListingId}/availability`,
        {
          startDate: blockStartDate,
          endDate: blockEndDate,
          reason: blockReason.trim() || "Host blocked",
        }
      );
      setListings((prev) =>
        prev.map((l) =>
          l._id === selectedListingId
            ? { ...l, blockedDates: data.blockedDates }
            : l
        )
      );
      setBlockStartDate("");
      setBlockEndDate("");
      setBlockReason("");
      showSuccess("Availability dates blocked.");
    } catch (err) {
      showError(getApiErrorMessage(err, "Failed to block dates."));
    } finally {
      setBlockSubmitting(false);
    }
  };

  const handleRemoveBlock = async (listingId, blockId) => {
    try {
      const { data } = await apiClient.delete(
        `/api/hosts/listings/${listingId}/availability/${blockId}`
      );
      setListings((prev) =>
        prev.map((l) =>
          l._id === listingId ? { ...l, blockedDates: data.blockedDates } : l
        )
      );
      showSuccess("Availability block removed.");
    } catch (err) {
      showError(getApiErrorMessage(err, "Failed to remove block."));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const { data } = await apiClient.put("/api/hosts/me", profileForm);
      setHostProfile(data.hostProfile);
      showSuccess("Host profile updated.");
    } catch (err) {
      showError(getApiErrorMessage(err, "Failed to update host profile."));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      const { data } = await apiClient.patch(
        `/api/hosts/bookings/${bookingId}/complete`
      );
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: data.booking.status } : b
        )
      );
      showSuccess("Booking marked as Completed.");
    } catch (err) {
      showError(getApiErrorMessage(err, "Failed to complete booking."));
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading host dashboard...</span>
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

  const selectedListing = listings.find((l) => l._id === selectedListingId);

  return (
    <div className="mt-4 mb-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="mb-1">Host Dashboard</h2>
          <p className="text-muted mb-0">
            Welcome back, <strong>{hostProfile?.fullName}</strong> &middot;{" "}
            {listings.length} listing{listings.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link to="/listings/new" className="btn add-btn text-white px-4">
          + Create New Listing
        </Link>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        {TABS.map((tab) => (
          <li key={tab.id} className="nav-item">
            <button
              type="button"
              className={`nav-link ${activeTab === tab.id ? "active fw-semibold" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* TAB 1: My Listings */}
      {activeTab === "listings" && (
        <>
          {listings.length === 0 ? (
            <div className="card p-5 text-center rounded-4">
              <p className="text-muted mb-3">
                You haven&apos;t created any property listings yet.
              </p>
              <div>
                <Link to="/listings/new" className="btn add-btn text-white">
                  Create Your First Listing
                </Link>
              </div>
            </div>
          ) : (
            <div className="row g-3">
              {listings.map((item) => {
                const cover = item.images?.[0]?.url || item.image?.url;
                return (
                  <div key={item._id} className="col-md-6 col-lg-4">
                    <div className="card h-100 rounded-4 shadow-sm overflow-hidden">
                      <img
                        src={cover}
                        alt={item.title}
                        className="w-100 object-fit-cover"
                        style={{ height: "190px" }}
                      />
                      <div className="card-body p-3 d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                          <h6 className="fw-semibold mb-0 text-truncate">
                            {item.title}
                          </h6>
                          <span
                            className={`badge ${
                              item.status === "published"
                                ? "text-bg-success"
                                : item.status === "unpublished"
                                ? "text-bg-warning"
                                : "text-bg-secondary"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-muted small mb-2">
                          {item.location}, {item.country}
                        </p>
                        <p className="small mb-2">
                          <strong>
                            &#8377;{Number(item.price).toLocaleString("en-IN")}
                          </strong>{" "}
                          / night &middot; {item.maxGuests} guests
                        </p>

                        <div className="mb-3">
                          <label className="form-label small text-muted mb-1">
                            Visibility Status
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={item.status}
                            onChange={(e) =>
                              handleStatusChange(item._id, e.target.value)
                            }
                          >
                            <option value="published">Published</option>
                            <option value="unpublished">Unpublished</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>

                        <div className="mt-auto d-flex flex-wrap gap-2">
                          <Link
                            to={`/listings/${item._id}`}
                            className="btn btn-sm btn-outline-dark"
                          >
                            View
                          </Link>
                          <Link
                            to={`/listings/${item._id}/edit`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                              setSelectedListingId(item._id);
                              setActiveTab("availability");
                            }}
                          >
                            Availability
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger ms-auto"
                            onClick={() => handleDeleteListing(item._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: Availability */}
      {activeTab === "availability" && (
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card p-4 rounded-4 shadow-sm">
              <h5 className="mb-3">Block Dates</h5>
              {listings.length === 0 ? (
                <p className="text-muted small mb-0">
                  Create a listing first to manage its availability.
                </p>
              ) : (
                <form onSubmit={handleAddBlock}>
                  <div className="mb-3">
                    <label className="form-label">Select Property</label>
                    <select
                      className="form-select"
                      value={selectedListingId}
                      onChange={(e) => setSelectedListingId(e.target.value)}
                    >
                      {listings.map((l) => (
                        <option key={l._id} value={l._id}>
                          {l.title} ({l.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={blockStartDate}
                      onChange={(e) => setBlockStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={blockEndDate}
                      onChange={(e) => setBlockEndDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Reason (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Maintenance or personal stay"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn add-btn text-white w-100"
                    disabled={blockSubmitting}
                  >
                    {blockSubmitting ? "Saving..." : "Block Selected Dates"}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card p-4 rounded-4 shadow-sm h-100">
              <h5 className="mb-3">
                Blocked Date Ranges{" "}
                {selectedListing ? `— ${selectedListing.title}` : ""}
              </h5>
              {!selectedListing ||
              !selectedListing.blockedDates ||
              selectedListing.blockedDates.length === 0 ? (
                <p className="text-muted mb-0">
                  No blocked dates configured for this property.
                </p>
              ) : (
                <div className="list-group list-group-flush">
                  {selectedListing.blockedDates.map((block) => (
                    <div
                      key={block._id}
                      className="list-group-item d-flex justify-content-between align-items-center px-0"
                    >
                      <div>
                        <div className="fw-semibold">
                          {new Date(block.startDate).toLocaleDateString()} &rarr;{" "}
                          {new Date(block.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-muted small">{block.reason}</div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          handleRemoveBlock(selectedListing._id, block._id)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Bookings */}
      {activeTab === "bookings" && (
        <div className="card p-4 rounded-4 shadow-sm">
          <h5 className="mb-3">Property Bookings</h5>
          {bookings.length === 0 ? (
            <p className="text-muted mb-0">
              No reservations have been placed on your properties yet.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Guest</th>
                    <th>Dates</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id}>
                      <td>{b.listing?.title}</td>
                      <td>@{b.guest?.username}</td>
                      <td>
                        {new Date(b.checkIn).toLocaleDateString()} -{" "}
                        {new Date(b.checkOut).toLocaleDateString()}
                      </td>
                      <td>
                        &#8377;{Number(b.totalAmount).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <span className="badge text-bg-light border">
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span className="badge text-bg-light border">
                          {b.status}
                        </span>
                      </td>
                      <td>
                        {b.status === "Confirmed" &&
                        b.paymentStatus === "Paid" ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleCompleteBooking(b._id)}
                          >
                            Mark Completed
                          </button>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Reviews */}
      {activeTab === "reviews" && (
        <div className="card p-4 rounded-4 shadow-sm">
          <h5 className="mb-3">Guest Reviews on Your Properties</h5>
          {reviews.length === 0 ? (
            <p className="text-muted mb-0">
              No reviews received on your properties yet.
            </p>
          ) : (
            <div className="row g-3">
              {reviews.map((r) => (
                <div key={r._id} className="col-md-6">
                  <div className="card p-3 rounded-4 h-100">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <Link
                        to={`/listings/${r.listing?._id}`}
                        className="fw-semibold text-decoration-none text-dark"
                      >
                        {r.listing?.title}
                      </Link>
                      <span className="text-muted small">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="small text-muted mb-2">
                      By @{r.author?.username || "Guest"}
                    </div>
                    <div className="mb-2">
                      <StarRating value={r.rating} readOnly />
                    </div>
                    <p className="mb-0">{r.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Host Profile */}
      {activeTab === "profile" && (
        <div className="card p-4 rounded-4 shadow-sm col-lg-8">
          <h5 className="mb-3">Update Host Profile</h5>
          <form onSubmit={handleSaveProfile}>
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.fullName}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, fullName: e.target.value }))
                }
                required
              />
            </div>
            <div className="row">
              <div className="mb-3 col-md-6">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="mb-3 col-md-6">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Contact Details</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.contactDetails}
                onChange={(e) =>
                  setProfileForm((p) => ({
                    ...p,
                    contactDetails: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Bio</label>
              <textarea
                rows={3}
                className="form-control"
                value={profileForm.bio}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, bio: e.target.value }))
                }
              />
            </div>
            <button
              type="submit"
              className="btn add-btn text-white px-4"
              disabled={profileSaving}
            >
              {profileSaving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
