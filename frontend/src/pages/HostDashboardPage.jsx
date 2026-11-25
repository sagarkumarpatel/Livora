import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient, { getApiErrorMessage } from "../api/client";

export default function HostDashboardPage() {
  const [hostProfile, setHostProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      try {
        const { data } = await apiClient.get("/api/hosts/me");
        if (!ignore) {
          setHostProfile(data.hostProfile);
        }
      } catch (err) {
        if (!ignore) {
          setError(getApiErrorMessage(err, "Failed to load host dashboard."));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      ignore = true;
    };
  }, []);

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

  return (
    <div className="mt-4 mb-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="mb-1">Host Dashboard</h2>
          <p className="text-muted mb-0">
            Welcome, {hostProfile?.fullName} (@{hostProfile?.status})
          </p>
        </div>
        <Link to="/listings/new" className="btn add-btn text-white px-4">
          + Create New Listing
        </Link>
      </div>

      <div className="card p-4 rounded-4 shadow-sm border">
        <h5 className="mb-3">Verified Host Profile</h5>
        <div className="row g-3 small">
          <div className="col-md-4">
            <div className="text-muted">Full Name</div>
            <div className="fw-semibold">{hostProfile?.fullName}</div>
          </div>
          <div className="col-md-4">
            <div className="text-muted">Email</div>
            <div className="fw-semibold">{hostProfile?.email}</div>
          </div>
          <div className="col-md-4">
            <div className="text-muted">Phone</div>
            <div className="fw-semibold">{hostProfile?.phone}</div>
          </div>
          <div className="col-12">
            <div className="text-muted">Contact Details</div>
            <div>{hostProfile?.contactDetails}</div>
          </div>
          {hostProfile?.bio && (
            <div className="col-12">
              <div className="text-muted">Bio</div>
              <div>{hostProfile.bio}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
