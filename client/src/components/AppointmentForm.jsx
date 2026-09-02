import { useState, useContext, useRef } from "react";
import TimeSlots from "./TimeSlots";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { apiFetch } from "../utils/api";
import { validate } from "../utils/errors";

function AppointmentForm() {
  const { user, logout } = useContext(AuthContext);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType, setAppointmentType] = useState("offline");
  const [consultationType, setConsultationType] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  const focusFirstError = (errorObj) => {
    const firstKey = Object.keys(errorObj)[0];
    const map = {
      consultationType: "consultationType",
      appointmentDate: "appointmentDate",
      time: "time-field-error",
    };
    const id = map[firstKey];
    if (id) {
      const el = document.getElementById(id);
      if (el) setTimeout(() => el.focus(), 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const fieldErrors = {};
    const dateError = validate.date(selectedDate);
    const timeError = validate.time(selectedTime);
    const consultationError = validate.select(consultationType);

    if (consultationError) fieldErrors.consultationType = consultationError;
    if (dateError) fieldErrors.appointmentDate = dateError;
    if (timeError) fieldErrors.time = timeError;

    if (!user) {
      toast.error("Please login first");
      return;
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      focusFirstError(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await apiFetch("/appointments", {
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

      if (result.ok) {
        toast.success("Appointment requested successfully.");
        setSelectedDate("");
        setSelectedTime("");
        setAppointmentType("offline");
        setConsultationType("");
        setReason("");
      } else {
        if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
          setErrors(result.fieldErrors);
          focusFirstError(result.fieldErrors);
        } else {
          toast.error(result.message);
        }
      }
    } catch {
      toast.error("We couldn't book your appointment right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="appointment-form" ref={formRef} onSubmit={handleSubmit} noValidate>
      <h3>Appointment Details</h3>

      <label htmlFor="consultationType" style={{ fontSize: "0.85rem", fontWeight: "600", marginBottom: "5px" }}>
        Consultation Type
      </label>
      <select
        id="consultationType"
        name="consultationType"
        aria-label="Consultation type"
        aria-invalid={errors.consultationType ? "true" : "false"}
        aria-describedby={errors.consultationType ? "consultation-type-error" : undefined}
        className={errors.consultationType ? "input-error" : ""}
        value={consultationType}
        onChange={(e) => {
          setConsultationType(e.target.value);
          setSelectedTime("");
          if (errors.consultationType) {
            setErrors((prev) => ({ ...prev, consultationType: undefined }));
          }
        }}
      >
        <option value="">Select consultation type</option>
        <option value="General Consultation">General Consultation</option>
        <option value="Chronic Disease">Chronic Disease</option>
        <option value="Follow-up">Follow-up</option>
      </select>
      {errors.consultationType && (
        <p id="consultation-type-error" className="field-error" role="alert">
          {errors.consultationType}
        </p>
      )}

      <div className="appointment-type-selector" style={{ margin: "16px 0", display: "flex", gap: "20px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input
            type="radio"
            name="appointmentType"
            value="offline"
            checked={appointmentType === "offline"}
            onChange={(e) => setAppointmentType(e.target.value)}
          />
          <span> In-Person (Offline)</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input
            type="radio"
            name="appointmentType"
            value="online"
            checked={appointmentType === "online"}
            onChange={(e) => setAppointmentType(e.target.value)}
          />
          <span> Video Call (Online)</span>
        </label>
      </div>

      <div className="form-row">
        <div style={{ flex: "1", minWidth: 0 }}>
          <label htmlFor="appointmentDate" style={{ fontSize: "0.85rem", fontWeight: "600", marginBottom: "5px" }}>
            Date
          </label>
          <input
            id="appointmentDate"
            name="appointmentDate"
            aria-label="Appointment date"
            aria-invalid={errors.appointmentDate ? "true" : "false"}
            aria-describedby={errors.appointmentDate ? "appointment-date-error" : undefined}
            type="date"
            className={errors.appointmentDate ? "input-error" : ""}
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              if (errors.appointmentDate) {
                setErrors((prev) => ({ ...prev, appointmentDate: undefined }));
              }
            }}
          />
          {errors.appointmentDate && (
            <p id="appointment-date-error" className="field-error" role="alert">
              {errors.appointmentDate}
            </p>
          )}

          {errors.time && (
            <p id="time-field-error" className="field-error" role="alert">
              {errors.time}
            </p>
          )}

          <TimeSlots
            selectedDate={selectedDate}
            setSelectedTime={(time) => {
              setSelectedTime(time);
              if (errors.time) {
                setErrors((prev) => ({ ...prev, time: undefined }));
              }
            }}
            selectedTime={selectedTime}
            consultationType={consultationType}
          />
        </div>
      </div>

      <h3>Health Information</h3>

      <label htmlFor="healthConcern" style={{ fontSize: "0.85rem", fontWeight: "600", marginBottom: "5px" }}>
        Health Concern <span style={{ fontWeight: "400", color: "#999" }}>(optional)</span>
      </label>
      <textarea
        id="healthConcern"
        name="reason"
        aria-label="Describe your health concern"
        placeholder="Describe your health concern"
        value={reason}
        maxLength={1000}
        onChange={(e) => setReason(e.target.value)}
      ></textarea>

      <button className="appointment-btn" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}>
        {isSubmitting ? "Booking..." : "Request Appointment"}
      </button>
    </form>
  );
}

export default AppointmentForm;