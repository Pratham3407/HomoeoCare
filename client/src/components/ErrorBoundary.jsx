import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          padding: "40px 20px",
          textAlign: "center",
        }}>
          <div style={{
            background: "#fff",
            border: "1px solid #e9e4db",
            borderRadius: "12px",
            padding: "40px",
            maxWidth: "450px",
            width: "100%",
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#fdedec",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "1.8rem",
            }}>
              !
            </div>
            <h2 style={{ margin: "0 0 10px", color: "#2c3e50" }}>Something went wrong</h2>
            <p style={{ color: "#777", marginBottom: "24px", lineHeight: "1.5" }}>
              An unexpected error occurred. Please try refreshing the page or navigating back.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "10px 24px",
                  background: "#4a7c59",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = "/"}
                style={{
                  padding: "10px 24px",
                  background: "#f0ece4",
                  color: "#555",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
