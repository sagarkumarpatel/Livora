import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFlash } from "../context/FlashContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { showSuccess } = useFlash();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.get("search") || "");

  useEffect(() => {
    setSearchText(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchText.trim();
    if (trimmed) {
      navigate(`/listings?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/listings");
    }
  };

  const handleLogout = async () => {
    await logout();
    showSuccess("You are logged out!");
    navigate("/listings");
  };

  return (
    <nav className="navbar navbar-expand-md bg-body-light border-bottom sticky-top">
      <div className="container-fluid px-3">
        <Link className="navbar-brand" to="/listings" aria-label="Livora Home">
          <i className="fa-solid fa-compass" />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNavAltMarkup"
          aria-controls="navbarNavAltMarkup"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
          <div className="navbar-nav">
            <Link className="nav-link" to="/listings">
              Explore
            </Link>
          </div>

          <div className="navbar-nav ms-auto my-2 my-md-0">
            <form
              className="d-flex"
              role="search"
              onSubmit={handleSearchSubmit}
            >
              <input
                className="form-control me-2 search-inpt"
                type="search"
                placeholder="Search destinations"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <button className="btn search-btn" type="submit">
                <i className="fa-solid fa-magnifying-glass" />
                Search
              </button>
            </form>
          </div>

          <div className="navbar-nav ms-auto align-items-md-center">
            <Link className="nav-link" to="/listings/new">
              Add your home
            </Link>
            {!user ? (
              <>
                <Link className="nav-link fw-semibold" to="/signup">
                  Sign Up
                </Link>
                <Link className="nav-link fw-semibold" to="/login">
                  Log in
                </Link>
              </>
            ) : (
              <>
                <span className="nav-link text-muted small">
                  Hi, <b>@{user.username}</b>
                </span>
                <button
                  type="button"
                  className="nav-link btn btn-link fw-semibold text-start"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
