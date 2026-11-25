import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient, { getApiErrorMessage } from "../api/client";
import ListingForm from "../components/ListingForm";
import { useAuth } from "../context/AuthContext";
import { useFlash } from "../context/FlashContext";

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useFlash();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadListing() {
      try {
        const { data } = await apiClient.get(`/api/listings/${id}`);
        if (!ignore) {
          if (
            user &&
            data.listing.owner &&
            data.listing.owner._id !== user._id
          ) {
            showError("You are not the owner of this listing.");
            navigate(`/listings/${id}`, { replace: true });
            return;
          }
          setListing(data.listing);
        }
      } catch (err) {
        if (!ignore) {
          setError(getApiErrorMessage(err, "Failed to load listing."));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadListing();
    return () => {
      ignore = true;
    };
  }, [id, user, navigate, showError]);

  const handleUpdate = async (formData) => {
    setSubmitting(true);
    setError("");
    try {
      await apiClient.put(`/api/listings/${id}`, formData);
      showSuccess("Listing Updated!");
      navigate(`/listings/${id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update listing."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="alert alert-danger mt-4" role="alert">
        {error || "Listing not found."}
      </div>
    );
  }

  return (
    <div className="row mt-3 mb-5">
      <div className="col-lg-8 offset-lg-2">
        <h3 className="mb-3">Edit your Listing</h3>
        <ListingForm
          initialValues={listing}
          isEdit
          submitting={submitting}
          error={error}
          onSubmit={handleUpdate}
        />
      </div>
    </div>
  );
}
