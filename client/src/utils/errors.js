/**
 * Centralized frontend error handling utilities.
 * Translates API errors and raw errors into user-friendly messages.
 */

/**
 * Human-readable HTTP status code messages.
 */
const HTTP_MESSAGES = {
  400: "Please check your input and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to perform this action.",
  404: "We couldn't find what you're looking for.",
  409: "This information already exists.",
  422: "Please check your input and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our side. Please try again.",
  502: "The service is temporarily unavailable. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly.",
  504: "The service is temporarily unavailable. Please try again shortly.",
};

/**
 * Patterns that should NEVER be shown to users.
 * If a message matches any of these, it is considered raw/technical.
 */
const TECHNICAL_PATTERNS = [
  /validation failed/i,
  /Path `[^`]+` is (required|invalid)/i,
  /Cast to \w+ failed/i,
  /MongoServerError/i,
  /MongoNetworkError/i,
  /Cannot read propert/i,
  /is not a function/i,
  /undefined is not/i,
  /null is not/i,
  /SyntaxError/i,
  /TypeError/i,
  /ReferenceError/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /ENOTFOUND/i,
  /Internal Server Error/i,
  /UnhandledPromiseRejection/i,
  /error\.message/i,
  /stack trace/i,
  /at \w+\.\w+ \(/i,
  /node_modules/i,
  /\.js:\d+:\d+/i,
  /MongooseError/i,
  /ValidatorError/i,
  /user validation/i,
  /duplicate key/i,
  /index:/i,
];

/**
 * Checks if a message is likely a raw/technical error that should not be shown to users.
 */
export function isTechnicalMessage(message) {
  if (!message || typeof message !== "string") return false;
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Extracts a clean error message from an API response.
 * If the response contains a user-friendly message, returns it.
 * If it contains a technical message, returns a fallback.
 */
export function extractErrorMessage(data, fallback = "Something went wrong. Please try again.") {
  if (!data) return fallback;

  const message = data.message;
  if (message && typeof message === "string" && !isTechnicalMessage(message)) {
    return message;
  }

  return fallback;
}

/**
 * Handles an API response and returns a standardized result.
 * Returns { ok, message, data, fieldErrors }
 */
export async function handleApiResponse(response, fallbackMessage) {
  let data;
  try {
    data = await response.json();
  } catch {
    return {
      ok: false,
      message: "Something went wrong. Please try again.",
      data: null,
      fieldErrors: {},
    };
  }

  if (response.ok) {
    return {
      ok: true,
      message: data.message || "Success!",
      data,
      fieldErrors: {},
    };
  }

  const message = extractErrorMessage(data, fallbackMessage || HTTP_MESSAGES[response.status] || "Something went wrong. Please try again.");
  const fieldErrors = data.fieldErrors || {};

  return {
    ok: false,
    message,
    data,
    fieldErrors,
  };
}

/**
 * Wraps a fetch call with standardized error handling.
 * Use this for simple cases where you just need the result.
 */
export async function apiRequest(url, options = {}, fallbackMessage) {
  try {
    const response = await fetch(url, options);
    return await handleApiResponse(response, fallbackMessage);
  } catch (error) {
    // Network error or other fetch failure
    if (error.message === "Unauthorized") {
      return {
        ok: false,
        message: "Your session has expired. Please sign in again.",
        data: null,
        fieldErrors: {},
      };
    }
    return {
      ok: false,
      message: "Unable to connect. Please check your internet and try again.",
      data: null,
      fieldErrors: {},
    };
  }
}

/**
 * Client-side validation helpers.
 * Each returns null if valid, or an error message string if invalid.
 */
export const validate = {
  required(value, fieldName) {
    if (!value || (typeof value === "string" && !value.trim())) {
      return `Please enter your ${fieldName}.`;
    }
    return null;
  },

  email(value) {
    if (!value || !value.trim()) {
      return "Please enter your email address.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return "Please enter a valid email address.";
    }
    return null;
  },

  name(value) {
    if (!value || !value.trim()) {
      return "Please enter your name.";
    }
    if (value.trim().length < 2) {
      return "Name must be at least 2 characters long.";
    }
    return null;
  },

  password(value) {
    if (!value) {
      return "Please enter a password.";
    }
    if (value.length < 6) {
      return "Password must be at least 6 characters long.";
    }
    return null;
  },

  passwordConfirm(value, password) {
    if (!value) {
      return "Please confirm your password.";
    }
    if (value !== password) {
      return "Passwords do not match.";
    }
    return null;
  },

  phone(value) {
    if (!value || !value.trim()) {
      return "Please enter your phone number.";
    }
    const phoneRegex = /^[+]?[\d\s\-()]{7,15}$/;
    if (!phoneRegex.test(value.trim())) {
      return "Please enter a valid phone number.";
    }
    return null;
  },

  date(value) {
    if (!value) {
      return "Please select a date.";
    }
    return null;
  },

  time(value) {
    if (!value) {
      return "Please select a time.";
    }
    return null;
  },

  select(value) {
    if (!value) {
      return "Please select an option.";
    }
    return null;
  },

  message(value) {
    if (!value || !value.trim()) {
      return "Please enter a message.";
    }
    return null;
  },

  maxLength(value, max, fieldName) {
    if (value && value.length > max) {
      return `${fieldName} must be no more than ${max} characters.`;
    }
    return null;
  },

  fileSize(file, maxMB = 25) {
    if (!file) {
      return "Please select a file.";
    }
    if (file.size > maxMB * 1024 * 1024) {
      return `File size must be less than ${maxMB}MB.`;
    }
    return null;
  },

  price(value) {
    if (value === "" || value === null || value === undefined) {
      return "Please enter a price.";
    }
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      return "Please enter a valid price.";
    }
    return null;
  },

  stock(value) {
    if (value === "" || value === null || value === undefined) {
      return "Please enter the stock quantity.";
    }
    const num = Number(value);
    if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
      return "Please enter a valid stock quantity.";
    }
    return null;
  },

  pincode(value) {
    if (!value || !value.trim()) {
      return "Please enter your pincode.";
    }
    const pinRegex = /^\d{4,10}$/;
    if (!pinRegex.test(value.trim())) {
      return "Please enter a valid pincode.";
    }
    return null;
  },
};

/**
 * Validates an entire form object against a set of rules.
 * rules: { fieldName: [validatorFn1, validatorFn2, ...] }
 * Returns { isValid, errors } where errors is { fieldName: errorMessage }
 */
export function validateForm(rules) {
  const errors = {};
  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      const error = validator();
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
