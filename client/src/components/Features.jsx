import "../styles/home.css";

function Features() {
  return (
    <section className="features">
      <h2>Our Services</h2>

      <div className="feature-cards">
        <div className="card">
          <h3>Online Consultation</h3>
          <p>Book appointment with certified homeopathy doctors.</p>
        </div>
        <div className="card">
          <h3>Medicine Ordering</h3>
          <p>Order prescribed medicines directly from our platform.</p>
        </div>

        <div className="card">
          <h3>Prescription History</h3>
          <p>Access your medical history anytime, anywhere.</p>
        </div>
      </div>
    </section>
  );
}

export default Features;
