import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFlash } from "../context/FlashContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { showError } = useFlash();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      showError("You must be logged in to continue.");
    }
  }, [loading, user, showError]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
