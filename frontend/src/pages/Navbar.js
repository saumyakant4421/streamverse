import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaUser, FaRobot, FaHome, FaFilm, FaTools, FaMoon, FaSun } from "react-icons/fa";
import { MdSunny } from "react-icons/md";

import { useAuth } from "../context/AuthContext";
import "../styles/navbar.scss";

const Navbar = () => {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <Link to="/" className="logo">Streamverse</Link>
      <div className="nav-links">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          <FaHome />
          <span>Home</span>
        </Link>
        <Link 
          to="/franchises" 
          className={`nav-link ${location.pathname === '/franchises' ? 'active' : ''}`}
        >
          <FaFilm />
          <span>Explore Franchises</span>
        </Link>
        <Link 
          to="/tools" 
          className={`nav-link ${location.pathname === '/tools' ? 'active' : ''}`}
        >
          <FaTools />
          <span>Tools</span>
        </Link>
        <Link 
          to="/recommendations" 
          className={`nav-link tool-button ${location.pathname === '/recommendations' ? 'active' : ''}`}
        >
          <FaRobot />
          <span>Movie AI</span>
        </Link>
      </div>
      <div className="nav-right">
        <button onClick={toggleDarkMode} className="dark-mode-toggle" type="button">
          {isDarkMode ? <MdSunny /> : <FaMoon />}
        </button>
        <Link to="/user" className="profile-icon">
          <FaUser />
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;