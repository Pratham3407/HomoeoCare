import { useState, useContext } from "react";
import TimeSlots from "./TimeSlots";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { apiFetch } from "../utils/api";

function AppointmentForm() {
  const { user, logout } = useContext(AuthContext);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType, setAppointmentType] = useState("offline");
  const [consultationType, setConsultationType] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    //  Validation
    if (!selectedDate || !selectedTime) {
      toast.error("Please select date and time");
      return;
    }

    if (!user) {
      toast.error("Please login first");
      return;
    }

    try {
      const response = await apiFetch("/appointments", {
        method: "POST",
        body: JSON.stringify({
          patientId: user._id,
          date: selectedDate,
          time: selectedTime,
          type: appointmentType,
          consultationType,
          reason,
        }),
      }, logout);

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message || "Something went wrong");
      }

      // optional reset
      setSelectedDate("");
      setSelectedTime("");
      setAppointmentType("offline");
      setConsultationType("");
      setReason("");
    } catch (error) {
      console.log(error);
      alert("Error booking appointment");
    }
  };

  return (
    <form className="appointment-form" onSubmit={handleSubmit}>
      <h3>Appointment Details</h3>

      <select 
        value={consultationType} 
        onChange={(e) => {
          setConsultationType(e.target.value);
          setSelectedTime("");
        }}
      >
        <option value="">Select consultation type</option>
        <option value="General Consultation">General Consultation</option>
        <option value="Chronic Disease">Chronic Disease</option>
        <option value="Follow-up">Follow-up</option>
      </select>

      <div className="appointment-type-selector" style={{ margin: "16px 0", display: "flex", gap: "20px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input
            type="radio"
            name="appointmentType"
            value="offline"
            checked={appointmentType === "offline"}
            onChange={(e) => setAppointmentType(e.target.value)}
          />
          🏥 In-Person (Offline)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input
            type="radio"
            name="appointmentType"
            value="online"
            checked={appointmentType === "online"}
            onChange={(e) => setAppointmentType(e.target.value)}
          />
          📹 Video Call (Online)
        </label>
      </div>

      <div className="form-row">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        <TimeSlots
          selectedDate={selectedDate}
          setSelectedTime={setSelectedTime}
          selectedTime={selectedTime}
          consultationType={consultationType}
        />
      </div>

      <h3>Health Information</h3>

      <textarea 
        placeholder="Describe your health concern"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      ></textarea>

      <button className="appointment-btn">Request Appointment</button>
    </form>
  );
}

export default AppointmentForm;
