import "../styles/about/qualifications.css";

function Qualifications() {
  const qualifications = [
    "Bachelor of Homeopathic Medicine and Surgery (BHMS)",
    "Certified Classical Homeopath (CCH)",
    "Psycho Therapist (CBT Specialist)"
  ];

  return (
    <section className="qualifications">
      <div className="qualifications-container">
        <div className="qualification-left">
          <h2>Qualifications & Training</h2>

          <ul>
            {qualifications.map((q, i) => (
              <li key={i}>✔ {q}</li>
            ))}
          </ul>
        </div>

        <div className="qualification-right">
          <h2>Continuing Education</h2>

          <p>
            Committed to staying at the forefront of homeopathic practice, attending
            international seminars and research programs.
          </p>

          <p>
            Recent focus includes Neurological & Psychological disorder.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Qualifications;
