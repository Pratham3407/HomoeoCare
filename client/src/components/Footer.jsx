import "../styles/footer.css";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-container">
        {/* Column 1 */}
        <div className="footer-col">
          <div className="footer-logo">
            <div className="logo-circle">
              <img src={logo} alt="logo" />
            </div>
            <div>
              <h3>Dr. Suketu Shah</h3>
              <p className="logo-sub">Homoeopathic Consultant</p>
            </div>
          </div>

          <p className="footer-description">
            Providing gentle, effective homoeopathic care for over 20+ years. Your journey
            to natural wellness starts here.
          </p>
        </div>

        {/* Column 2 */}
        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <Link to="/about"><li>About the Doctor</li></Link>
            <Link to="/services"><li>Our Services</li></Link>
            <Link to="/patients"><li>Patient Stories</li></Link>
            <Link to="/contact"><li>Book Appointment</li></Link>
          </ul>
        </div>

        {/* Column 3 */}
        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li>115, Sarvopari Mall, Opposite Utsav Elegance,
              Bhuyangdev Cross Road, Sola Road, Ahemdabad, Gujarat - 380061</li>
            <li>+91 9824011536</li>
            <li><a href="mailto:[dr.suketu.shah78@gmail.com]">dr.suketu.shah78@gmail.com</a></li>
          </ul>
        </div>

        {/* Column 4 */}
        <div className="footer-col">
          <h4>Clinic Hours</h4>
          <ul>
            <li>Monday – Saturday: 10:30 AM – 11:30 AM</li>
            <li>Monday – Saturday: 6:00 PM – 9:00 PM</li>
            <li>Sunday: Closed</li>
          </ul>
        </div>
      </div>

      <div className="footer-map-container">
        <iframe
          title="Google Map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.012564170703!2d72.5318047!3d23.0592651!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e8499099ef87d%3A0x6d3c0e68e4af419d!2sSarvopari%20Mall!5e0!3m2!1sen!2sin!4v1711545600000!5m2!1sen!2sin"
          width="100%"
          height="300"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Dr. Suketu Shah. All rights reserved.</p>

      </div>
    </footer>
  );
}

export default Footer;
