import { useEffect, useState } from "react";
import { LISTING_CATEGORIES } from "../constants/categories";

export default function ListingForm({
  initialValues,
  existingImageUrl,
  isEdit = false,
  submitting = false,
  error = "",
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    price: initialValues?.price ?? "",
    country: initialValues?.country || "",
    location: initialValues?.location || "",
    category: initialValues?.category || "Trending",
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity() || (!isEdit && !imageFile)) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    const payload = new FormData();
    payload.append("title", formData.title.trim());
    payload.append("description", formData.description.trim());
    payload.append("price", String(formData.price));
    payload.append("country", formData.country.trim());
    payload.append("location", formData.location.trim());
    payload.append("category", formData.category);
    if (imageFile) {
      payload.append("image", imageFile);
    }

    onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`needs-validation ${validated ? "was-validated" : ""}`}
    >
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="mb-3">
        <label htmlFor="title" className="form-label">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="Enter a catchy title"
          className="form-control"
          value={formData.title}
          onChange={handleChange}
          required
          minLength={2}
        />
        <div className="invalid-feedback">Please enter a valid title.</div>
      </div>

      <div className="mb-3">
        <label htmlFor="description" className="form-label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          placeholder="Describe your place"
          className="form-control"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          required
          minLength={5}
        />
        <div className="invalid-feedback">
          Please enter a valid description (at least 5 characters).
        </div>
      </div>

      {(previewUrl || existingImageUrl) && (
        <div className="mb-3">
          <div className="form-label text-muted small">
            {previewUrl ? "Selected Image Preview" : "Current Listing Image"}
          </div>
          <img
            src={previewUrl || existingImageUrl}
            alt="Listing preview"
            className="rounded border"
            style={{ maxWidth: "250px", maxHeight: "180px", objectFit: "cover" }}
          />
        </div>
      )}

      <div className="mb-3">
        <label htmlFor="image" className="form-label">
          {isEdit ? "Upload New Image (optional)" : "Upload Listing Image"}
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="form-control"
          onChange={handleFileChange}
          required={!isEdit}
        />
        <div className="invalid-feedback">
          Please select a valid PNG, JPG, or WEBP image.
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col-md-4">
          <label htmlFor="price" className="form-label">
            Price (per night)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            placeholder="1200"
            className="form-control"
            value={formData.price}
            onChange={handleChange}
            required
          />
          <div className="invalid-feedback">Please enter a valid price.</div>
        </div>

        <div className="mb-3 col-md-4">
          <label htmlFor="category" className="form-label">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="form-select"
            value={formData.category}
            onChange={handleChange}
          >
            {LISTING_CATEGORIES.map((cat) => (
              <option key={cat.label} value={cat.label}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3 col-md-4">
          <label htmlFor="country" className="form-label">
            Country
          </label>
          <input
            id="country"
            name="country"
            type="text"
            placeholder="India"
            className="form-control"
            value={formData.country}
            onChange={handleChange}
            required
          />
          <div className="invalid-feedback">Country name is required.</div>
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="location" className="form-label">
          Location
        </label>
        <input
          id="location"
          name="location"
          type="text"
          placeholder="Jaipur, Rajasthan"
          className="form-control"
          value={formData.location}
          onChange={handleChange}
          required
        />
        <div className="invalid-feedback">Location is required.</div>
      </div>

      <button
        type="submit"
        className={`btn btn-dark mt-2 ${isEdit ? "edit-btn" : "add-btn"}`}
        disabled={submitting}
      >
        {submitting
          ? isEdit
            ? "Saving..."
            : "Creating..."
          : isEdit
          ? "Save Changes"
          : "Add Listing"}
      </button>
    </form>
  );
}
