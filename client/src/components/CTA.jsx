import { Link } from "react-router-dom";
import "../styles/cta.css";

function CTA() {
  return (
    <section className="cta">
      <div className="cta-container">
        <h2>Ready to Start Your Healing Journey?</h2>

        <p>
          Schedule a consultation to discuss your health concerns and discover how
          homeopathy can help you achieve lasting wellness.
        </p>

        <div className="cta-buttons">
          <Link to="/appointment">
            <button className="cta-primary">Book Your Consultation →</button>
          </Link>

          <a href="tel:+919824011536">
            <button className="cta-secondary">Contact Us</button>
          </a>
        </div>
      </div>
    </section>
  );
}

export default CTA;
