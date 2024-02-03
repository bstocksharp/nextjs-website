import "./globals.css";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import hamburgerIcon from "../public/hamburger.png";

interface NavBarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}
export default function NavBar({ darkMode, toggleDarkMode }: NavBarProps) {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Remove event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div>
      {windowWidth > 600 ? (
        <nav>
          <Link className="nav-link-full" href="/">
            Home
          </Link>
          |
          <Link className="nav-link-full" href="/resume">
            Resume
          </Link>
          |
          <Link className="nav-link-full" href="/calendar">
            Calendar
          </Link>
          |
          <Link className="nav-link-full" href="/puzzle">
            Puzzle of the Day
          </Link>
          <div className="nav-right-icons">
            <button className="nav-darkToggle" onClick={toggleDarkMode}>
              {darkMode ? "🔆" : "🌙"}
            </button>
            <button className="nav-hamburger" onClick={toggleMenu}>
              ☰
            </button>
          </div>
        </nav>
      ) : (
        <nav
          className="nav-small"
          style={{ height: isMenuOpen ? "100vh" : "65px" }}
        >
          {!isMenuOpen && (
            <button className="nav-hamburger" onClick={toggleMenu}>
              ☰
            </button>
          )}
          {isMenuOpen && (
            <div className="nav-dropdown-content">
              <Link href="/" onClick={toggleMenu}>
                Home
              </Link>
              <Link href="/resume" onClick={toggleMenu}>
                Resume
              </Link>
              <Link href="/calendar" onClick={toggleMenu}>
                Calendar
              </Link>
              <Link href="/puzzle" onClick={toggleMenu}>
                Puzzle of the Day
              </Link>
            </div>
          )}
        </nav>
      )}
    </div>
  );
}
