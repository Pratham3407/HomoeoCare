import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import About from "./pages/About";
import BookAppointment from "./pages/BookAppointment";
import DoctorDashboard from "./pages/DoctorDashboard";
import OrderMedicine from "./pages/OrderMedicine";
import PatientProfile from "./pages/PatientProfile";

function App() {
  const location = useLocation();
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/appointment" element={<BookAppointment />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/order-medicine" element={<OrderMedicine />} />
          <Route path="/profile" element={<PatientProfile />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;

