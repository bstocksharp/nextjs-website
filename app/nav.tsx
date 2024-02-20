import Link from "next/link";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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
    <div>
      <nav style={{ height: isMenuOpen ? "100vh" : "65px" }}>
        {!isMenuOpen && windowWidth > 600 ? (
          // layout for full page
          <div>
            {navItems.map((item) => (
              <React.Fragment key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-link-full ${
                    pathname === item.href ? "nav-active-tab" : ""
                  }`}
                >
                  {item.label}
                </Link>
                {
                  item !== navItems[navItems.length - 1] &&
                    "|" /* Add separator if it's not the last item */
                }
              </React.Fragment>
            ))}
          </div>
        ) : (
          /* layout for when menu is toggled or small screen size*/
          <div className={isMenuOpen ? "nav-dropdown-content" : ""}>
            {navItems.map((item) => (
              <Link
                href={item.href}
                className={`nav-link-full ${
                  pathname === item.href ? "nav-active-tab" : "hidden"
                }`}
                onClick={toggleMenu}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
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
