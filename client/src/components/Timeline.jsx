import "../styles/about/timeline.css";

function Timeline() {
  const timeline = [
    {
      year: "2001",
      title: "Became Homoeopathic Doctor",
      description:
        "Completed BHMS from Ahmedabad Homoeopathic Medical College.",
    },
    {
      year: "2002-2004",
      title: "ICR Training & Workshops",
      description:
        "Advanced training in Classical Homoeopathy under the ICR program, participated in seminars, and presented cases.",
    },
    {
      year: "2004",
      title: "Clinical Practice Started",
      description:
        "Established an independent homoeopathic practice and began serving the community.",
    },
    {
      year: "2015-2017",
      title: "Chicken Pox Preventive Camp",
      description:
        "Organized a medical camp in Gujarat to distribute preventive homoeopathic medicine for chicken pox.",
    },
    {
      year: "2019-2020",
      title: "COVID-19 Medical Consultant",
      description:
        "Served as a consultant at various institutes and hospitals during the COVID-19 pandemic.",
    },
    {
      year: "2019-2022",
      title: "CBT, Hypnotherapy & NLP Training",
      description:
        "Trained in Hypnotherapy and Neuro-Linguistic Programming, and became a certified CBT (Cognitive Behavioural Therapy) specialist in 2021.",
    },
    {
      year: "2020-2022",
      title: "Homoeopathic Awareness Lectures",
      description:
        "Delivered awareness lectures on homoeopathy at various banks, Lions Club of India, and social societies.",
    },
    {
      year: "2022",
      title: "Excellence in Human Services Award",
      description:
        "Awarded by Khadayta Samaj for outstanding contribution in the field of Homoeopathy.",
    },
    {
      year: "2022-Present",
      title: "Neurology OPD in Homoeopathy",
      description:
        "Practising dedicated Neurology OPD, treating neurological and psychological disorders through homoeopathic care.",
    },
    {
      year: "2004-Present",
      title: "Mentored 10+ Medical Aspirants",
      description:
        "Trained and guided over numerous medical aspirants throughout his career, helping them become skilled homoeopathic doctors.",
    },
    {
      year: "Ongoing",
      title: "Workshops, Meetings & Reading Clubs",
      description:
        "Actively organizing workshops, weekly meetings, and reading clubs to promote continuous learning in homoeopathy.",
    },
  ];

  return (
    <section className="timeline">
      <div className="timeline-container">
        <h2>Our Journey</h2>

        {timeline.map((item, i) => (
          <div key={i} className="timeline-item">
            <span className="timeline-year">{item.year}</span>

            <h3>{item.title}</h3>

            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Timeline;
