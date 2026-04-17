import { useRef, useState, useEffect, useCallback } from "react";
import "../styles/services.css";

const services = [

  {
    icon: "🫁",
    title: "Respiratory Disorders",
    desc: "Treatment for common cold, allergic cough, sinusitis, laryngitis, pneumonia, asthma, tinnitus, and allergic bronchitis.",
  },
  {
    icon: "🍽️",
    title: "Digestive Diseases",
    desc: "Relief for hyperacidity, peptic ulcer, gas, constipation, diarrhea, dysentery, piles, fissures, jaundice, gallstone, pancreatitis, and ulcerative colitis.",
  },
  {
    icon: "👶",
    title: "Pediatric Disorders",
    desc: "Care for growth problems, recurrent cold and cough, tonsillitis, childhood migraine, nocturnal enuresis, sleepwalking, mental challenges, weak studies, and hyperactivity disorder.",
  },
  {
    icon: "👩",
    title: "Gynaecological Problems",
    desc: "Treatment for menstrual irregularities, leucorrhoea, vaginitis, urinary tract infections, ovarian cysts, agalactorrhoea, mastitis, and menopausal complaints.",
  },
  {
    icon: "🧠",
    title: "Mental Disorders",
    desc: "Support for depression, aggressive personality disorder, phobic disorder, anxiety disorder, and sleep disorders.",
  },
  {
    icon: "🦴",
    title: "Rheumatological Disorders",
    desc: "Management of osteoarthritis, rheumatoid arthritis, gout, chronic backache, lumbar and cervical spondylosis, and sciatica.",
  },
  {
    icon: "🧬",
    title: "Endocrinal Disorders",
    desc: "Care for thyroid disorders, diabetes mellitus, and adrenal and pituitary gland disorders.",
  },
  {
    icon: "❤️",
    title: "Cardio-Vascular Diseases",
    desc: "Treatment for hypertension, anginal pain, and hypercholesterolemia.",
  },
  {
    icon: "🧴",
    title: "Skin, Hair & Nail Disorders",
    desc: "Solutions for acne, eczema, fungal infections, urticaria, allergic dermatitis, boils, corns, vitiligo, leucoderma, hair fall, dandruff, alopecia, paronychia, and deformed nails.",
  },
  {
    icon: "🧠",
    title: "Neurological Disorders",
    desc: "Treatment for hyperesthesia, anesthesia, peripheral neuritis, and polyneuritis.",
  },
  {
    icon: "🩺",
    title: "Renal Disorders",
    desc: "Care for pyorrhoea, cystitis, nephritis, nephrotic syndrome, and renal stones.",
  }

];

const VISIBLE = 4;
const GAP = 30;
const AUTO_INTERVAL = 1800; // ms between auto-slides (faster)

function Services() {
  // Triple the array so we have a buffer on both sides for seamless looping
  const slides = [...services, ...services, ...services];
  const totalOriginal = services.length;

  const [currentIndex, setCurrentIndex] = useState(totalOriginal); // start at the first "middle" copy
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef(null);
  const autoPlayRef = useRef(null);

  // Calculate how far to translate based on card width
  const getTranslateX = useCallback(
    (index) => {
      if (!trackRef.current) return 0;
      const card = trackRef.current.querySelector(".service-card");
      if (!card) return 0;
      const cardWidth = card.offsetWidth + GAP;
      return -(index * cardWidth);
    },
    []
  );

  // Seamless jump (no transition) when we go out of the "middle" range
  useEffect(() => {
    if (!isTransitioning) return;

    const handleTransitionEnd = () => {
      // If we've scrolled past the middle copy, jump back silently
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

  // After a silent jump, re-enable transitions on the next frame
  useEffect(() => {
    if (!isTransitioning) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
    }
  }, [isTransitioning]);

  // Auto-play (respects isPaused)
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

  const pauseSlider = () => setIsPaused(true);
  const resumeSlider = () => setIsPaused(false);

  const goNext = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const goPrev = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  return (
    <section className="services" id="services">
      <div className="services-container">
        <h2>How We Can Help</h2>
        <p className="services-subtitle">
          Comprehensive homoeopathic care tailored to your individual needs
        </p>

        <div className="slider-outer">
          <button className="slider-arrow slider-arrow--left" onClick={goPrev} aria-label="Previous">
            &#10094;
          </button>

          <div
            className="slider-wrapper"
            onMouseEnter={pauseSlider}
            onMouseLeave={resumeSlider}
          >
            <div
              className="slider-track"
              ref={trackRef}
              style={{
                transform: `translateX(${getTranslateX(currentIndex)}px)`,
                transition: isTransitioning ? "transform 0.7s cubic-bezier(0.45, 0, 0.15, 1)" : "none",
              }}
            >
              {slides.map((s, i) => (
                <div className="service-card" key={i}>
                  <div className="icon-box">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <button className="slider-arrow slider-arrow--right" onClick={goNext} aria-label="Next">
            &#10095;
          </button>
        </div>
      </div>
    </section>
  );
}

export default Services;
