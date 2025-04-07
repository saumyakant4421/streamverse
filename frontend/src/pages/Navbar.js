import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import "../styles/navbar.scss"; // You'll need to create this file with the navbar styles

const Navbar = () => {
  const navigate = useNavigate();
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

    // Add event listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="logo">Streamverse</div>
      <div className="nav-links">
        <Link to="/" className="active">Home</Link>
        <Link to="/franchises">Explore Franchises</Link>
        <Link to="/tools">Tools</Link>
      </div>
      <div className="profile-icon" onClick={() => navigate("/user")}>
        <FaUser />
      </div>
    </nav>
  );
};

export default Navbar;