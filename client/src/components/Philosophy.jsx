import "../styles/about/philosophy.css";

function Philosophy() {
  const philosophy = [
    {
      title: "Individualized Treatment",
      description:
        "Every person is unique. Treatment is tailored to your specific symptoms.",
    },
    {
      title: "Minimum Dose",
      description: "We use the smallest dose necessary to stimulate healing.",
    },
    {
      title: "Single Remedy",
      description: "Carefully selected single remedies allow precise treatment.",
    },
    {
      title: "Whole Person Care",
      description: "Physical, emotional and mental aspects are considered.",
    },
  ];

  return (
    <section className="philosophy">
      <div className="philosophy-container">
        <h2>Treatment Philosophy</h2>

        <div className="philosophy-grid">
          {philosophy.map((item, i) => (
            <div key={i} className="philosophy-card">
              <h3>{item.title}</h3>

              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Philosophy;
