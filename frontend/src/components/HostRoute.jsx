import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFlash } from "../context/FlashContext";

export default function HostRoute({ children }) {
  const { user, loading } = useAuth();
  const { showError } = useFlash();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      showError("Please log in to continue.");
    } else if (!user.isHost) {
      showError("Please complete host onboarding to access host features.");
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

  if (!user.isHost) {
    return <Navigate to="/become-a-host" replace />;
  }

  return children;
}
