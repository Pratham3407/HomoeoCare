import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import "../styles/dashboard.css";
import { apiFetch } from "../utils/api";
import { SERVER_URL } from "../config";

function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("appointments");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientReports, setPatientReports] = useState([]);
  const [reviewingReportId, setReviewingReportId] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");

  // Appointments
  const [appointments, setAppointments] = useState([]);

  // Patients
  const [patientsList, setPatientsList] = useState([]);

  // Medicine Orders
  const [orders, setOrders] = useState([]);

  // Medicine management
  const [medicines, setMedicines] = useState([]);
  const [showMedForm, setShowMedForm] = useState(false);
  const [medForm, setMedForm] = useState({ name: "", description: "", price: "", stock: "" });
  const [editingMedId, setEditingMedId] = useState(null);

  // Postpone modal
  const [showPostpone, setShowPostpone] = useState(null);
  const [postponeData, setPostponeData] = useState({ date: "", time: "", reason: "" });

  // Prescription modal
  const [showPrescription, setShowPrescription] = useState(null);
  const [prescriptionData, setPrescriptionData] = useState("");

  // Filters State
  const [apptStatusFilter, setApptStatusFilter] = useState("all");
  const [apptTypeFilter, setApptTypeFilter] = useState("all");
  const [apptDateFilter, setApptDateFilter] = useState("all");
  const [apptCustomStart, setApptCustomStart] = useState("");
  const [apptCustomEnd, setApptCustomEnd] = useState("");

  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [medSearch, setMedSearch] = useState("");
  const [patientSearch, setPatientSearch] = useState("");

  useEffect(() => {
    if (selectedPatient) {
      apiFetch(`/reports/patient/${selectedPatient._id}`, {}, logout)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setPatientReports(data);
          else setPatientReports([]);
        })
        .catch(err => console.error("Error fetching patient reports:", err));
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

  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter !== "all" && o.orderStatus !== orderStatusFilter) return false;
    return true;
  });

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
    (m.description && m.description.toLowerCase().includes(medSearch.toLowerCase()))
  );

  useEffect(() => {
    if (!user || user.role !== "doctor") {
      alert("Access denied. Doctor login required.");
      navigate("/login");
    }
  }, [navigate, user]);

  useEffect(() => {
    fetchAppointments();
    fetchOrders();
    fetchMedicines();
    fetchPatients();
  }, []);

  const fetchAppointments = async () => {
    const res = await apiFetch("/appointments", {}, logout);
    const data = await res.json();
    setAppointments(data);
  };

  const fetchOrders = async () => {
    const res = await apiFetch("/orders", {}, logout);
    const data = await res.json();
    setOrders(data);
  };

  const fetchMedicines = async () => {
    const res = await apiFetch("/medicines", {}, logout);
    const data = await res.json();
    setMedicines(data);
  };

  const fetchPatients = async () => {
    const res = await apiFetch("/users/patients", {}, logout);
    const data = await res.json();
    setPatientsList(Array.isArray(data) ? data : []);
  };

  // Appointment Actions
  const updateAppointment = async (id, body) => {
    await apiFetch(`/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, logout);
    fetchAppointments();
    toast.success("Appointment updated");
  };

  const handlePostpone = (id) => {
    setShowPostpone(id);
    setPostponeData({ date: "", time: "", reason: "" });
  };

  const submitPostpone = async () => {
    if (!postponeData.date || !postponeData.time) {
      toast.error("Please enter new date and time");
      return;
    }
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
    await updateAppointment(showPrescription, {
      prescription: prescriptionData,
    });
    setShowPrescription(null);
    toast.success("Prescription saved");
  };

  // Order Actions
  const updateOrder = async (id, body) => {
    await apiFetch(`/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, logout);
    fetchOrders();
    toast.success("Order updated");
  };

  // Medicine Actions
  const handleMedSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: medForm.name,
      description: medForm.description,
      price: Number(medForm.price),
      stock: Number(medForm.stock),
    };

    if (editingMedId) {
      await apiFetch(`/medicines/${editingMedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }, logout);
      toast.success("Medicine updated");
    } else {
      await apiFetch(`/medicines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }, logout);
      toast.success("Medicine added");
    }

    setMedForm({ name: "", description: "", price: "", stock: "" });
    setEditingMedId(null);
    setShowMedForm(false);
    fetchMedicines();
  };

  const deleteMedicine = async (id) => {
    if (!window.confirm("Delete this medicine?")) return;
    await apiFetch(`/medicines/${id}`, { method: "DELETE" }, logout);
    toast.success("Medicine deleted");
    fetchMedicines();
  };

  const editMedicine = (med) => {
    setMedForm({ name: med.name, description: med.description, price: med.price, stock: med.stock });
    setEditingMedId(med._id);
    setShowMedForm(true);
  };

  const handleSendMeetLink = async (appointmentId) => {
    const meetLink = window.prompt("Enter Google Meet Link (e.g., https://meet.google.com/xyz-abcd-efg):");
    if (!meetLink) return;

    try {
      const res = await apiFetch(`/appointments/${appointmentId}/send-meet-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetLink }),
      }, logout);
      const data = await res.json();
      if (res.ok) {
        toast.success("Meet link saved and emailed to patient!");
        fetchAppointments(); // Refresh to show the latest link
      } else {
        toast.error(data.message || "Failed to send link");
      }
    } catch {
      toast.error("Error sending meet link");
    }
  };

  const handleReportReview = async () => {
    try {
      const res = await apiFetch(`/reports/${reviewingReportId}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorFeedback: feedbackText }),
      }, logout);
      if (res.ok) {
        toast.success("Feedback added successfully & email sent");
        setReviewingReportId(null);
        setFeedbackText("");
        // Refresh patient reports
        const updatedReports = await apiFetch(`/reports/patient/${selectedPatient._id}`, {}, logout).then(r => r.json());
        setPatientReports(Array.isArray(updatedReports) ? updatedReports : []);
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to add feedback");
      }
    } catch {
      toast.error("Error adding feedback");
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
          className={activeTab === "orders" ? "tab active-tab" : "tab"}
          onClick={() => { setActiveTab("orders"); setSelectedPatient(null); }}
        >
          Medicine Orders
        </button>
        <button
          className={activeTab === "medicines" ? "tab active-tab" : "tab"}
          onClick={() => { setActiveTab("medicines"); setSelectedPatient(null); }}
        >
          Manage Medicines
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
                      type="text"
                      placeholder="Search patient by name or email..."
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                      style={{ padding: "10px", width: "300px", borderRadius: "4px", border: "1px solid #ccc", fontFamily: "inherit" }}
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
                            <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", color: "#555", fontSize: "1.2rem" }}>
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
              const patientOrders = orders.filter(o => o.patientId?._id === selectedPatient._id);

              return (
                <div className="patient-profile" style={{ marginTop: "20px" }}>
                  <div className="card-actions" style={{ marginBottom: "20px" }}>
                    <button className="btn-cancel" onClick={() => setSelectedPatient(null)}>← Back to Patients</button>
                  </div>
                  <div style={{ padding: "20px", border: "1px solid #eee", borderRadius: "8px", background: "#f9f9f9", display: "flex", alignItems: "center", gap: "20px" }}>
                    {selectedPatient.profilePhoto ? (
                      <img src={selectedPatient.profilePhoto} alt="patient" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", color: "#555", fontSize: "2rem" }}>
                        {selectedPatient.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 style={{ margin: 0 }}>{selectedPatient.name}</h2>
                      <p style={{ color: "#555", margin: "4px 0 0 0" }}>{selectedPatient.email}</p>
                    </div>
                  </div>

                  <h3 style={{ marginTop: "30px", marginBottom: "15px", borderBottom: "2px solid #2980b9", paddingBottom: "5px", display: "inline-block" }}>Appointment Records</h3>
                  <div className="appointments-grid">
                    {patientAppointments.length === 0 && <p>No appointment records.</p>}
                    {patientAppointments.map(a => (
                      <div className="appointment-card" key={a._id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <h4>{a.date} at {a.time}</h4>
                          <span style={{ fontSize: "0.85rem", background: a.type === "online" ? "#ebf5fb" : "#f0ece4", color: a.type === "online" ? "#2980b9" : "#555", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>
                            {a.type === "online" ? "📹 Online" : "🏥 In-Person"}
                          </span>
                        </div>
                        {a.consultationType && <p style={{ marginTop: "8px" }}><b>Type:</b> {a.consultationType}</p>}
                        <p className={`status ${a.status}`}>{a.status}</p>
                        {a.reason && <p className="reason"><b>Reason:</b> {a.reason}</p>}
                        {a.prescription && <div className="prescription-box" style={{ marginTop: "10px", padding: "10px", background: "#fdfbf7", border: "1px solid #e2d8c3", borderRadius: "6px" }}><b>Prescription:</b> <p style={{ whiteSpace: "pre-wrap", marginTop: "5px", fontSize: "0.9rem" }}>{a.prescription}</p></div>}
                      </div>
                    ))}
                  </div>

                  <h3 style={{ marginTop: "40px", marginBottom: "15px", borderBottom: "2px solid #2980b9", paddingBottom: "5px", display: "inline-block" }}>Medical Reports</h3>
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
                        <p style={{ fontSize: "0.85rem", color: "#666" }}>Uploaded: {new Date(r.createdAt).toLocaleDateString()}</p>
                        <a href={`${SERVER_URL}${r.fileUrl}`} target="_blank" rel="noreferrer" style={{ display: "inline-block", margin: "10px 0", color: "#2980b9", fontWeight: "600", textDecoration: "none" }}>
                          📄 View Document
                        </a>
                        {r.doctorFeedback && (
                          <div style={{ marginTop: "10px", padding: "10px", background: "#fdfbf7", border: "1px solid #e2d8c3", borderRadius: "6px", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                            <b>Your Feedback/Prescription:</b><br />{r.doctorFeedback}
                          </div>
                        )}
                        <div className="card-actions" style={{ marginTop: "15px" }}>
                          <button style={{ background: r.status === "reviewed" ? "#f39c12" : "#27ae60" }} onClick={() => { setReviewingReportId(r._id); setFeedbackText(r.doctorFeedback || ""); }}>
                            {r.status === "reviewed" ? "Edit Feedback" : "Provide Feedback"}
                          </button>
                        </div>
                        
                        {/* Inline Review Modal */}
                        {reviewingReportId === r._id && (
                          <div style={{ marginTop: "15px", padding: "15px", background: "#fff", border: "1px solid #ddd", borderRadius: "6px" }}>
                            <h4 style={{ margin: "0 0 10px 0" }}>Add Feedback & Prescription</h4>
                            <textarea
                              rows="4"
                              placeholder="Enter your clinical feedback, notes, or prescriptions based on this report..."
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", fontFamily: "inherit", marginBottom: "10px" }}
                            />
                            <div style={{ display: "flex", gap: "10px" }}>
                              <button onClick={handleReportReview}>Save & Notify Patient</button>
                              <button className="btn-cancel" onClick={() => setReviewingReportId(null)}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <h3 style={{ marginTop: "40px", marginBottom: "15px", borderBottom: "2px solid #2980b9", paddingBottom: "5px", display: "inline-block" }}>Medicine Orders</h3>
                  <div className="orders-section">
                    {patientOrders.length === 0 && <p>No medicine orders.</p>}
                    {patientOrders.map((order) => (
                      <div className="order-card" key={order._id}>
                        <div className="order-header">
                          <h4>Order on {new Date(order.createdAt).toLocaleDateString()}</h4>
                        </div>
                        <div className="order-items">
                          <ul>
                            {order.items.map((item, i) => (
                              <li key={i}>{item.name} × {item.quantity}</li>
                            ))}
                          </ul>
                        </div>
                        <p><b>Total:</b> ₹{order.totalAmount}</p>
                        <p><b>Status:</b> <span className={`status ${order.orderStatus}`}>{order.orderStatus}</span></p>
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
          <div className="filter-bar" style={{ display: "flex", gap: "15px", marginBottom: "20px", flexWrap: "wrap", background: "#f9f9f9", padding: "15px", borderRadius: "8px", border: "1px solid #eee" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#555" }}>Status</label>
              <select value={apptStatusFilter} onChange={(e) => setApptStatusFilter(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "white", outline: "none", fontFamily: "inherit" }}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="postponed">Postponed</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#555" }}>Consultation Type</label>
              <select value={apptTypeFilter} onChange={(e) => setApptTypeFilter(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "white", outline: "none", fontFamily: "inherit" }}>
                <option value="all">All Types</option>
                <option value="online">Online</option>
                <option value="offline">In-Person</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#555" }}>Date Range</label>
              <select value={apptDateFilter} onChange={(e) => setApptDateFilter(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "white", outline: "none", fontFamily: "inherit" }}>
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
                  <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#555" }}>From</label>
                  <input type="date" value={apptCustomStart} onChange={(e) => setApptCustomStart(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", fontFamily: "inherit" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#555" }}>To</label>
                  <input type="date" value={apptCustomEnd} onChange={(e) => setApptCustomEnd(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", fontFamily: "inherit" }} />
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
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", color: "#555" }}>
                        {a.patientId?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h3>{a.patientId?.name || "Unknown"}</h3>
                  </div>
                  <span style={{ fontSize: "0.85rem", background: a.type === "online" ? "#ebf5fb" : "#f0ece4", color: a.type === "online" ? "#2980b9" : "#555", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>
                    {a.type === "online" ? "📹 Online" : "🏥 In-Person"}
                  </span>
                </div>
                <p><b>Date:</b> {a.date}</p>
                <p><b>Time:</b> {a.time}</p>
                {a.consultationType && <p><b>Type:</b> {a.consultationType}</p>}
                <p className={`status ${a.status}`}>{a.status}</p>
                {a.reason && <p className="reason"><b>Reason:</b> {a.reason}</p>}
                {a.meetLink && <p style={{ fontSize: "0.9rem", marginTop: "4px" }}><b>Meet Link:</b> <a href={a.meetLink} target="_blank" rel="noreferrer" style={{ color: "#2980b9" }}>Link</a></p>}
                {a.prescription && <div className="prescription-box" style={{ marginTop: "10px", padding: "10px", background: "#fdfbf7", border: "1px solid #e2d8c3", borderRadius: "6px" }}><b>Prescription:</b> <p style={{ whiteSpace: "pre-wrap", marginTop: "5px", fontSize: "0.9rem" }}>{a.prescription}</p></div>}

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
                          style={{ background: "#2980b9" }}
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
                    <button style={{ background: "#27ae60" }} onClick={() => handlePrescription(a._id, a.prescription)}>
                      {a.prescription ? "Edit Prescription" : "Write Prescription"}
                    </button>
                  )}
                </div>

                {/* Postpone Modal */}
                {showPostpone === a._id && (
                  <div className="postpone-modal">
                    <h4>Reschedule Appointment</h4>
                    <label>New Date</label>
                    <input
                      type="date"
                      value={postponeData.date}
                      onChange={(e) => setPostponeData({ ...postponeData, date: e.target.value })}
                    />
                    <label>New Time</label>
                    <input
                      type="time"
                      value={postponeData.time}
                      onChange={(e) => setPostponeData({ ...postponeData, time: e.target.value })}
                    />
                    <label>Reason</label>
                    <input
                      type="text"
                      placeholder="Reason for rescheduling"
                      value={postponeData.reason}
                      onChange={(e) => setPostponeData({ ...postponeData, reason: e.target.value })}
                    />
                    <div className="modal-actions">
                      <button onClick={submitPostpone}>Confirm</button>
                      <button className="btn-cancel" onClick={() => setShowPostpone(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Prescription Modal */}
                {showPrescription === a._id && (
                  <div className="postpone-modal">
                    <h4>{a.prescription ? "Edit Prescription" : "Write Prescription"}</h4>
                    <label>Medical Notes & Prescription</label>
                    <textarea
                      rows="5"
                      placeholder="Enter discussion notes, diagnosis, and prescribed medicines..."
                      value={prescriptionData}
                      onChange={(e) => setPrescriptionData(e.target.value)}
                      style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "4px", border: "1px solid #ccc", fontFamily: "inherit" }}
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

      {/* MEDICINE ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="orders-section">
          <div className="filter-bar" style={{ display: "flex", gap: "15px", marginBottom: "20px", background: "#f9f9f9", padding: "15px", borderRadius: "8px", border: "1px solid #eee" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#555" }}>Order Status</label>
              <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "white", outline: "none", fontFamily: "inherit" }}>
                <option value="all">All Orders</option>
                <option value="placed">Placed</option>
                <option value="reviewed">Reviewed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {filteredOrders.length === 0 && <p className="no-data">No orders to display.</p>}
          {filteredOrders.map((order) => (
            <div className="order-card" key={order._id}>
              <div className="order-header">
                <h3>{order.patientId?.name || "Unknown"}</h3>
                <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <p><b>Email:</b> {order.patientId?.email}</p>

              <div className="order-items">
                <b>Items:</b>
                <ul>
                  {order.items.map((item, i) => (
                    <li key={i}>{item.name} × {item.quantity} — ₹{item.price * item.quantity}</li>
                  ))}
                </ul>
              </div>

              <p><b>Total:</b> ₹{order.totalAmount}</p>

              <p><b>Address:</b> {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>

              <p><b>Payment:</b> <span className={`status ${order.paymentStatus}`}>{order.paymentStatus}</span></p>
              <p><b>Order Status:</b> <span className={`status ${order.orderStatus}`}>{order.orderStatus}</span></p>
              {order.trackingId && <p><b>Tracking ID:</b> {order.trackingId}</p>}

              <div className="card-actions order-actions">
                {order.paymentStatus !== "confirmed_by_doctor" && (
                  <button onClick={() => updateOrder(order._id, { paymentStatus: "confirmed_by_doctor" })}>
                    Confirm Payment
                  </button>
                )}
                {order.orderStatus === "placed" && (
                  <button onClick={() => updateOrder(order._id, { orderStatus: "reviewed" })}>
                    Mark Reviewed
                  </button>
                )}
                {order.orderStatus === "reviewed" && (
                  <button onClick={() => {
                    const tid = prompt("Enter IndiaPost Tracking ID:");
                    if (tid) updateOrder(order._id, { orderStatus: "shipped", trackingId: tid });
                  }}>
                    Ship Order
                  </button>
                )}
                {order.orderStatus === "shipped" && (
                  <button onClick={() => updateOrder(order._id, { orderStatus: "delivered" })}>
                    Mark Delivered
                  </button>
                )}
                {!["cancelled", "delivered"].includes(order.orderStatus) && (
                  <button className="btn-cancel" onClick={() => updateOrder(order._id, { orderStatus: "cancelled" })}>
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MANAGE MEDICINES TAB */}
      {activeTab === "medicines" && (
        <div className="medicines-section">
          <div className="filter-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "#f9f9f9", padding: "15px", borderRadius: "8px", border: "1px solid #eee", flexWrap: "wrap", gap: "15px" }}>
            <input
              type="text"
              placeholder="Search medicines by name or description..."
              value={medSearch}
              onChange={(e) => setMedSearch(e.target.value)}
              style={{ padding: "10px", width: "100%", maxWidth: "400px", borderRadius: "4px", border: "1px solid #ccc", fontFamily: "inherit" }}
            />
            <button className="add-med-btn" onClick={() => { setShowMedForm(!showMedForm); setEditingMedId(null); setMedForm({ name: "", description: "", price: "", stock: "" }); }}>
              {showMedForm ? "Close Form" : "+ Add Medicine"}
            </button>
          </div>

          {showMedForm && (
            <form className="med-form" onSubmit={handleMedSubmit}>
              <input
                placeholder="Medicine name"
                value={medForm.name}
                onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                required
              />
              <input
                placeholder="Description"
                value={medForm.description}
                onChange={(e) => setMedForm({ ...medForm, description: e.target.value })}
              />
              <input
                type="number"
                placeholder="Price (₹)"
                value={medForm.price}
                onChange={(e) => setMedForm({ ...medForm, price: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Stock quantity"
                value={medForm.stock}
                onChange={(e) => setMedForm({ ...medForm, stock: e.target.value })}
                required
              />
              <button type="submit">{editingMedId ? "Update" : "Add"} Medicine</button>
            </form>
          )}

          <div className="medicines-grid">
            {filteredMedicines.length === 0 && <p className="no-data">No medicines match your search.</p>}
            {filteredMedicines.map((med) => (
              <div className="medicine-card" key={med._id}>
                <h3>{med.name}</h3>
                {med.description && <p>{med.description}</p>}
                <p><b>Price:</b> ₹{med.price}</p>
                <p><b>Stock:</b> {med.stock}</p>
                <div className="card-actions">
                  <button onClick={() => editMedicine(med)}>Edit</button>
                  <button className="btn-cancel" onClick={() => deleteMedicine(med._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;
