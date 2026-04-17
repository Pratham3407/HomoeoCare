import "../styles/doctor.css";
import doctorImg from "../assets/doctor-portrait.png";

function Doctor() {
  return (
    <section className="doctor" id="doctor">
      <div className="doctor-container">
        {/* LEFT SIDE */}
        <div className="doctor-left">
          <div className="doctor-image-container">
            <img src={doctorImg} alt="Dr. Suketu Shah" className="doctor-portrait-img" />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="doctor-right">
          <p className="doctor-label">MEET YOUR DOCTOR</p>

          <h2>Dedicated to Your Natural Healing Journey</h2>

          <p className="doctor-text">
            With over 20+ years of experience in classical homeopathy, Dr. Suketu Shah has
            helped thousands of patients find relief from chronic conditions and achieve
            lasting wellness.
          </p>

          <p className="doctor-text">
            Trained at leading homeopathic institutions and committed to continuous
            learning, every patient receives personalized care based on a deep
            understanding of homeopathic principles.
          </p>

          <div className="doctor-badges">
            <span>✓ Board Certified</span>
            <span>♡ 20+ Years Experience</span>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
            <a href="https://wa.me/9824011536" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 20px", background: "#25D366", color: "white", textDecoration: "none", borderRadius: "50px", fontWeight: "600", fontSize: "14px", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              WhatsApp
            </a>
            <a href="https://instagram.com/drsuketushah" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 20px", background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)", color: "white", textDecoration: "none", borderRadius: "50px", fontWeight: "600", fontSize: "14px", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              Instagram
            </a>
            <a href="https://www.instagram.com/drsuketushahahmedabad?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 20px", background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)", color: "white", textDecoration: "none", borderRadius: "50px", fontWeight: "600", fontSize: "14px", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              Instagram (Clinic)
            </a>
            <a href="https://facebook.com/drsuketushah" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 20px", background: "#1877F2", color: "white", textDecoration: "none", borderRadius: "50px", fontWeight: "600", fontSize: "14px", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              Facebook
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Doctor;
