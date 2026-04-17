import { useState, useEffect, useRef, useCallback } from "react";
import "../styles/testimonials.css";

const testimonials = [
  {
    icon: "🫁",
    category: "Respiratory Disorders",
    quote:
      "I used to get frequent cough and breathing issues, especially during weather changes. After taking treatment here, my asthma is much more under control now. I don't fall sick as often as before.",
  },
  {
    icon: "🍽️",
    category: "Digestive Diseases",
    quote:
      "I had constant acidity and stomach discomfort for years. Medicines gave only temporary relief, but this treatment actually helped improve my digestion slowly. I feel much better now.",
  },
  {
    icon: "👶",
    category: "Pediatric Disorders",
    quote:
      "My child used to catch cold very frequently and it affected his studies too. After starting treatment, his immunity improved and he's much more active now. Really thankful for the care.",
  },
  {
    icon: "👩",
    category: "Gynaecological Problems",
    quote:
      "I was facing irregular periods and hormonal issues. The treatment here helped regulate everything gradually without any side effects. It felt safe and natural.",
  },
  {
    icon: "🧠",
    category: "Mental Disorders",
    quote:
      "I was dealing with anxiety and poor sleep. What I liked is how calmly everything was handled. Over time, I started feeling more relaxed and my sleep improved a lot.",
  },
  {
    icon: "🦴",
    category: "Rheumatological Disorders",
    quote:
      "I had severe joint pain and stiffness, especially in the mornings. After a few months of treatment, the pain reduced significantly and I can move much more comfortably now.",
  },
  {
    icon: "🧬",
    category: "Endocrinal Disorders",
    quote:
      "Managing my thyroid was always difficult, but this treatment really helped stabilize things. I feel more energetic and balanced now.",
  },
  {
    icon: "❤️",
    category: "Cardio-Vascular Diseases",
    quote:
      "My BP used to fluctuate a lot. After regular treatment and guidance, it has become much more stable. I feel more in control of my health.",
  },
  {
    icon: "🧴",
    category: "Skin, Hair & Nail Disorders",
    quote:
      "I had acne and hair fall issues which affected my confidence. The improvement was gradual but noticeable. My skin is clearer now and hair fall has reduced a lot.",
  },
  {
    icon: "🧠",
    category: "Neurological Disorders",
    quote:
      "I was experiencing nerve-related discomfort and numbness. After treatment, the symptoms reduced and I feel much more normal now.",
  },
  {
    icon: "🩺",
    category: "Renal Disorders",
    quote:
      "I had recurring urinary issues and it was really frustrating. After starting treatment here, the frequency has reduced and I feel much better overall.",
  },
];

const VISIBLE_CARDS = 3;
const CARD_GAP = 32;
const AUTO_INTERVAL = 4500;

function Testimonials() {
  const slides = [...testimonials, ...testimonials, ...testimonials];
  const totalOriginal = testimonials.length;

  const [currentIndex, setCurrentIndex] = useState(totalOriginal);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef(null);
  const autoPlayRef = useRef(null);

  const getTranslateX = useCallback((index) => {
    if (!trackRef.current) return 0;
    const card = trackRef.current.querySelector(".testimonial-card");
    if (!card) return 0;
    const cardWidth = card.offsetWidth + CARD_GAP;
    return -(index * cardWidth);
  }, []);

  // Seamless loop
  useEffect(() => {
    if (!isTransitioning) return;

    const handleTransitionEnd = () => {
      if (currentIndex >= totalOriginal * 2) {
        setIsTransitioning(false);
        setCurrentIndex(totalOriginal);
      } else if (currentIndex < totalOriginal) {
        setIsTransitioning(false);
        setCurrentIndex(currentIndex + totalOriginal);
      }
    };

    const track = trackRef.current;
    track?.addEventListener("transitionend", handleTransitionEnd);
    return () => track?.removeEventListener("transitionend", handleTransitionEnd);
  }, [currentIndex, isTransitioning, totalOriginal]);

  // Re-enable transitions after silent jump
  useEffect(() => {
    if (!isTransitioning) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
    }
  }, [isTransitioning]);

  // Auto-play
  useEffect(() => {
    clearInterval(autoPlayRef.current);
    if (!isPaused) {
      autoPlayRef.current = setInterval(() => {
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev + 1);
      }, AUTO_INTERVAL);
    }
    return () => clearInterval(autoPlayRef.current);
  }, [isPaused]);

  const goNext = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const goPrev = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  return (
    <section className="testimonials" id="testimonials">
      <div className="testimonials-container">
        <span className="testimonials-badge">Patient Stories</span>
        <h2>What Our Patients Say</h2>
        <p className="testimonials-subtitle">
          Real experiences from patients who found relief through homoeopathic care
        </p>

        <div className="testimonials-slider-outer">
          <button
            className="testimonials-arrow testimonials-arrow--left"
            onClick={goPrev}
            aria-label="Previous testimonial"
          >
            &#10094;
          </button>

          <div
            className="testimonials-slider-wrapper"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className="testimonials-slider-track"
              ref={trackRef}
              style={{
                transform: `translateX(${getTranslateX(currentIndex)}px)`,
                transition: isTransitioning
                  ? "transform 0.8s cubic-bezier(0.45, 0, 0.15, 1)"
                  : "none",
              }}
            >
              {slides.map((t, i) => (
                <div className="testimonial-card" key={i}>
                  <div className="testimonial-quote-icon">"</div>
                  <p className="testimonial-text">{t.quote}</p>
                  <div className="testimonial-footer">
                    <div className="testimonial-category-icon">{t.icon}</div>
                    <div className="testimonial-category-info">
                      <span className="testimonial-category-label">
                        {t.category}
                      </span>
                      <span className="testimonial-verified">Verified Patient</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            className="testimonials-arrow testimonials-arrow--right"
            onClick={goNext}
            aria-label="Next testimonial"
          >
            &#10095;
          </button>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
