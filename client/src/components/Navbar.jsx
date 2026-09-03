import "../styles/navbar.css";
import { useState, useContext, useEffect } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";
import logo from "../assets/logo.png";
import { AuthContext } from "../context/AuthContext";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // Single authoritative logout handler shared by the desktop button and the
  // mobile drawer. It mirrors the Profile page's working logout: clear auth via
  // the centralized `logout`, then navigate to the public landing page.
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="logo-circle">
            <img src={logo} alt="logo" />
          </div>
          <div>
            <div className="logo-title">Dr. Suketu Shah</div>
            <br />
            <div className="logo-sub">Homoeopathic Consultant</div>
          </div>
        </Link>

        {/* Hamburger Menu Icon */}
        <div className={`hamburger ${isMenuOpen ? "open" : ""}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Desktop nav links */}
        <div className="nav-links-desktop">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>

          <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
            About
          </NavLink>

          {location.pathname === "/" ? (
            <ScrollLink to="services" smooth={true} duration={500} spy={true} activeClass="active">
              Services
            </ScrollLink>
          ) : (
            <Link to="/#services">Services</Link>
          )}

          {location.pathname === "/" ? (
            <ScrollLink to="testimonials" smooth={true} duration={500} spy={true} activeClass="active">
              Testimonials
            </ScrollLink>
          ) : (
            <Link to="/#testimonials">Testimonials</Link>
          )}

          {location.pathname === "/" ? (
            <ScrollLink to="contact" smooth={true} duration={500} spy={true} activeClass="active">
              Contact
            </ScrollLink>
          ) : (
            <Link to="/#contact">Contact</Link>
          )}
        </div>

        {/* Desktop nav right */}
        <div className="nav-right-desktop">
          <a href="tel:+919824011536" style={{ textDecoration: "none" }}>
            <button className="nav-btn" style={{ background: "transparent", border: "1px solid #6f8f7b", color: "#6f8f7b" }}>
              Call Now
            </button>
          </a>

          {user ? (
            <>
              {user.role === "doctor" ? (
                <Link to="/doctor/dashboard">
                  <button className="nav-btn">Dashboard</button>
                </Link>
              ) : (
                <Link to="/profile">
                  <button className="nav-btn">My Profile</button>
                </Link>
              )}
              <button className="nav-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/appointment">
                <button className="nav-btn">Book Appointment</button>
              </Link>
              <Link to="/login">
                <button className="nav-btn">Login</button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile backdrop */}
        <div
          className={`mobile-backdrop ${isMenuOpen ? "active" : ""}`}
          onClick={closeMenu}
        />

        {/* Mobile drawer */}
        <div className={`mobile-drawer ${isMenuOpen ? "active" : ""}`}>
          {/* Drawer header */}
          <div className="drawer-header">
            <Link to="/" className="drawer-logo" style={{ textDecoration: "none", color: "inherit" }} onClick={closeMenu}>
              <div className="logo-circle">
                <img src={logo} alt="logo" />
              </div>
              <div>
                <div className="logo-title">Dr. Suketu Shah</div>
                <div className="logo-sub">Homoeopathic Consultant</div>
              </div>
            </Link>
            <button className="drawer-close" onClick={closeMenu} aria-label="Close menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Drawer nav links */}
          <div className="drawer-nav">
            <NavLink to="/" end className={({ isActive }) => `drawer-link ${isActive ? "active" : ""}`} onClick={closeMenu}>
              Home
            </NavLink>

            <NavLink to="/about" className={({ isActive }) => `drawer-link ${isActive ? "active" : ""}`} onClick={closeMenu}>
              About
            </NavLink>

            {location.pathname === "/" ? (
              <ScrollLink to="services" smooth={true} duration={500} spy={true} activeClass="active" className="drawer-link" onClick={closeMenu}>
                Services
              </ScrollLink>
            ) : (
              <Link to="/#services" className="drawer-link" onClick={closeMenu}>Services</Link>
            )}

            {location.pathname === "/" ? (
              <ScrollLink to="testimonials" smooth={true} duration={500} spy={true} activeClass="active" className="drawer-link" onClick={closeMenu}>
                Testimonials
              </ScrollLink>
            ) : (
              <Link to="/#testimonials" className="drawer-link" onClick={closeMenu}>Testimonials</Link>
            )}

            {location.pathname === "/" ? (
              <ScrollLink to="contact" smooth={true} duration={500} spy={true} activeClass="active" className="drawer-link" onClick={closeMenu}>
                Contact
              </ScrollLink>
            ) : (
              <Link to="/#contact" className="drawer-link" onClick={closeMenu}>Contact</Link>
            )}
          </div>

          {/* Drawer CTA buttons */}
          <div className="drawer-cta">
            <a href="tel:+919824011536" className="drawer-btn drawer-btn-outline" onClick={closeMenu}>
              Call Now
            </a>

            {user ? (
              <>
                {user.role === "doctor" ? (
                  <Link to="/doctor/dashboard" className="drawer-btn drawer-btn-primary" onClick={closeMenu}>
                    Dashboard
                  </Link>
                ) : (
                  <Link to="/profile" className="drawer-btn drawer-btn-primary" onClick={closeMenu}>
                    My Profile
                  </Link>
                )}
                <button className="drawer-btn drawer-btn-secondary" onClick={() => { closeMenu(); handleLogout(); }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/appointment" className="drawer-btn drawer-btn-primary" onClick={closeMenu}>
                  Book Appointment
                </Link>
                <Link to="/login" className="drawer-btn drawer-btn-secondary" onClick={closeMenu}>
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
