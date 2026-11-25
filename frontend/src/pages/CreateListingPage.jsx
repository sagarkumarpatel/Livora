import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient, { getApiErrorMessage } from "../api/client";
import ListingForm from "../components/ListingForm";
import { useFlash } from "../context/FlashContext";

export default function CreateListingPage() {
  const navigate = useNavigate();
  const { showSuccess } = useFlash();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (formData) => {
    setSubmitting(true);
    setError("");
    try {
      const { data } = await apiClient.post("/api/listings", formData);
      showSuccess("New Listing Created!");
      navigate(`/listings/${data.listing._id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create listing."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="row mt-3 mb-5">
      <div className="col-lg-8 offset-lg-2">
        <h3 className="mb-3">Create a New Listing</h3>
        <ListingForm
          submitting={submitting}
          error={error}
          onSubmit={handleCreate}
        />
      </div>
    </div>
  );
}
