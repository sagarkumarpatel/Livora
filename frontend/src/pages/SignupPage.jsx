import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useFlash } from "../context/FlashContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { showSuccess } = useFlash();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validated, setValidated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      setValidated(true);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await signup({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      showSuccess("Welcome to Livora!");
      navigate("/listings", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Signup failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="row mt-4 mb-5">
      <div className="col-md-6 offset-md-3">
        <h1 className="mb-4">SignUp on Livora</h1>
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
              minLength={3}
            />
            <div className="invalid-feedback">
              Username must be at least 3 characters.
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="invalid-feedback">
              Please enter a valid email address.
            </div>
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
              minLength={6}
            />
            <div className="invalid-feedback">
              Password must be at least 6 characters.
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success"
            disabled={submitting}
          >
            {submitting ? "Creating account..." : "SignUp"}
          </button>
        </form>

        <p className="mt-3 text-muted small">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
