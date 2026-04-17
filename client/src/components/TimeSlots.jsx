import { useEffect, useState } from "react";
import API_URL from "../config";

function TimeSlots({ selectedDate, setSelectedTime, selectedTime, consultationType }) {
  const [booked, setBooked] = useState([]);

  // Morning: 10:30 AM – 11:30 AM | Evening: 6:00 PM – 9:00 PM (Mon–Sat)
  const allTimes = [
    "10:30",
    "11:00",
    "11:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
  ];

  // If chronic disease, filter to only show on-the-hour times (1 hour gap)
  const times = consultationType === "Chronic Disease"
    ? allTimes.filter(time => time.endsWith(":00"))
    : allTimes;

  // Check if the selected date is a Sunday
  const isSunday = selectedDate
    ? new Date(selectedDate).getDay() === 0
    : false;

  useEffect(() => {
    if (selectedDate) {
      fetch(`${API_URL}/appointments/booked/${selectedDate}`)
        .then((res) => res.json())
        .then((data) => setBooked(data));
    }
  }, [selectedDate]);

  return (
    <div className="time-slots">
      {isSunday ? (
        <p className="sunday-closed">Clinic is closed on Sundays.</p>
      ) : (
        times.map((time) => {
          const disabled = booked.includes(time);

          return (
            <button
              key={time}
              disabled={disabled}
              className={`time-btn ${disabled ? "disabled" : ""} ${selectedTime === time ? "selected" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                setSelectedTime(time);
              }}
            >
              {time}
            </button>
          );
        })
      )}
    </div>
  );
}

export default TimeSlots;
