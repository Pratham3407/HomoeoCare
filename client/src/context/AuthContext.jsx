import { createContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import API_URL from "../config";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (err) {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const [showReloginModal, setShowReloginModal] = useState(false);
  const [reloginPassword, setReloginPassword] = useState("");
  const [isReloggingIn, setIsReloggingIn] = useState(false);

  const login = (userData, userToken) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userToken);
    setUser(userData);
    setToken(userToken);
    setShowReloginModal(false);
  };

  const logout = (showToast = false, message = "Logged out") => {
    // If it's a doctor session expiry, show modal instead of completely logging out
    if (message.includes("Session expired") && user?.role === "doctor") {
      setShowReloginModal(true);
      if (showToast) {
        toast.error("Session expired, please re-authenticate to continue");
      }
      return;
    }

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    setShowReloginModal(false);
    if (showToast) {
       toast.error(message);
    }
  };

  // Simple token decoding wrapper (does not verify signature, just gets payload)
  const isTokenExpired = (t) => {
    if (!t) return true;
    try {
      const payloadBase64 = t.split('.')[1];
      const decodedJson = atob(payloadBase64);
      const decoded = JSON.parse(decodedJson);
      const exp = decoded.exp;
      const expired = (Date.now() >= exp * 1000);
      return expired;
    } catch (e) {
      return true;
    }
  };

  useEffect(() => {
    if (token && isTokenExpired(token)) {
      logout(true, "Session expired, please log in again");
    }
  }, [token]);

  const handleReloginSubmit = async (e) => {
    e.preventDefault();
    setIsReloggingIn(true);
    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, password: reloginPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        toast.success("Re-authenticated successfully! You can resume.");
        setReloginPassword("");
      } else {
        toast.error("Incorrect password");
      }
    } catch (err) {
      toast.error("Error re-authenticating");
    } finally {
      setIsReloggingIn(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
      {showReloginModal && user && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "#fff", padding: "30px", borderRadius: "12px",
            width: "90%", maxWidth: "400px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
          }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>Session Expired</h3>
            <p style={{ margin: "0 0 20px 0", color: "#666", fontSize: "0.95rem" }}>
              Please re-enter your password for <strong>{user.email}</strong> to continue where you left off.
            </p>
            <form onSubmit={handleReloginSubmit}>
              <input
                type="password"
                placeholder="Enter password"
                value={reloginPassword}
                onChange={(e) => setReloginPassword(e.target.value)}
                style={{
                  width: "100%", padding: "12px", border: "1px solid #ddd",
                  borderRadius: "6px", marginBottom: "20px", fontSize: "1rem"
                }}
                required
                autoFocus
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  disabled={isReloggingIn}
                  style={{
                    flex: 1, padding: "12px", background: "#3498db", color: "#fff",
                    border: "none", borderRadius: "6px", cursor: isReloggingIn ? "not-allowed" : "pointer",
                    fontWeight: "600"
                  }}
                >
                  {isReloggingIn ? "Authenticating..." : "Resume Session"}
                </button>
                <button
                  type="button"
                  disabled={isReloggingIn}
                  onClick={() => {
                    setShowReloginModal(false);
                    // Force complete logout if they cancel
                    logout(true, "Logged out manually");
                  }}
                  style={{
                    padding: "12px", background: "#f8d7da", color: "#c0392b",
                    border: "none", borderRadius: "6px", cursor: isReloggingIn ? "not-allowed" : "pointer"
                  }}
                >
                  Log out completely
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
