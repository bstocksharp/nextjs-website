"use client";

import "./globals.css";
import NavBar from "./nav";
import Footer from "./footer";
import React, { useState } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  return (
    <html className={darkMode ? "dark-mode" : ""}>
      <body>
        <NavBar
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          isMenuOpen={isMenuOpen}
          toggleMenu={toggleMenu}
        />
        {!isMenuOpen && children}

        {!isMenuOpen && <Footer />}
      </body>
    </html>
  );
}
