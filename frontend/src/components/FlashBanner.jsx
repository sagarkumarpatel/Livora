import { useEffect } from "react";
import { useFlash } from "../context/FlashContext";

export default function FlashBanner() {
  const { flash, clearFlash } = useFlash();

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => clearFlash(), 4500);
    return () => clearTimeout(timer);
  }, [flash, clearFlash]);

  if (!flash) return null;

  return (
    <div className="row mt-3">
      <div
        className={`alert alert-${flash.type} alert-dismissible fade show col-md-6 offset-md-3`}
        role="alert"
      >
        {flash.message}
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={clearFlash}
        />
      </div>
    </div>
  );
}
