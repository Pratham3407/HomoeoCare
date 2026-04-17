import "../styles/stats.css";

function Stats() {
  return (
    <section className="stats">
      <div className="stats-container">
        <div className="stat">
          <h2>20+</h2>
          <p>Years Experience</p>
        </div>

        <div className="stat">
          <h2>10000+</h2>
          <p>Patients Treated</p>
        </div>

        <div className="stat">
          <h2>98%</h2>
          <p>Patient Satisfaction</p>
        </div>

        <div className="stat">
          <h2>4.9 ★</h2>
          <p>Rating</p>
        </div>
      </div>
    </section>
  );
}

export default Stats;
