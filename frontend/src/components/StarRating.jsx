export default function StarRating({
  value = 5,
  onChange,
  readOnly = false,
}) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div
      className="d-inline-flex align-items-center gap-1"
      role={readOnly ? "img" : "radiogroup"}
      aria-label={`Rating: ${value} out of 5 stars`}
    >
      {stars.map((star) => {
        const filled = star <= value;
        if (readOnly) {
          return (
            <i
              key={star}
              className={`${
                filled ? "fa-solid" : "fa-regular"
              } fa-star star-icon`}
            />
          );
        }

        return (
          <button
            key={star}
            type="button"
            className="btn btn-link p-0 border-0 text-decoration-none star-btn"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => onChange?.(star)}
          >
            <i
              className={`${
                filled ? "fa-solid" : "fa-regular"
              } fa-star star-icon fs-4`}
            />
          </button>
        );
      })}
    </div>
  );
}
