import "../styles/navbar.css";
import { useState, useContext } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";
import logo from "../assets/logo.png";
import { AuthContext } from "../context/AuthContext";

function Navbar() {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="logo">
          <div className="logo-circle">
            <img src={logo} alt="logo" />
          </div>
          <div>
            <div className="logo-title">Dr. Suketu Shah</div>
            <br />
            <div className="logo-sub">Homoeopathic Consultant</div>
          </div>
        </div>

        {/* Hamburger Menu Icon */}
        <div className={`hamburger ${isMenuOpen ? "open" : ""}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")} onClick={closeMenu}>
            Home
          </NavLink>

          <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")} onClick={closeMenu}>
            About
          </NavLink>

          {/* SERVICES */}
          {location.pathname === "/" ? (
            <ScrollLink
              to="services"
              smooth={true}
              duration={500}
              spy={true}
              activeClass="active"
              onClick={closeMenu}
            >
              Services
            </ScrollLink>
          ) : (
            <Link to="/#services" onClick={closeMenu}>Services</Link>
          )}

          {/* TESTIMONIALS */}
          {location.pathname === "/" ? (
            <ScrollLink
              to="testimonials"
              smooth={true}
              duration={500}
              spy={true}
              activeClass="active"
              onClick={closeMenu}
            >
              Testimonials
            </ScrollLink>
          ) : (
            <Link to="/#testimonials" onClick={closeMenu}>Testimonials</Link>
          )}

          {/* CONTACT */}
          {location.pathname === "/" ? (
            <ScrollLink
              to="contact"
              smooth={true}
              duration={500}
              spy={true}
              activeClass="active"
              onClick={closeMenu}
            >
              Contact
            </ScrollLink>
          ) : (
            <Link to="/#contact" onClick={closeMenu}>Contact</Link>
          )}
        </div>

        <div className={`nav-right ${isMenuOpen ? "active" : ""}`}>
          <a href="tel:+919824011536" style={{ textDecoration: "none" }} onClick={closeMenu}>
            <button className="nav-btn" style={{ background: "transparent", border: "1px solid #6f8f7b", color: "#6f8f7b" }}>
              📞 Call Now
            </button>
          </a>

          {user ? (
            <>
              {user.role === "doctor" ? (
                <Link to="/doctor/dashboard" onClick={closeMenu}>
                  <button className="nav-btn">Dashboard</button>
                </Link>
              ) : (
                <Link to="/profile" onClick={closeMenu}>
                  <button className="nav-btn">My Profile</button>
                </Link>
              )}
              <button className="nav-btn" onClick={() => { logout(); closeMenu(); }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/appointment" onClick={closeMenu}>
                <button className="nav-btn">Book Appointment</button>
              </Link>
              <Link to="/login" onClick={closeMenu}>
                <button className="nav-btn">Login</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
