import API_URL from "../config";

/**
 * A wrapper around the standard fetch API that automatically adds the Authorization header
 * and handles 401 Unauthorized responses by redirecting to login.
 */
export const apiFetch = async (endpoint, options = {}, logoutFn = null) => {
  const token = localStorage.getItem("token");

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Ensure Content-Type is set if body is provided and not already set
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If we have a logout function passed (e.g., from context), call it
    if (logoutFn) {
      logoutFn(true, "Session expired, please log in again");
    } else {
        // Fallback for forcing a logout and reload if logoutFn is not provided
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.reload();
    }
    // We can also throw an error to prevent the rest of the promise chain from executing
    throw new Error("Unauthorized");
  }

  return response;
};
