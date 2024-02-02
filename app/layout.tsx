"use client";

import "./globals.css";
import Link from "next/link";
import NavBar from "./nav";
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
  return (
    <html className={darkMode ? "dark-mode" : ""}>
      <body>
        <main>
          <NavBar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          {children}
        </main>
      </body>
    </html>
  );
}
