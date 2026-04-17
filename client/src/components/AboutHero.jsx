import "../styles/about/aboutHero.css";
import { motion } from "framer-motion";
import doctorImg from "../assets/doctor-portrait.png";

function AboutHero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.4 }}
      className="about-hero"
    >
      <div className="about-hero-container">
        <div className="about-hero-text">
          <span className="about-label">ABOUT THE DOCTOR</span>

          <h1>Dr. Suketu Shah</h1>

          <p className="about-degree">BHMS (I.C.R), CBT Specialist</p>

          <p>
            For over 20+ years, I've dedicated my practice to helping patients discover the
            gentle healing power of homeopathy.
          </p>

          <p>
            I believe that true healing addresses the whole person, not just symptoms but
            the underlying imbalances.
          </p>
        </div>

        <div className="about-hero-image">
          <div className="about-doctor-image-container">
            <img src={doctorImg} alt="Dr. Suketu Shah" className="about-doctor-portrait-img" />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default AboutHero;
