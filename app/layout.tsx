"use client";

import { Button } from "@mui/material";
import NavBar from "./nav";
import React, { useState } from "react";
import ThemeContext from "./ThemeContext";
import "./globals.css";

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
    <ThemeContext darkMode={darkMode}>
      <html className={darkMode ? "dark" : ""}>
        <head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Bryce Sharp Website</title>
        </head>
        <body>
          <div className="min-h-screen w-full bg-background text-text flex flex-col items-center">
            <NavBar
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
              isMenuOpen={isMenuOpen}
              toggleMenu={toggleMenu}
            />
            <div className="flex flex-col items-center justify-center w-full ">
              {!isMenuOpen && children}
            </div>
          </div>
        </body>
      </html>
    </ThemeContext>
  );
}
