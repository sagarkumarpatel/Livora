import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FlashBanner from "./components/FlashBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import ListingsPage from "./pages/ListingsPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import CreateListingPage from "./pages/CreateListingPage";
import EditListingPage from "./pages/EditListingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import StaticInfoPage from "./pages/StaticInfoPage";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="container app-main">
        <FlashBanner />
        <Routes>
          <Route path="/" element={<Navigate to="/listings" replace />} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route
            path="/listings/new"
            element={
              <ProtectedRoute>
                <CreateListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/listings/:id/edit"
            element={
              <ProtectedRoute>
                <EditListingPage />
              </ProtectedRoute>
            }
          />
          <Route path="/listings/:id" element={<ListingDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/privacy"
            element={
              <StaticInfoPage
                title="Privacy Policy"
                description="Livora respects your privacy. User account credentials, uploaded listing images (hosted via Cloudinary), and reviews are stored securely for platform operation."
              />
            }
          />
          <Route
            path="/terms"
            element={
              <StaticInfoPage
                title="Terms of Service"
                description="By listing or reviewing properties on Livora, you agree to provide accurate property information and respectful community reviews."
              />
            }
          />
          <Route
            path="*"
            element={
              <StaticInfoPage
                title="Page Not Found"
                description="The page you requested does not exist."
              />
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
