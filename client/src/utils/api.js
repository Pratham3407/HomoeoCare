import API_URL from "../config";
import { handleApiResponse } from "./errors";

const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please sign in again.";

/**
 * A wrapper around the standard fetch API that automatically adds the Authorization header
 * and handles 401 Unauthorized responses by redirecting to login.
 * Returns a standardized result: { ok, message, data, fieldErrors }
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

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // If we have a logout function passed (e.g., from context), call it
      if (logoutFn) {
        logoutFn(true, SESSION_EXPIRED_MESSAGE);
      } else {
        // Fallback for forcing a logout and reload if logoutFn is not provided
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.reload();
      }
      return {
        ok: false,
        message: SESSION_EXPIRED_MESSAGE,
        data: null,
        fieldErrors: {},
      };
    }

    return await handleApiResponse(response);
  } catch {
    // Network or connection failure
    return {
      ok: false,
      message: "Unable to connect. Please check your internet and try again.",
      data: null,
      fieldErrors: {},
    };
  }
};