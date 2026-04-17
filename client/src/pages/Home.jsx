import CTA from "../components/CTA";
import Doctor from "../components/Doctor";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import Services from "../components/Services";
import Stats from "../components/Stats";
import Testimonials from "../components/Testimonials";

function Home() {
  return (
    <>
      <Doctor />
      <Hero />
      <Stats />
      <Services />
      <Testimonials />
      <CTA />
      <Footer />
    </>
  );
}

export default Home;
