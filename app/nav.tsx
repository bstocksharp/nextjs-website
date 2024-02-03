import "./globals.css";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import hamburgerIcon from "../public/hamburger.png";

interface NavBarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  isMenuOpen: boolean;
  toggleMenu: () => void;
}
export default function NavBar({
  darkMode,
  toggleDarkMode,
  isMenuOpen,
  toggleMenu,
}: NavBarProps) {
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Check if window object is defined (client-side)
    if (typeof window !== "undefined") {
      // Initialize windowWidth with current window width
      setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return (
    <div>
      <nav style={{ height: isMenuOpen ? "100vh" : "65px" }}>
        {!isMenuOpen && windowWidth > 600 ? (
          <div>
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
          </div>
        ) : (
          <div className={isMenuOpen ? "nav-dropdown-content" : "hidden"}>
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

        <div className="nav-right-icons">
          <button className="nav-darkToggle" onClick={toggleDarkMode}>
            {darkMode ? "🔆" : "🌒"}
          </button>
          <button className="nav-hamburger" onClick={toggleMenu}>
            {isMenuOpen ? "X" : "☰"}
          </button>
        </div>
      </nav>
    </div>
  );
}
