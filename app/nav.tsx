import "./globals.css";
import Link from "next/link";
import React from "react";

interface NavBarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}
export default function NavBar({ darkMode, toggleDarkMode }: NavBarProps) {
  return (
    <nav>
      <Link className="nav-link" href="/">
        Home
      </Link>
      <Link className="nav-link" href="/resume">
        Resume
      </Link>
      <Link className="nav-link" href="/calendar">
        Calendar
      </Link>
      <Link className="nav-link" href="/puzzle">
        Puzzle of the Day
      </Link>

      <button className="darkToggle" onClick={toggleDarkMode}>
        {darkMode ? "🔆" : "🌙"}
      </button>
    </nav>
  );
}
