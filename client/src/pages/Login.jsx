import { useState, useContext } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import "../styles/login.css";
import { AuthContext } from "../context/AuthContext";
import API_URL from "../config";

function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Login successful!");
        login(data.user, data.token);
        
        if (data.user.role === "doctor") {
          setTimeout(() => navigate("/doctor/dashboard"), 1500);
        } else {
          setTimeout(() => navigate("/"), 1500);
        }
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (error) {
      toast.error("An error occurred during login");
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error("Please enter your email");

    setIsSending(true);
    try {
      const response = await fetch(`${API_URL}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setShowForgot(false);
        setForgotEmail("");
      } else {
        toast.error(data.message || "Failed to reset password");
      }
    } catch (error) {
      toast.error("An error occurred while sending the email");
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

            <form className="login-form" onSubmit={handleForgotSubmit}>
              <label>Registered Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              <button className="login-btn" disabled={isSending}>
                {isSending ? "Sending..." : "Send Password"}
              </button>
            </form>

            <p className="login-register" style={{ cursor: "pointer", color: "#2980b9", textAlign: "center", display: "block", marginTop: "15px" }} onClick={() => setShowForgot(false)}>
              Back to Login
            </p>
          </>
        ) : (
          <>
            <h2>Login</h2>
            <p className="login-sub">Access your HomeoCare account</p>

            <form className="login-form" onSubmit={handleSubmit}>
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button className="login-btn">Login</button>
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
