const ERROR_MESSAGES = {
  // Mongoose validation field mappings
  "name": {
    required: "Please enter your name.",
    minlength: "Name must be at least {MINLENGTH} characters long.",
    maxlength: "Name must be no more than {MAXLENGTH} characters.",
    default: "Please enter a valid name.",
  },
  "email": {
    required: "Please enter your email address.",
    invalid: "Please enter a valid email address.",
    default: "Please enter a valid email address.",
  },
  "password": {
    required: "Please enter a password.",
    minlength: "Password must be at least 8 characters long.",
    default: "Please enter a valid password.",
  },
  "role": {
    invalid: "Please select a valid account type.",
    default: "Please select a valid account type.",
  },
  "date": {
    required: "Please select a date.",
    invalid: "Please select a valid date.",
    default: "Please select a valid date.",
  },
  "time": {
    required: "Please select a time.",
    invalid: "Please select a valid time.",
    default: "Please select a valid time.",
  },
  "patientId": {
    required: "Patient information is required.",
    default: "Patient information is required.",
  },
  "fileUrl": {
    required: "Please upload a file.",
    default: "Please upload a file.",
  },
  "reportName": {
    required: "Please enter a report name.",
    default: "Please enter a report name.",
  },
};

const HTTP_STATUS_MESSAGES = {
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
 * Translates a Mongoose ValidationError into a structured, user-friendly response.
 */
function handleMongooseValidation(err) {
  const fieldErrors = {};
  let generalMessage = "Please complete the required fields.";

  if (err.errors) {
    for (const [field, error] of Object.entries(err.errors)) {
      const cleanField = field.split(".")[0];
      const fieldConfig = ERROR_MESSAGES[cleanField];

      if (error.kind === "required" && fieldConfig?.required) {
        fieldErrors[cleanField] = fieldConfig.required;
      } else if (error.kind === "minlength" && fieldConfig?.minlength) {
        const min = error.properties?.minlength || error.properties?.min;
        fieldErrors[cleanField] = fieldConfig.minlength.replace("{MINLENGTH}", min);
      } else if (error.kind === "maxlength" && fieldConfig?.maxlength) {
        const max = error.properties?.maxlength || error.properties?.max;
        fieldErrors[cleanField] = fieldConfig.maxlength.replace("{MAXLENGTH}", max);
      } else if (error.kind === "enum" || error.kind === "regexp") {
        fieldErrors[cleanField] = fieldConfig?.invalid || fieldConfig?.default || "Please provide a valid value.";
      } else {
        fieldErrors[cleanField] = fieldConfig?.default || "Please provide a valid value.";
      }
    }

    const firstField = Object.keys(fieldErrors)[0];
    if (firstField) {
      generalMessage = fieldErrors[firstField];
    }
  }

  return { message: generalMessage, fieldErrors };
}

/**
 * Translates a Mongoose duplicate key error (code 11000) into a user-friendly response.
 */
function handleDuplicateKey(err) {
  const keyPattern = err.keyPattern || {};
  const keyValue = err.keyValue || {};

  if (keyPattern.email || keyValue.email) {
    return {
      message: "An account with this email already exists. Please sign in instead.",
      fieldErrors: { email: "An account with this email already exists. Please sign in instead." },
    };
  }

  return {
    message: "This information already exists in our system.",
    fieldErrors: {},
  };
}

/**
 * Translates a Mongoose CastError (e.g., invalid ObjectId) into a user-friendly response.
 */
function handleCastError() {
  return {
    message: "The information you're looking for could not be found.",
    fieldErrors: {},
  };
}

/**
 * Global Express error-handling middleware.
 * Must have 4 parameters for Express to recognize it as error middleware.
 */
function errorHandler(err, req, res, _next) {
  // Log detailed error server-side (never exposed to client)
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const { message, fieldErrors } = handleMongooseValidation(err);
    return res.status(400).json({
      success: false,
      message,
      fieldErrors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const { message, fieldErrors } = handleDuplicateKey(err);
    return res.status(409).json({
      success: false,
      message,
      fieldErrors,
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: handleCastError().message,
      fieldErrors: {},
    });
  }

  // Multer file upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "The file is too large. Please upload a file smaller than 25MB.",
      fieldErrors: {},
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Unexpected file field. Please try again.",
      fieldErrors: {},
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Your session is invalid. Please sign in again.",
      fieldErrors: {},
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please sign in again.",
      fieldErrors: {},
    });
  }

  // Custom status errors
  const statusCode = err.statusCode || 500;
  const message = HTTP_STATUS_MESSAGES[statusCode] || "Something went wrong. Please try again.";

  return res.status(statusCode).json({
    success: false,
    message,
    fieldErrors: {},
  });
}

module.exports = { errorHandler, ERROR_MESSAGES };
