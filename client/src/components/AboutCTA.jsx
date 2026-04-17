import { Link } from "react-router-dom";
import "../styles/about/aboutCTA.css";

function AboutCTA() {
  return (
    <section className="about-cta">
      <div className="about-cta-container">
        <h2>Experience the Difference</h2>
        <br></br>
        <p>Schedule a consultation and discover personalized homeopathic care.</p>
        <br></br>
        <Link to="/appointment">
          <button className="cta-btn">Book Your Consultation</button>
        </Link>
      </div>
    </section>
  );
}

export default AboutCTA;
