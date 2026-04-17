import { Link } from "react-router-dom";
import "../styles/hero.css";

function Hero() {
  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-left">
          <p className="hero-small">NATURAL HEALING • HOLISTIC CARE</p>

          <h1>
            Gentle Medicine for <span>Lasting Wellness</span>
          </h1>

          <p className="hero-text">
            Experience the power of homoeopathic medicine. We treat the whole person—body,
            mind, and spirit— to help you achieve optimal health naturally.
          </p>

          <div className="hero-buttons">
            <Link to="/appointment">
              <button className="primary-btn">Book a Consultation →</button>
            </Link>
            <a href="/#services">
              <button className="secondary-btn">Explore Services</button>
            </a>
          </div>
        </div>

        <div className="hero-right">
          <div className="quote-card">
            <div className="quote-icon">🌿</div>
            <p className="quote-text">
              "The highest ideal of cure is the rapid, gentle and permanent restoration of
              health."
            </p>
            <p className="quote-author">— Samuel Hahnemann</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
