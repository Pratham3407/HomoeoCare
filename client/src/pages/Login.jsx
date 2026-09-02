import { useState, useContext } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import "../styles/login.css";
import "../styles/error-states.css";
import { AuthContext } from "../context/AuthContext";
import API_URL from "../config";
import { validate, handleApiResponse } from "../utils/errors";

function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotErrors, setForgotErrors] = useState({});
  const [isSending, setIsSending] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const focusFirstError = (errorObj) => {
    const firstKey = Object.keys(errorObj)[0];
    if (!firstKey) return;
    const map = {
      email: "login-email",
      forgotEmail: "forgot-email",
      password: "login-password",
    };
    const el = document.getElementById(map[firstKey]);
    if (el) setTimeout(() => el.focus(), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const fieldErrors = {};
    const emailError = validate.email(email);
    const passwordError = validate.password(password);
    if (emailError) fieldErrors.email = emailError;
    if (passwordError) fieldErrors.password = passwordError;

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      focusFirstError(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const { ok, message, data, fieldErrors: serverErrors } = await handleApiResponse(response);

      if (ok) {
        toast.success("Welcome back!");
        login(data.user, data.token);
        if (data.user.role === "doctor") {
          setTimeout(() => navigate("/doctor/dashboard"), 1000);
        } else {
          setTimeout(() => navigate("/"), 1000);
        }
      } else {
        // Show server field-level errors if present, otherwise toast the message
        if (serverErrors && Object.keys(serverErrors).length > 0) {
          setErrors(serverErrors);
        } else {
          setErrors({});
          toast.error(message);
        }
      }
    } catch {
      toast.error("We couldn't sign you in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();

    const fieldErrors = {};
    const emailError = validate.email(forgotEmail);
    if (emailError) fieldErrors.forgotEmail = emailError;

    if (Object.keys(fieldErrors).length > 0) {
      setForgotErrors(fieldErrors);
      const el = document.getElementById("forgot-email");
      if (el) setTimeout(() => el.focus(), 0);
      return;
    }

    setForgotErrors({});
    setIsSending(true);
    try {
      const response = await fetch(`${API_URL}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const { ok, message } = await handleApiResponse(response, "We couldn't process your request right now. Please try again.");

      if (ok) {
        toast.success(message);
        setShowForgot(false);
        setForgotEmail("");
      } else {
        toast.error(message);
      }
    } catch {
      toast.error("We couldn't process your request right now. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-container">
        {showForgot ? (
          <>
            <h2>Forgot Password</h2>
            <p className="login-sub">Enter your email to receive a temporary password</p>

            <form className="login-form" onSubmit={handleForgotSubmit} noValidate>
              <label htmlFor="forgot-email">Registered Email</label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => {
                  setForgotEmail(e.target.value);
                  if (forgotErrors.forgotEmail) {
                    setForgotErrors((prev) => ({ ...prev, forgotEmail: undefined }));
                  }
                }}
                aria-invalid={forgotErrors.forgotEmail ? "true" : "false"}
                aria-describedby={forgotErrors.forgotEmail ? "forgot-email-error" : undefined}
                className={forgotErrors.forgotEmail ? "input-error" : ""}
              />
              {forgotErrors.forgotEmail && (
                <p id="forgot-email-error" className="field-error" role="alert">
                  {forgotErrors.forgotEmail}
                </p>
              )}
              <button className="login-btn" disabled={isSending}>
                {isSending ? "Sending..." : "Send Password"}
              </button>
            </form>

            <p className="login-register" style={{ cursor: "pointer", color: "#2980b9", textAlign: "center", display: "block", marginTop: "15px" }} onClick={() => { setShowForgot(false); setForgotErrors({}); }}>
              Back to Login
            </p>
          </>
        ) : (
          <>
            <h2>Login</h2>
            <p className="login-sub">Access your HomeoCare account</p>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && (
                <p id="login-email-error" className="field-error" role="alert">
                  {errors.email}
                </p>
              )}

              <label htmlFor="login-password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                  className={errors.password ? "input-error password-input" : password ? "" : ""}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" className="field-error" role="alert">
                  {errors.password}
                </p>
              )}

              <button className="login-btn" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Login"}
              </button>
            </form>

            <p className="login-register" style={{ textAlign: "right", marginTop: "10px", marginBottom: "20px" }}>
              <span style={{ cursor: "pointer", color: "#e74c3c", fontSize: "0.9rem" }} onClick={() => setShowForgot(true)}>
                Forgot Password?
              </span>
            </p>

            <p className="login-register">
              Don't have an account?
              <span>
                <Link to="/register">Register</Link>
              </span>
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export default Login;