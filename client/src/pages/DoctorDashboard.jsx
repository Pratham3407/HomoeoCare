import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import "../styles/dashboard.css";
import "../styles/error-states.css";
import { apiFetch } from "../utils/api";
import { SERVER_URL } from "../config";
import { validate } from "../utils/errors";

function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("appointments");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientReports, setPatientReports] = useState([]);
  const [reviewingReportId, setReviewingReportId] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackError, setFeedbackError] = useState("");

  // Appointments
  const [appointments, setAppointments] = useState([]);

  // Patients
  const [patientsList, setPatientsList] = useState([]);

  // Postpone modal
  const [showPostpone, setShowPostpone] = useState(null);
  const [postponeData, setPostponeData] = useState({ date: "", time: "", reason: "" });
  const [postponeErrors, setPostponeErrors] = useState({});

  // Prescription modal
  const [showPrescription, setShowPrescription] = useState(null);
  const [prescriptionData, setPrescriptionData] = useState("");

  // Filters State
  const [apptStatusFilter, setApptStatusFilter] = useState("all");
  const [apptTypeFilter, setApptTypeFilter] = useState("all");
  const [apptDateFilter, setApptDateFilter] = useState("all");
  const [apptCustomStart, setApptCustomStart] = useState("");
  const [apptCustomEnd, setApptCustomEnd] = useState("");

  const [patientSearch, setPatientSearch] = useState("");

  useEffect(() => {
    if (selectedPatient) {
      apiFetch(`/reports/patient/${selectedPatient._id}`, {}, logout)
        .then(res => {
          if (res.ok && Array.isArray(res.data)) setPatientReports(res.data);
          else setPatientReports([]);
        })
        .catch(() => setPatientReports([]));
    } else {
      setPatientReports([]);
    }
  }, [selectedPatient, logout]);

  // Helper for Date Filtering
  const checkDateFilter = (dateStr, filter) => {
    if (filter === "all") return true;

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const targetTime = targetDate.getTime();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    if (filter === "today") return targetTime === today.getTime();
    if (filter === "yesterday") return targetTime === yesterday.getTime();
    if (filter === "tomorrow") return targetTime === tomorrow.getTime();
    if (filter === "this_week") return targetDate >= startOfWeek && targetDate <= endOfWeek;

    if (filter === "custom") {
      if (!apptCustomStart && !apptCustomEnd) return true;
      let start = apptCustomStart ? new Date(apptCustomStart) : new Date("1970-01-01");
      start.setHours(0, 0, 0, 0);
      let end = apptCustomEnd ? new Date(apptCustomEnd) : new Date("2099-12-31");
      end.setHours(23, 59, 59, 999);
      return targetDate >= start && targetDate <= end;
    }

    return true;
  };

  const filteredAppointments = appointments.filter(a => {
    if (apptStatusFilter !== "all" && a.status !== apptStatusFilter) return false;
    if (apptTypeFilter !== "all" && a.type !== apptTypeFilter) return false;
    if (!checkDateFilter(a.date, apptDateFilter)) return false;
    return true;
  });

  useEffect(() => {
    if (!user || user.role !== "doctor") {
      toast.error("You don't have permission to access this area. Doctor login required.");
      navigate("/login");
    }
  }, [navigate, user]);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, []);

  const fetchAppointments = async () => {
    const res = await apiFetch("/appointments", {}, logout);
    if (res.ok) setAppointments(res.data);
    else if (res.message) toast.error(res.message);
  };

  const fetchPatients = async () => {
    const res = await apiFetch("/users/patients", {}, logout);
    if (res.ok) setPatientsList(Array.isArray(res.data) ? res.data : []);
    else if (res.message) toast.error(res.message);
  };

  // Appointment Actions
  const updateAppointment = async (id, body) => {
    try {
      const res = await apiFetch(`/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }, logout);
      if (res.ok) {
        fetchAppointments();
        toast.success("Appointment updated.");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("We couldn't update the appointment right now. Please try again.");
    }
  };

  const handlePostpone = (id) => {
    setShowPostpone(id);
    setPostponeData({ date: "", time: "", reason: "" });
    setPostponeErrors({});
  };

  const submitPostpone = async () => {
    const fieldErrors = {};
    const dateError = validate.date(postponeData.date);
    const timeError = validate.time(postponeData.time);
    if (dateError) fieldErrors.date = dateError;
    if (timeError) fieldErrors.time = timeError;

    if (Object.keys(fieldErrors).length > 0) {
      setPostponeErrors(fieldErrors);
      return;
    }

    setPostponeErrors({});
    await updateAppointment(showPostpone, {
      status: "postponed",
      date: postponeData.date,
      time: postponeData.time,
      reason: postponeData.reason,
    });
    setShowPostpone(null);
  };

  const handlePrescription = (id, existingPrescription) => {
    setShowPrescription(id);
    setPrescriptionData(existingPrescription || "");
  };

  const submitPrescription = async () => {
    if (!prescriptionData.trim()) {
      toast.error("Please enter the prescription.");
      return;
    }
    await updateAppointment(showPrescription, {
      prescription: prescriptionData,
    });
    setShowPrescription(null);
  };

  const handleSendMeetLink = async (appointmentId) => {
    const meetLink = window.prompt("Enter Google Meet Link (e.g., https://meet.google.com/xyz-abcd-efg):");
    if (!meetLink) return;

    try {
      const result = await apiFetch(`/appointments/${appointmentId}/send-meet-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetLink }),
      }, logout);

      if (result.ok) {
        toast.success(result.message);
        fetchAppointments();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("We couldn't send the meeting link right now. Please try again.");
    }
  };

  const handleReportReview = async () => {
    if (!feedbackText.trim()) {
      setFeedbackError("Please enter your feedback.");
      return;
    }
    setFeedbackError("");

    try {
      const result = await apiFetch(`/reports/${reviewingReportId}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorFeedback: feedbackText }),
      }, logout);

      if (result.ok) {
        toast.success("Feedback added successfully & email sent.");
        setReviewingReportId(null);
        setFeedbackText("");
        const updatedReports = await apiFetch(`/reports/patient/${selectedPatient._id}`, {}, logout);
        setPatientReports(updatedReports.ok && Array.isArray(updatedReports.data) ? updatedReports.data : []);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("We couldn't add the feedback right now. Please try again.");
    }
  };

  return (
    <div className="dashboard">
      <h2>Doctor Dashboard</h2>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={activeTab === "appointments" ? "tab active-tab" : "tab"}
          onClick={() => { setActiveTab("appointments"); setSelectedPatient(null); }}
        >
          Appointments
        </button>
        <button
          className={activeTab === "patients" ? "tab active-tab" : "tab"}
          onClick={() => setActiveTab("patients")}
        >
          Patients
        </button>
      </div>

      {/* PATIENTS TAB */}
      {activeTab === "patients" && (
        <div className="patients-section">
          {(() => {
            let displayedPatients = [...patientsList];
            if (patientSearch) {
              displayedPatients = displayedPatients.filter(p =>
                p.name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
                p.email?.toLowerCase().includes(patientSearch.toLowerCase())
              );
            }

            if (!selectedPatient) {
              return (
                <div className="patients-container">
                  <div className="filter-bar" style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                    <input
                      id="patient-search"
                      name="patientSearch"
                      className="patient-search-input"
                      aria-label="Search patient by name or email"
                      type="text"
                      placeholder="Search patient by name or email..."
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                      style={{ width: "300px" }}
                    />
                  </div>
                  <div className="appointments-grid" style={{ marginTop: "20px" }}>
                    {displayedPatients.length === 0 && <p>No patients found.</p>}
                    {displayedPatients.map(p => (
                      <div className="appointment-card" key={p._id}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                          {p.profilePhoto ? (
                            <img src={p.profilePhoto} alt="patient" style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            <div className="avatar-placeholder" style={{ width: "50px", height: "50px", fontSize: "1.2rem" }}>
                              {p.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <h3 style={{ margin: 0 }}>{p.name}</h3>
                        </div>
                        <p><b>Email:</b> {p.email}</p>
                        <div className="card-actions">
                          <button onClick={() => setSelectedPatient(p)}>View Profile & Records</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            } else {
              const patientAppointments = appointments.filter(a => a.patientId?._id === selectedPatient._id);

              return (
                <div className="patient-profile" style={{ marginTop: "20px" }}>
                  <div className="card-actions" style={{ marginBottom: "20px" }}>
                    <button className="btn-back" onClick={() => setSelectedPatient(null)}>← Back to Patients</button>
                  </div>
                  <div className="patient-header-card">
                    {selectedPatient.profilePhoto ? (
                      <img src={selectedPatient.profilePhoto} alt="patient" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div className="avatar-placeholder" style={{ width: "80px", height: "80px", fontSize: "2rem" }}>
                        {selectedPatient.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 style={{ margin: 0 }}>{selectedPatient.name}</h2>
                      <p style={{ margin: "4px 0 0 0" }}>{selectedPatient.email}</p>
                    </div>
                  </div>

                  <h3 className="section-heading" style={{ marginTop: "30px", marginBottom: "15px" }}>Appointment Records</h3>
                  <div className="appointments-grid">
                    {patientAppointments.length === 0 && <p>No appointment records.</p>}
                    {patientAppointments.map(a => (
                      <div className="appointment-card" key={a._id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <h4>{a.date} at {a.time}</h4>
                          <span className={`type-badge ${a.type === "online" ? "online" : "inperson"}`}>
                            {a.type === "online" ? "📹 Online" : "🏥 In-Person"}
                          </span>
                        </div>
                        {a.consultationType && <p style={{ marginTop: "8px" }}><b>Type:</b> {a.consultationType}</p>}
                        <p className={`status ${a.status}`}>{a.status}</p>
                        {a.reason && <p className="reason"><b>Reason:</b> {a.reason}</p>}
                        {a.prescription && <div className="prescription-box"><b>Prescription:</b> <p>{a.prescription}</p></div>}
                      </div>
                    ))}
                  </div>

                  <h3 className="section-heading" style={{ marginTop: "40px", marginBottom: "15px" }}>Medical Reports</h3>
                  <div className="reports-section appointments-grid">
                    {patientReports.length === 0 && <p>No medical reports.</p>}
                    {patientReports.map(r => (
                      <div className="appointment-card" key={r._id}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <h4 style={{ margin: "0 0 10px 0" }}>{r.name}</h4>
                          <span className={`status ${r.status}`} style={{ fontSize: "0.80rem", padding: "2px 8px" }}>
                            {r.status === "reviewed" ? "Reviewed" : "Pending"}
                          </span>
                        </div>
                        <p className="text-muted" style={{ fontSize: "0.85rem" }}>Uploaded: {new Date(r.createdAt).toLocaleDateString()}</p>
                        <a href={`${SERVER_URL}${r.fileUrl}`} target="_blank" rel="noreferrer" className="doc-link">
                          📄 View Document
                        </a>
                        {r.doctorFeedback && (
                          <div className="feedback-display">
                            <b>Your Feedback/Prescription:</b><br />{r.doctorFeedback}
                          </div>
                        )}
                        <div className="card-actions" style={{ marginTop: "15px" }}>
                          <button className={r.status === "reviewed" ? "btn-feedback-edit" : "btn-feedback-provide"} onClick={() => { setReviewingReportId(r._id); setFeedbackText(r.doctorFeedback || ""); setFeedbackError(""); }}>
                            {r.status === "reviewed" ? "Edit Feedback" : "Provide Feedback"}
                          </button>
                        </div>

                        {/* Inline Review Modal */}
                        {reviewingReportId === r._id && (
                          <div className="inline-review-modal">
                            <h4>Add Feedback & Prescription</h4>
                            <textarea
                              id={`report-feedback-${r._id}`}
                              name="feedback"
                              aria-label="Clinical feedback and prescription"
                              aria-invalid={feedbackError ? "true" : "false"}
                              aria-describedby={feedbackError ? "report-feedback-error" : undefined}
                              className={feedbackError ? "input-error" : ""}
                              rows="4"
                              placeholder="Enter your clinical feedback, notes, or prescriptions based on this report..."
                              value={feedbackText}
                              onChange={(e) => {
                                setFeedbackText(e.target.value);
                                if (feedbackError) setFeedbackError("");
                              }}
                            />
                            {feedbackError && (
                              <p id="report-feedback-error" className="field-error" role="alert" style={{ marginTop: "-5px" }}>
                                {feedbackError}
                              </p>
                            )}
                            <div className="modal-actions">
                              <button onClick={handleReportReview}>Save & Notify Patient</button>
                              <button className="btn-cancel" onClick={() => setReviewingReportId(null)}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              );
            }
          })()}
        </div>
      )}

      {/* APPOINTMENTS TAB */}
      {activeTab === "appointments" && (
        <div className="appointments-section">
          <div className="filter-bar" style={{ display: "flex", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label htmlFor="appt-status-filter">Status</label>
              <select id="appt-status-filter" name="apptStatusFilter" value={apptStatusFilter} onChange={(e) => setApptStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="postponed">Postponed</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label htmlFor="appt-type-filter">Consultation Type</label>
              <select id="appt-type-filter" name="apptTypeFilter" value={apptTypeFilter} onChange={(e) => setApptTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="online">Online</option>
                <option value="offline">In-Person</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label htmlFor="appt-date-filter">Date Range</label>
              <select id="appt-date-filter" name="apptDateFilter" value={apptDateFilter} onChange={(e) => setApptDateFilter(e.target.value)}>
                <option value="all">Any Date</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="this_week">This Week</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {apptDateFilter === "custom" && (
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label htmlFor="appt-custom-start">From</label>
                  <input id="appt-custom-start" name="apptCustomStart" type="date" value={apptCustomStart} onChange={(e) => setApptCustomStart(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label htmlFor="appt-custom-end">To</label>
                  <input id="appt-custom-end" name="apptCustomEnd" type="date" value={apptCustomEnd} onChange={(e) => setApptCustomEnd(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="appointments-grid">
            {filteredAppointments.length === 0 && <p className="no-data" style={{ gridColumn: "1 / -1" }}>No appointments found matching your filters.</p>}
            {filteredAppointments.map((a) => (
              <div className="appointment-card" key={a._id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {a.patientId?.profilePhoto ? (
                      <img src={a.patientId.profilePhoto} alt="patient" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div className="avatar-placeholder" style={{ width: "40px", height: "40px" }}>
                        {a.patientId?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h3>{a.patientId?.name || "Unknown"}</h3>
                  </div>
                  <span className={`type-badge ${a.type === "online" ? "online" : "inperson"}`}>
                    {a.type === "online" ? "📹 Online" : "🏥 In-Person"}
                  </span>
                </div>
                <p><b>Date:</b> {a.date}</p>
                <p><b>Time:</b> {a.time}</p>
                {a.consultationType && <p><b>Type:</b> {a.consultationType}</p>}
                <p className={`status ${a.status}`}>{a.status}</p>
                {a.reason && <p className="reason"><b>Reason:</b> {a.reason}</p>}
                {a.meetLink && <p style={{ fontSize: "0.9rem", marginTop: "4px" }}><b>Meet Link:</b> <a href={a.meetLink} target="_blank" rel="noreferrer" className="meet-link">Link</a></p>}
                {a.prescription && <div className="prescription-box"><b>Prescription:</b> <p>{a.prescription}</p></div>}

                <div className="card-actions">
                  {a.status === "pending" && (
                    <>
                      <button onClick={() => updateAppointment(a._id, { status: "approved" })}>
                        Approve
                      </button>
                      <button className="btn-cancel" onClick={() => updateAppointment(a._id, { status: "cancelled", reason: "Cancelled by doctor" })}>
                        Cancel
                      </button>
                      <button className="btn-postpone" onClick={() => handlePostpone(a._id)}>
                        Postpone
                      </button>
                    </>
                  )}
                  {a.status === "approved" && (
                    <>
                      <button onClick={() => updateAppointment(a._id, { status: "completed" })}>
                        Complete
                      </button>
                      {a.type === "online" && (
                        <button
                          className="btn-video"
                          onClick={() => handleSendMeetLink(a._id)}
                        >
                          {a.meetLink ? "Update Meet Link" : "Initiate Video Call"}
                        </button>
                      )}
                      <button className="btn-cancel" onClick={() => updateAppointment(a._id, { status: "cancelled", reason: "Cancelled by doctor" })}>
                        Cancel
                      </button>
                      <button className="btn-postpone" onClick={() => handlePostpone(a._id)}>
                        Postpone
                      </button>
                    </>
                  )}
                  {a.status === "completed" && (
                    <button onClick={() => handlePrescription(a._id, a.prescription)}>
                      {a.prescription ? "Edit Prescription" : "Write Prescription"}
                    </button>
                  )}
                </div>

                {/* Postpone Modal */}
                {showPostpone === a._id && (
                  <div className="postpone-modal">
                    <h4>Reschedule Appointment</h4>
                    <label htmlFor={`postpone-date-${a._id}`}>New Date</label>
                    <input
                      id={`postpone-date-${a._id}`}
                      name="postponeDate"
                      type="date"
                      aria-invalid={postponeErrors.date ? "true" : "false"}
                      aria-describedby={postponeErrors.date ? `postpone-date-error-${a._id}` : undefined}
                      className={postponeErrors.date ? "input-error" : ""}
                      value={postponeData.date}
                      onChange={(e) => {
                        setPostponeData({ ...postponeData, date: e.target.value });
                        if (postponeErrors.date) setPostponeErrors((prev) => ({ ...prev, date: undefined }));
                      }}
                    />
                    {postponeErrors.date && (
                      <p id={`postpone-date-error-${a._id}`} className="field-error" role="alert">{postponeErrors.date}</p>
                    )}
                    <label htmlFor={`postpone-time-${a._id}`}>New Time</label>
                    <input
                      id={`postpone-time-${a._id}`}
                      name="postponeTime"
                      type="time"
                      aria-invalid={postponeErrors.time ? "true" : "false"}
                      aria-describedby={postponeErrors.time ? `postpone-time-error-${a._id}` : undefined}
                      className={postponeErrors.time ? "input-error" : ""}
                      value={postponeData.time}
                      onChange={(e) => {
                        setPostponeData({ ...postponeData, time: e.target.value });
                        if (postponeErrors.time) setPostponeErrors((prev) => ({ ...prev, time: undefined }));
                      }}
                    />
                    {postponeErrors.time && (
                      <p id={`postpone-time-error-${a._id}`} className="field-error" role="alert">{postponeErrors.time}</p>
                    )}
                    <label htmlFor={`postpone-reason-${a._id}`}>Reason</label>
                    <input
                      id={`postpone-reason-${a._id}`}
                      name="postponeReason"
                      type="text"
                      placeholder="Reason for rescheduling"
                      value={postponeData.reason}
                      onChange={(e) => setPostponeData({ ...postponeData, reason: e.target.value })}
                    />
                    <div className="modal-actions">
                      <button onClick={submitPostpone}>Confirm</button>
                      <button className="btn-cancel" onClick={() => { setShowPostpone(null); setPostponeErrors({}); }}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Prescription Modal */}
                {showPrescription === a._id && (
                  <div className="postpone-modal">
                    <h4>{a.prescription ? "Edit Prescription" : "Write Prescription"}</h4>
                    <label htmlFor={`prescription-${a._id}`}>Medical Notes & Prescription</label>
                    <textarea
                      id={`prescription-${a._id}`}
                      name="prescription"
                      rows="5"
                      placeholder="Enter discussion notes, diagnosis, and prescribed medicines..."
                      value={prescriptionData}
                      onChange={(e) => setPrescriptionData(e.target.value)}
                    />
                    <div className="modal-actions">
                      <button onClick={submitPrescription}>Save Prescription</button>
                      <button className="btn-cancel" onClick={() => setShowPrescription(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      </div>
  );
}

export default DoctorDashboard;