import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  //To control URL through React
  <BrowserRouter>
    <AuthProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </AuthProvider>
  </BrowserRouter>,
);