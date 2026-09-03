import { useEffect, useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import "../styles/profile.css";
import "../styles/error-states.css";
import { apiFetch } from "../utils/api";
import { SERVER_URL } from "../config";
import { validate, isTechnicalMessage } from "../utils/errors";
import { getSocket, MEET_LINK_EVENT } from "../realtime/clientSocket";

function PatientProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, logout } = useContext(AuthContext);

  // Initialize active tab from URL query params (e.g. ?tab=appointments)
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "profile";
  });

  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);

  // Report state
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState({ name: "", file: null });
  const [reportErrors, setReportErrors] = useState({});
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [editingReportId, setEditingReportId] = useState(null);

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    profilePhoto: "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    setProfileForm({ name: user.name, email: user.email, currentPassword: "", newPassword: "", profilePhoto: user.profilePhoto || "" });
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === "appointments") {
      apiFetch(`/appointments/my-appointments/${user._id}`, {}, logout)
        .then((res) => res.ok && setAppointments(res.data));
    }
    if (activeTab === "reports") {
      apiFetch(`/reports/patient/${user._id}`, {}, logout)
        .then((res) => res.ok && setReports(res.data));
    }
  }, [activeTab, user]);

  const fetchReports = async () => {
    const res = await apiFetch(`/reports/patient/${user._id}`, {}, logout);
    if (res.ok) setReports(res.data);
  };

  // Real-time meeting-link updates: when the doctor adds/changes a link for one
  // of this patient's appointments, update it immediately without a refresh.
  const subscribedAppointments = activeTab === "appointments" ? appointments : [];

  useEffect(() => {
    if (subscribedAppointments.length === 0 || !localStorage.getItem("token")) return undefined;

    const s = getSocket();
    if (!s.connected) s.connect();

    const subscribeAll = () => {
      subscribedAppointments.forEach((a) => {
        s.emit("appointment:subscribe", { appointmentId: a._id });
      });
    };
    subscribeAll();

    const handleMeetLink = (event) => {
      if (!event || !event.appointmentId || !event.meetingLink) return;
      setAppointments((prev) =>
        prev.map((a) => (a._id === event.appointmentId ? { ...a, meetLink: event.meetingLink } : a)),
      );
    };

    s.on("connect", subscribeAll);
    s.on(MEET_LINK_EVENT, handleMeetLink);

    return () => {
      s.off("connect", subscribeAll);
      s.off(MEET_LINK_EVENT, handleMeetLink);
    };
  }, [subscribedAppointments]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const fieldErrors = {};
    if (!reportForm.name || !reportForm.name.trim()) fieldErrors.name = "Please enter a report name.";
    if (!editingReportId && !reportForm.file) fieldErrors.file = "Please choose a file to upload.";
    if (reportForm.file && reportForm.file.size > 25 * 1024 * 1024) fieldErrors.file = "File size must be less than 25MB.";

    if (Object.keys(fieldErrors).length > 0) {
      setReportErrors(fieldErrors);
      return;
    }

    setReportErrors({});
    setReportSubmitting(true);

    const formData = new FormData();
    formData.append("name", reportForm.name);
    if (reportForm.file) formData.append("file", reportForm.file);

    try {
      const url = editingReportId ? `/reports/${editingReportId}` : `/reports`;
      const method = editingReportId ? "PUT" : "POST";

      const response = await fetch(`${SERVER_URL}/api${url}`, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.ok) {
        toast.success(editingReportId ? "Report updated successfully." : "Report uploaded successfully.");
        setShowReportForm(false);
        setReportForm({ name: "", file: null });
        setEditingReportId(null);
        fetchReports();
      } else {
        const originalMessage = data.message;
        const message = originalMessage && !isTechnicalMessage(originalMessage)
          ? originalMessage
          : "We couldn't save your report right now. Please try again.";
        toast.error(message);
      }
    } catch {
      toast.error("We couldn't save your report right now. Please try again.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const deleteReport = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      const res = await apiFetch(`/reports/${id}`, { method: "DELETE" }, logout);
      if (res.ok) {
        toast.success("Report deleted successfully.");
        fetchReports();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("We couldn't delete this report right now. Please try again.");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    // Client-side validation
    const fieldErrors = {};

    const nameError = validate.name(profileForm.name);
    if (nameError) fieldErrors.name = nameError;

    const emailError = validate.email(profileForm.email);
    if (emailError) fieldErrors.email = emailError;

    if (profileForm.newPassword) {
      const pwdError = validate.password(profileForm.newPassword);
      if (pwdError) fieldErrors.newPassword = pwdError;
      if (!profileForm.currentPassword) fieldErrors.currentPassword = "Please enter your current password.";
    }

    if (profileForm.currentPassword && !profileForm.newPassword) {
      fieldErrors.newPassword = "Please enter your new password.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      setProfileErrors(fieldErrors);
      return;
    }

    setProfileErrors({});
    setProfileSubmitting(true);

    try {
      const res = await apiFetch(`/users/update/${user._id}`, {
        method: "PUT",
        body: JSON.stringify(profileForm),
      }, logout);

      if (res.ok) {
        const data = res.data;
        toast.success(data.message || "Profile updated successfully.");
        if (data.user) {
          // Preserve token in context since data.user doesn't include it
          login(data.user, localStorage.getItem("token"));
        }
        setEditing(false);
        setProfileForm({ ...profileForm, currentPassword: "", newPassword: "" });
      } else {
        if (res.fieldErrors && Object.keys(res.fieldErrors).length > 0) {
          setProfileErrors(res.fieldErrors);
        } else {
          toast.error(res.message);
        }
      }
    } catch {
      toast.error("We couldn't update your profile right now. Please try again.");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size should be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setProfileForm((prev) => ({ ...prev, profilePhoto: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const clearProfileError = (field) => {
    if (profileErrors[field]) {
      setProfileErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const clearReportError = (field) => {
    if (reportErrors[field]) {
      setReportErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      {/* Sidebar */}
      <aside className="profile-sidebar">
        <div className="profile-avatar">
          {user.profilePhoto ? (
            <img src={user.profilePhoto} alt="profile" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            user.name?.charAt(0).toUpperCase()
          )}
        </div>
        <h3>{user.name}</h3>
        <p className="profile-email">{user.email}</p>
        <span className="profile-role">{user.role}</span>

        <nav className="profile-nav">
          <button className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}>
            Profile Info
          </button>
          <button className={activeTab === "appointments" ? "active" : ""} onClick={() => setActiveTab("appointments")}>
            My Appointments
          </button>
          <button className={activeTab === "reports" ? "active" : ""} onClick={() => setActiveTab("reports")}>
            My Reports
          </button>
        </nav>

        <div className="profile-quick-actions">
          <Link to="/appointment"><button className="quick-btn">Book Appointment</button></Link>
        </div>

        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </aside>

      {/* Main Content */}
      <main className="profile-main">
        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="profile-info-section">
            <h2>Profile Information</h2>
            {!editing ? (
              <div className="info-card">
                <div className="info-row"><span className="info-label">Name</span><span>{user.name}</span></div>
                <div className="info-row"><span className="info-label">Email</span><span>{user.email}</span></div>
                <div className="info-row"><span className="info-label">Role</span><span className="role-badge">{user.role}</span></div>
                <button className="edit-btn" onClick={() => { setEditing(true); setProfileErrors({}); }}>Edit Profile</button>
              </div>
            ) : (
              <form className="edit-form" onSubmit={handleProfileUpdate} noValidate>
                <label htmlFor="profile-name">Name</label>
                <input
                  id="profile-name"
                  name="name"
                  value={profileForm.name}
                  aria-invalid={profileErrors.name ? "true" : "false"}
                  aria-describedby={profileErrors.name ? "profile-name-error" : undefined}
                  className={profileErrors.name ? "input-error" : ""}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, name: e.target.value });
                    clearProfileError("name");
                  }}
                />
                {profileErrors.name && (
                  <p id="profile-name-error" className="field-error" role="alert">{profileErrors.name}</p>
                )}

                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  aria-invalid={profileErrors.email ? "true" : "false"}
                  aria-describedby={profileErrors.email ? "profile-email-error" : undefined}
                  className={profileErrors.email ? "input-error" : ""}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, email: e.target.value });
                    clearProfileError("email");
                  }}
                />
                {profileErrors.email && (
                  <p id="profile-email-error" className="field-error" role="alert">{profileErrors.email}</p>
                )}

                <label htmlFor="profile-current-password">Current Password <span className="optional">(required to change password)</span></label>
                <input
                  id="profile-current-password"
                  name="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={profileForm.currentPassword}
                  aria-invalid={profileErrors.currentPassword ? "true" : "false"}
                  aria-describedby={profileErrors.currentPassword ? "profile-current-password-error" : undefined}
                  className={profileErrors.currentPassword ? "input-error" : ""}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, currentPassword: e.target.value });
                    clearProfileError("currentPassword");
                  }}
                />
                {profileErrors.currentPassword && (
                  <p id="profile-current-password-error" className="field-error" role="alert">{profileErrors.currentPassword}</p>
                )}

                <label htmlFor="profile-new-password">New Password <span className="optional">(leave blank to keep current)</span></label>
                <input
                  id="profile-new-password"
                  name="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={profileForm.newPassword}
                  aria-invalid={profileErrors.newPassword ? "true" : "false"}
                  aria-describedby={profileErrors.newPassword ? "profile-new-password-error" : undefined}
                  className={profileErrors.newPassword ? "input-error" : ""}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, newPassword: e.target.value });
                    clearProfileError("newPassword");
                  }}
                />
                {profileErrors.newPassword && (
                  <p id="profile-new-password-error" className="field-error" role="alert">{profileErrors.newPassword}</p>
                )}

                <label htmlFor="profile-photo">Profile Photo</label>
                <input
                  id="profile-photo"
                  name="profilePhoto"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />

                {profileForm.profilePhoto && (
                  <img
                    src={profileForm.profilePhoto}
                    alt="Preview"
                    style={{ width: "60px", height: "60px", borderRadius: "50%", marginBottom: "10px", objectFit: "cover", display: "block" }}
                  />
                )}
                <div className="form-actions">
                  <button type="submit" disabled={profileSubmitting} style={{ opacity: profileSubmitting ? 0.7 : 1, cursor: profileSubmitting ? "not-allowed" : "pointer" }}>
                    {profileSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" className="cancel-btn" onClick={() => {
                    setEditing(false);
                    setProfileErrors({});
                    setProfileForm({ name: user.name, email: user.email, currentPassword: "", newPassword: "", profilePhoto: user.profilePhoto || "" });
                  }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === "appointments" && (
          <div className="tab-section">
            <div className="tab-header">
              <h2>My Appointments</h2>
              <Link to="/appointment"><button className="action-btn">+ Book New</button></Link>
            </div>
            {appointments.length === 0 ? (
              <p className="no-data">No appointments yet.</p>
            ) : (
              <div className="records-list">
                {appointments.map((a) => (
                  <div className="record-card" key={a._id}>
                    <div className="record-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className="record-date">{a.date}</span>
                        <span style={{ fontSize: "0.8rem", background: a.type === "online" ? "#ebf5fb" : "#f0ece4", color: a.type === "online" ? "#2980b9" : "#555", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>
                          {a.type === "online" ? "📹 Online" : "🏥 In-Person"}
                        </span>
                      </div>
                      <span className={`record-badge ${a.status}`}>{a.status}</span>
                    </div>
                    <p><b>Time:</b> {a.time}</p>
                    {a.reason && <p className="record-note"><b>Note:</b> {a.reason}</p>}
                    {a.type === "online" &&
                      (a.meetLink ? (
                        <div style={{ marginTop: "10px" }}>
                          <p style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#4a7c59", fontWeight: "600" }}>
                            Your doctor has added a meeting link.
                          </p>
                          <a href={a.meetLink} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "8px 16px", background: "#4a7c59", color: "#fff", textDecoration: "none", borderRadius: "6px", fontSize: "0.9rem", fontWeight: "600" }}>
                            Join Meeting
                          </a>
                        </div>
                      ) : (
                        <p style={{ marginTop: "10px", fontSize: "0.9rem", color: "#888" }}>
                          No meeting link has been added yet.
                        </p>
                      ))}
                    {a.prescription && a.status === "completed" && (
                      <div className="appt-prescription" style={{ marginTop: "12px", padding: "12px", background: "#f0f8ff", borderLeft: "4px solid #2980b9", borderRadius: "4px" }}>
                        <h4 style={{ margin: "0 0 8px 0", color: "#2980b9", fontSize: "1rem" }}>Doctor's Prescription & Notes:</h4>
                        <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "0.95rem" }}>{a.prescription}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === "reports" && (
          <div className="tab-section">
            <div className="tab-header">
              <h2>My Medical Reports</h2>
              <button className="action-btn" onClick={() => { setShowReportForm(!showReportForm); setEditingReportId(null); setReportForm({ name: "", file: null }); setReportErrors({}); }}>
                {showReportForm ? "Close Form" : "+ Add Report"}
              </button>
            </div>

            {showReportForm && (
              <form className="edit-form" onSubmit={handleReportSubmit} noValidate style={{ marginBottom: "20px", background: "#fdfbf7", padding: "20px", borderRadius: "8px", border: "1px solid #e2d8c3" }}>
                <label htmlFor="report-name">Report Name</label>
                <input
                  id="report-name"
                  name="reportName"
                  value={reportForm.name}
                  aria-invalid={reportErrors.name ? "true" : "false"}
                  aria-describedby={reportErrors.name ? "report-name-error" : undefined}
                  className={reportErrors.name ? "input-error" : ""}
                  onChange={(e) => {
                    setReportForm({ ...reportForm, name: e.target.value });
                    clearReportError("name");
                  }}
                  placeholder="e.g. Blood Test Results, MRI Scan"
                />
                {reportErrors.name && (
                  <p id="report-name-error" className="field-error" role="alert">{reportErrors.name}</p>
                )}

                <label htmlFor="report-file">File (Image or PDF, Max 25MB)</label>
                <input
                  id="report-file"
                  name="reportFile"
                  type="file"
                  accept="image/*,.pdf"
                  aria-invalid={reportErrors.file ? "true" : "false"}
                  aria-describedby={reportErrors.file ? "report-file-error" : undefined}
                  onChange={(e) => {
                    setReportForm({ ...reportForm, file: e.target.files[0] });
                    clearReportError("file");
                  }}
                />
                {reportErrors.file && (
                  <p id="report-file-error" className="field-error" role="alert">{reportErrors.file}</p>
                )}

                <div className="form-actions" style={{ marginTop: "15px" }}>
                  <button type="submit" disabled={reportSubmitting} style={{ opacity: reportSubmitting ? 0.7 : 1, cursor: reportSubmitting ? "not-allowed" : "pointer" }}>
                    {reportSubmitting ? "Saving..." : (editingReportId ? "Update Report" : "Upload Report")}
                  </button>
                  <button type="button" className="cancel-btn" onClick={() => setShowReportForm(false)}>Cancel</button>
                </div>
              </form>
            )}

            {reports.length === 0 ? (
              <p className="no-data">No medical reports uploaded yet.</p>
            ) : (
              <div className="records-list">
                {reports.map((r) => (
                  <div className="record-card" key={r._id}>
                    <div className="record-header">
                      <h3>{r.name}</h3>
                      <span className={`record-badge ${r.status}`}>{r.status === "reviewed" ? "Reviewed ✓" : "Pending Review"}</span>
                    </div>
                    <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "10px" }}>
                      Uploaded on: {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                    <a href={`${SERVER_URL}${r.fileUrl}`} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "8px 16px", background: "#2980b9", color: "#fff", textDecoration: "none", borderRadius: "4px", fontSize: "0.9rem", fontWeight: "600", marginBottom: "15px" }}>
                      📥 View / Download File
                    </a>

                    {r.doctorFeedback && (
                      <div className="appt-prescription" style={{ marginBottom: "15px", padding: "12px", background: "#f0f8ff", borderLeft: "4px solid #2980b9", borderRadius: "4px" }}>
                        <h4 style={{ margin: "0 0 8px 0", color: "#2980b9", fontSize: "1rem" }}>Doctor's Feedback & Prescription:</h4>
                        <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "0.95rem" }}>{r.doctorFeedback}</p>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "10px", borderTop: "1px solid #eee", paddingTop: "10px" }}>
                      <button style={{ padding: "6px 12px", background: "#4a7c59", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }} onClick={() => { setEditingReportId(r._id); setReportForm({ name: r.name, file: null }); setShowReportForm(true); }}>
                        Edit Details
                      </button>
                      <button style={{ padding: "6px 12px", background: "#c0392b", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }} onClick={() => deleteReport(r._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default PatientProfile;