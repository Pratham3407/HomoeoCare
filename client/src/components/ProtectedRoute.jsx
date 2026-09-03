import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * Render-time route guard. Verifies authentication on every render so that
 * navigating directly to a protected URL, pressing Back, or refreshing after
 * logout all re-check the session and redirect to the login page. This does
 * not rely on a post-logout redirect or a one-time effect.
 *
 * @param {object} props.children The protected page to render when authorized.
 * @param {string} [props.role] Optional required role (e.g. "doctor").
 */
function ProtectedRoute({ children, role }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;