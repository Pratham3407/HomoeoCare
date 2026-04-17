function AppointmentSidebar() {
  return (
    <div className="appointment-sidebar">
      <div className="info-card">
        <h4>Available Services</h4>

        <p>Select the best consultation type based on your health needs.</p>
      </div>

      <div className="info-card">
        <h4>What to Expect</h4>

        <ul>
          <li>Initial consultation ~ 90 minutes</li>
          <li>Appointment confirmation within 24 hours</li>
          <li>Questions? Call +91 9824011536</li>
        </ul>
      </div>

      <div className="urgent-card">
        <h4>Need Urgent Care?</h4>

        <p>For acute conditions same-day appointments may be available.</p>
        <a href="tel:+919824011536" style={{ textDecoration: "none" }}>
          <button className="sidebar-call-btn">Call Now</button>
        </a>
      </div>
    </div>
  );
}

export default AppointmentSidebar;
