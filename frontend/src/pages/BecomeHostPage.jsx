import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient, { getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useFlash } from "../context/FlashContext";

export default function BecomeHostPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { showSuccess } = useFlash();

  const [formData, setFormData] = useState({
    fullName: "",
    email: user?.email || "",
    phone: "",
    contactDetails: "",
    bio: "",
  });
  const [validated, setValidated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.isHost) {
      navigate("/host/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      setValidated(true);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await apiClient.post("/api/hosts/onboard", {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        contactDetails: formData.contactDetails.trim(),
        bio: formData.bio.trim(),
      });
      await refreshUser();
      showSuccess("Welcome aboard! Your host profile is now active.");
      navigate("/host/dashboard", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Host onboarding failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="row mt-4 mb-5">
      <div className="col-lg-8 offset-lg-2">
        <div className="card p-4 shadow-sm rounded-4 border-0 bg-light-subtle">
          <h2 className="mb-2">Become a Livora Host</h2>
          <p className="text-muted mb-4">
            Complete your host profile to publish properties and manage bookings.
            Your customer account and booking capabilities remain active.
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className={`needs-validation ${validated ? "was-validated" : ""}`}
          >
            <div className="mb-3">
              <label htmlFor="fullName" className="form-label">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                className="form-control"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
                minLength={2}
              />
              <div className="invalid-feedback">
                Please enter your full name.
              </div>
            </div>

            <div className="row">
              <div className="mb-3 col-md-6">
                <label htmlFor="email" className="form-label">
                  Host Contact Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <div className="invalid-feedback">
                  Please enter a valid email address.
                </div>
              </div>

              <div className="mb-3 col-md-6">
                <label htmlFor="phone" className="form-label">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="form-control"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  minLength={7}
                />
                <div className="invalid-feedback">
                  Please enter a valid phone number.
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="contactDetails" className="form-label">
                Contact Details &amp; Availability
              </label>
              <input
                id="contactDetails"
                name="contactDetails"
                type="text"
                className="form-control"
                placeholder="e.g., WhatsApp or phone daily 9 AM - 9 PM IST"
                value={formData.contactDetails}
                onChange={handleChange}
                required
                minLength={5}
              />
              <div className="invalid-feedback">
                Please provide your contact details.
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="bio" className="form-label">
                About You as a Host (Optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                className="form-control"
                placeholder="Tell guests a little about your hosting style..."
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn add-btn text-white px-4 py-2 fw-semibold"
              disabled={submitting}
            >
              {submitting ? "Activating Host Profile..." : "Complete Host Setup"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
