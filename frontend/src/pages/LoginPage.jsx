import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useFlash } from "../context/FlashContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showSuccess } = useFlash();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [validated, setValidated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = location.state?.from || "/listings";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      setValidated(true);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await login({ username: username.trim(), password });
      showSuccess("Welcome back to Livora!");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid username or password."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="row mt-4 mb-5">
      <div className="col-md-6 offset-md-3">
        <h1 className="mb-4">Login</h1>
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
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <div className="invalid-feedback">Username is required.</div>
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="invalid-feedback">Password is required.</div>
          </div>

          <button
            type="submit"
            className="btn btn-success"
            disabled={submitting}
          >
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-3 text-muted small">
          New to Livora? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
