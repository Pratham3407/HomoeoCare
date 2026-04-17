import AppointmentForm from "../components/AppointmentForm";
import AppointmentSidebar from "../components/AppointmentSidebar";
import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

import "../styles/appointment.css";

function BookAppointment() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) {
      toast.error("Please login to book an appointment");
      navigate("/login");
    }
  }, [user, navigate]);
  return (
    <section className="appointment-page">
      <div className="appointment-header">
        <p className="tag">BOOK NOW</p>
        <h1>Schedule Your Appointment</h1>
        <p className="subtitle">
          Take the first step toward natural wellness. Select your preferred date and
          time.
        </p>
      </div>

      <div className="appointment-layout">
        <AppointmentForm />

        <AppointmentSidebar />
      </div>

      {/* <div>
        <Footer />
      </div> */}
    </section>
  );
}

export default BookAppointment;
