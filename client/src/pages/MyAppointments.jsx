import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/my-appointments.css";
import { apiFetch } from "../utils/api";

function MyAppointments() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    apiFetch(`/appointments/my-appointments/${user._id}`, {}, logout)
      .then((res) => res.json())
      .then((data) => setAppointments(data));
  }, [user, navigate]);

  return (
    <div className="my-appointments-page">
      <h2>My Appointments</h2>
      <p className="page-sub">View your appointment history and current status.</p>

      {appointments.length === 0 ? (
        <p className="no-data">You don't have any appointments yet.</p>
      ) : (
        <div className="appointments-list">
          {appointments.map((a) => (
            <div className="appt-card" key={a._id}>
              <div className="appt-header">
                <span className="appt-date">{a.date}</span>
                <span className={`appt-badge ${a.status}`}>{a.status}</span>
              </div>
              <p><b>Time:</b> {a.time}</p>
              {a.reason && <p className="appt-reason"><b>Note:</b> {a.reason}</p>}
              {a.prescription && a.status === "completed" && (
                <div className="appt-prescription" style={{ marginTop: "12px", padding: "12px", background: "#f0f8ff", borderLeft: "4px solid #2980b9", borderRadius: "4px" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#2980b9" }}>Doctor's Prescription & Notes:</h4>
                  <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "0.95rem" }}>{a.prescription}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyAppointments;
