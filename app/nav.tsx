import Link from "next/link";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

//TODO : look into loading.tsx

interface NavBarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

interface NavItem {
  label: string;
  href: string;
}

export default function NavBar({
  darkMode,
  toggleDarkMode,
  isMenuOpen,
  toggleMenu,
}: NavBarProps) {
  const [windowWidth, setWindowWidth] = useState(0);
  const pathname = usePathname();

  // used to get the windowsize of the application
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

  const navItems: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "Resume", href: "/resume" },
    { label: "Calendar", href: "/calendar" },
    { label: "Puzzle of the Day", href: "/puzzle" },
  ];

  return (
    <nav style={{ height: isMenuOpen ? "100vh" : "4rem" }}>
      {!isMenuOpen && windowWidth > 600 ? (
        // layout for large screens
        <>
          {navItems.map((item) => (
            <React.Fragment key={item.href}>
              <Link
                href={item.href}
                className={`nav-link-full ${
                  pathname === item.href ? "nav-active-highlight" : ""
                }`}
              >
                {item.label}
              </Link>
              {item !== navItems[navItems.length - 1] && "|"}
            </React.Fragment>
          ))}
        </>
      ) : (
        // layout for when menu is toggled or small screen size
        <div className={isMenuOpen ? "nav-dropdown-content" : ""}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              // allows the current active tab to be shown even when small
              className={`${
                pathname != item.href ? "hidden" : "nav-active-highlight"
              } ${windowWidth < 600 && !isMenuOpen ? "nav-active-small" : ""}`}
              onClick={toggleMenu}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <div className="nav-right-icons">
        <button className="nav-darkToggle-button" onClick={toggleDarkMode}>
          {darkMode ? "🔆" : "🌒"}
        </button>
        <button className="nav-hamburger" onClick={toggleMenu}>
          {isMenuOpen ? "X" : "☰"}
        </button>
      </div>
    </nav>
  );
}
