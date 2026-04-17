import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import "../styles/register.css";
import API_URL from "../config";
import { AuthContext } from "../context/AuthContext";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userData = {
      name,
      email,
      password,
    };

    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Registration successful!");
        login(data.user, data.token);
        setTimeout(() => navigate("/"), 1500);
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      toast.error("An error occurred during registration");
    }
  };

  return (
    <motion.section
      className="register-page"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.4 }}
    >
      <div className="register-container">
        <h2>Create Account</h2>

        {/* Attach handleSubmit here */}
        <form className="register-form" onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            type="text"
            autoFocus
            placeholder="Enter your full name"
            onChange={(e) => setName(e.target.value)}
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Create password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="register-btn">Register</button>
        </form>
        <p className="login-register">
          Already have an account?
          <span>
            <Link to="/login">Login</Link>
          </span>
        </p>
      </div>
    </motion.section>
  );
}

export default Register;
