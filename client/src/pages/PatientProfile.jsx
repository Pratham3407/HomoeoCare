import { useEffect, useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import "../styles/profile.css";
import { apiFetch } from "../utils/api";
import API_URL, { SERVER_URL } from "../config";

function PatientProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, logout } = useContext(AuthContext);

  // Initialize active tab from URL query params (e.g. ?tab=orders)
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "profile";
  });

  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState([]);

  // Report state
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState({ name: "", file: null });
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
        .then((res) => res.json())
        .then((data) => setAppointments(data));
    }
    if (activeTab === "orders") {
      apiFetch(`/orders/my-orders/${user._id}`, {}, logout)
        .then((res) => res.json())
        .then((data) => setOrders(data));
    }
    if (activeTab === "reports") {
      apiFetch(`/reports/patient/${user._id}`, {}, logout)
        .then((res) => res.json())
        .then((data) => setReports(data));
    }
  }, [activeTab, user]);

  const fetchReports = async () => {
    const res = await apiFetch(`/reports/patient/${user._id}`, {}, logout);
    const data = await res.json();
    setReports(data);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", reportForm.name);
    if (reportForm.file) formData.append("file", reportForm.file);

    try {
      const url = editingReportId ? `/reports/${editingReportId}` : `/reports`;
      const method = editingReportId ? "PUT" : "POST";
      
      const res = await fetch(`${API_URL}${url}`, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setShowReportForm(false);
        setReportForm({ name: "", file: null });
        setEditingReportId(null);
        fetchReports();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Error saving report");
    }
  };

  const deleteReport = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      const res = await apiFetch(`/reports/${id}`, { method: "DELETE" }, logout);
      if (res.ok) {
        toast.success("Report deleted");
        fetchReports();
      }
    } catch {
      toast.error("Error deleting report");
    }
  };


  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/users/update/${user._id}`, {
        method: "PUT",
        body: JSON.stringify(profileForm),
      }, logout);
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        login(data.user); // update context
        setEditing(false);
        setProfileForm({ ...profileForm, currentPassword: "", newPassword: "" });
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Error updating profile");
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
          <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>
            My Orders
          </button>
          <button className={activeTab === "reports" ? "active" : ""} onClick={() => setActiveTab("reports")}>
            My Reports
          </button>
        </nav>

        <div className="profile-quick-actions">
          <Link to="/appointment"><button className="quick-btn">Book Appointment</button></Link>
          <Link to="/order-medicine"><button className="quick-btn">Order Medicine</button></Link>
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
                <button className="edit-btn" onClick={() => setEditing(true)}>Edit Profile</button>
              </div>
            ) : (
              <form className="edit-form" onSubmit={handleProfileUpdate}>
                <label>Name</label>
                <input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
                <label>Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                />
                <label>Current Password <span className="optional">(required to change password)</span></label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={profileForm.currentPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                />
                <label>New Password <span className="optional">(leave blank to keep current)</span></label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={profileForm.newPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                />
                <label>Profile Photo</label>
                <input
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
                  <button type="submit">Save Changes</button>
                  <button type="button" className="cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
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
                    {a.meetLink && (
                      <a href={a.meetLink} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "10px", padding: "8px 16px", background: "#4a7c59", color: "#fff", textDecoration: "none", borderRadius: "6px", fontSize: "0.9rem", fontWeight: "600" }}>
                        📹 Join Video Call
                      </a>
                    )}
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

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="tab-section">
            <div className="tab-header">
              <h2>My Orders</h2>
              <Link to="/order-medicine"><button className="action-btn">+ New Order</button></Link>
            </div>
            {orders.length === 0 ? (
              <p className="no-data">No orders yet.</p>
            ) : (
              <div className="records-list">
                {orders.map((order) => (
                  <div className="record-card" key={order._id}>
                    <div className="record-header">
                      <span className="record-id">#{order._id.slice(-8).toUpperCase()}</span>
                      <span className="record-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="order-items-list">
                      {order.items.map((item, i) => (
                        <span key={i} className="order-item-tag">{item.name} × {item.quantity}</span>
                      ))}
                    </div>
                    <div className="record-footer">
                      <span><b>Total:</b> ₹{order.totalAmount}</span>
                      <span className={`record-badge ${order.paymentStatus}`}>
                        {order.paymentStatus === "confirmed_by_doctor" ? "Paid ✓" : order.paymentStatus}
                      </span>
                      <span className={`record-badge ${order.orderStatus}`}>{order.orderStatus}</span>
                    </div>
                    {order.trackingId && <p className="tracking-info">📦 Tracking: {order.trackingId}</p>}
                    <p className="shipping-info">
                      {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                    </p>
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
              <button className="action-btn" onClick={() => { setShowReportForm(!showReportForm); setEditingReportId(null); setReportForm({ name: "", file: null }); }}>
                {showReportForm ? "Close Form" : "+ Add Report"}
              </button>
            </div>

            {showReportForm && (
              <form className="edit-form" onSubmit={handleReportSubmit} style={{ marginBottom: "20px", background: "#fdfbf7", padding: "20px", borderRadius: "8px", border: "1px solid #e2d8c3" }}>
                <label>Report Name</label>
                <input
                  value={reportForm.name}
                  onChange={e => setReportForm({ ...reportForm, name: e.target.value })}
                  placeholder="e.g. Blood Test Results, MRI Scan"
                  required
                />
                <label>File (Image or PDF, Max 25MB)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => setReportForm({ ...reportForm, file: e.target.files[0] })}
                  required={!editingReportId}
                />
                <div className="form-actions" style={{ marginTop: "15px" }}>
                  <button type="submit">{editingReportId ? "Update Report" : "Upload Report"}</button>
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
