import { useEffect, useState } from "react";
import {
  AMENITY_OPTIONS,
  LISTING_CATEGORIES,
  LISTING_STATUSES,
  PROPERTY_TYPES,
} from "../constants/categories";

export default function ListingForm({
  initialValues,
  isEdit = false,
  submitting = false,
  error = "",
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    price: initialValues?.price ?? "",
    cleaningFee: initialValues?.cleaningFee ?? 0,
    country: initialValues?.country || "",
    location: initialValues?.location || "",
    category: initialValues?.category || "Trending",
    propertyType: initialValues?.propertyType || "Entire home",
    maxGuests: initialValues?.maxGuests ?? 2,
    bedrooms: initialValues?.bedrooms ?? 1,
    bathrooms: initialValues?.bathrooms ?? 1,
    status: initialValues?.status || "published",
    amenities: Array.isArray(initialValues?.amenities)
      ? initialValues.amenities
      : [],
  });

  const existingImages =
    initialValues?.images?.length > 0
      ? initialValues.images
      : initialValues?.image?.url
      ? [initialValues.image]
      : [];

  const [removedFilenames, setRemovedFilenames] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if (newFiles.length === 0) {
      setPreviews([]);
      return;
    }
    const urls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newFiles]);

  const remainingExistingImages = existingImages.filter((img) => {
    const key = img.filename || img.url;
    return !removedFilenames.includes(key);
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 8);
    setNewFiles(files);
  };

  const toggleRemoveExisting = (img) => {
    const key = img.filename || img.url;
    setRemovedFilenames((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const totalImageCount = remainingExistingImages.length + newFiles.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity() || totalImageCount === 0) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    const payload = new FormData();
    payload.append("title", formData.title.trim());
    payload.append("description", formData.description.trim());
    payload.append("price", String(formData.price));
    payload.append("cleaningFee", String(formData.cleaningFee || 0));
    payload.append("country", formData.country.trim());
    payload.append("location", formData.location.trim());
    payload.append("category", formData.category);
    payload.append("propertyType", formData.propertyType);
    payload.append("maxGuests", String(formData.maxGuests));
    payload.append("bedrooms", String(formData.bedrooms));
    payload.append("bathrooms", String(formData.bathrooms));
    payload.append("status", formData.status);
    payload.append("amenities", JSON.stringify(formData.amenities));

    if (removedFilenames.length > 0) {
      payload.append("removedImageFilenames", JSON.stringify(removedFilenames));
    }

    newFiles.forEach((file) => {
      payload.append("images", file);
    });

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
          Property Title
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
          placeholder="Describe your property, highlights, and neighborhood"
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

      {/* Existing images on edit */}
      {isEdit && existingImages.length > 0 && (
        <div className="mb-3">
          <div className="form-label small text-muted">
            Current Images (click remove to drop an image)
          </div>
          <div className="d-flex flex-wrap gap-3">
            {existingImages.map((img, idx) => {
              const key = img.filename || img.url;
              const isMarkedRemoved = removedFilenames.includes(key);
              const thumbUrl = img.url?.includes("/upload")
                ? img.url.replace("/upload", "/upload/w_250")
                : img.url;

              return (
                <div
                  key={key || idx}
                  className={`position-relative border rounded p-1 ${
                    isMarkedRemoved ? "opacity-50" : ""
                  }`}
                >
                  <img
                    src={thumbUrl}
                    alt={`Existing ${idx + 1}`}
                    className="rounded"
                    style={{
                      width: "140px",
                      height: "100px",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    type="button"
                    className={`btn btn-sm position-absolute top-0 end-0 m-1 ${
                      isMarkedRemoved ? "btn-secondary" : "btn-danger"
                    }`}
                    onClick={() => toggleRemoveExisting(img)}
                  >
                    {isMarkedRemoved ? "Undo" : "×"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Newly selected previews */}
      {previews.length > 0 && (
        <div className="mb-3">
          <div className="form-label small text-muted">
            New Image Previews ({previews.length})
          </div>
          <div className="d-flex flex-wrap gap-2">
            {previews.map((url, idx) => (
              <img
                key={url}
                src={url}
                alt={`Preview ${idx + 1}`}
                className="rounded border"
                style={{ width: "130px", height: "95px", objectFit: "cover" }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-3">
        <label htmlFor="images" className="form-label">
          {isEdit
            ? "Upload Additional Images (up to 8)"
            : "Upload Property Images (1 to 8 images)"}
        </label>
        <input
          id="images"
          name="images"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className={`form-control ${
            validated && totalImageCount === 0 ? "is-invalid" : ""
          }`}
          onChange={handleFileChange}
        />
        <div className="invalid-feedback">
          Please keep or upload at least one PNG, JPG, or WEBP image.
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col-md-4">
          <label htmlFor="price" className="form-label">
            Price per night (&#8377;)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            placeholder="2500"
            className="form-control"
            value={formData.price}
            onChange={handleChange}
            required
          />
          <div className="invalid-feedback">Please enter a valid price.</div>
        </div>

        <div className="mb-3 col-md-4">
          <label htmlFor="cleaningFee" className="form-label">
            Cleaning fee (&#8377;)
          </label>
          <input
            id="cleaningFee"
            name="cleaningFee"
            type="number"
            min={0}
            className="form-control"
            value={formData.cleaningFee}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3 col-md-4">
          <label htmlFor="status" className="form-label">
            Listing Status
          </label>
          <select
            id="status"
            name="status"
            className="form-select"
            value={formData.status}
            onChange={handleChange}
          >
            {LISTING_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col-md-6">
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

        <div className="mb-3 col-md-6">
          <label htmlFor="propertyType" className="form-label">
            Property Type
          </label>
          <select
            id="propertyType"
            name="propertyType"
            className="form-select"
            value={formData.propertyType}
            onChange={handleChange}
          >
            {PROPERTY_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col-md-4">
          <label htmlFor="maxGuests" className="form-label">
            Max Guests
          </label>
          <input
            id="maxGuests"
            name="maxGuests"
            type="number"
            min={1}
            max={30}
            className="form-control"
            value={formData.maxGuests}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3 col-md-4">
          <label htmlFor="bedrooms" className="form-label">
            Bedrooms
          </label>
          <input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min={0}
            max={30}
            className="form-control"
            value={formData.bedrooms}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3 col-md-4">
          <label htmlFor="bathrooms" className="form-label">
            Bathrooms
          </label>
          <input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min={0}
            max={30}
            step="0.5"
            className="form-control"
            value={formData.bathrooms}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col-md-6">
          <label htmlFor="location" className="form-label">
            Location (City / Area)
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

        <div className="mb-3 col-md-6">
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

      <div className="mb-4">
        <label className="form-label d-block">Available Amenities</label>
        <div className="row row-cols-2 row-cols-md-3 g-2">
          {AMENITY_OPTIONS.map((amenity) => {
            const checked = formData.amenities.includes(amenity);
            return (
              <div key={amenity} className="col">
                <div className="form-check">
                  <input
                    id={`amenity-${amenity}`}
                    type="checkbox"
                    className="form-check-input"
                    checked={checked}
                    onChange={() => handleAmenityToggle(amenity)}
                  />
                  <label
                    htmlFor={`amenity-${amenity}`}
                    className="form-check-label small"
                  >
                    {amenity}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        className={`btn btn-dark mt-2 px-4 ${isEdit ? "edit-btn" : "add-btn"}`}
        disabled={submitting}
      >
        {submitting
          ? isEdit
            ? "Saving..."
            : "Creating..."
          : isEdit
          ? "Save Changes"
          : "Publish Listing"}
      </button>
    </form>
  );
}
