"use client";

import NavBar from "./nav";
import Footer from "./footer";
import React, { useState } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [darkMode, setDarkMode] = useState(true);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  return (
    <html className={darkMode ? "dark-mode" : ""}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Bryce Sharp Website</title>
      </head>
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
