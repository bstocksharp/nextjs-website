import Link from "next/link";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import SunnyIcon from "@mui/icons-material/Sunny";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Resume", href: "/resume" },
  { label: "TTT", href: "/TikTakToe" },
];

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
  const pathname = usePathname();

  const activeItem = navItems.find((item) => item.href === pathname);

  useEffect(() => {
    console.log("NavBar mounted");
    const handleResize = () => {
      if (window.innerWidth >= 600 && isMenuOpen) {
        console.log("Resizing to desktop view, closing menu");
        toggleMenu();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMenuOpen, toggleMenu]);

  return (
    <>
      <nav className="flex items-center justify-between h-16 w-full px-4">
        <div className="flex gap-8 items-center">
          <div className="block sm:hidden">
            {activeItem && (
              <Link href={activeItem.href} className="text-accent font-bold">
                {activeItem.label}
              </Link>
            )}
          </div>
          <div className="hidden sm:flex gap-8 items-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${
                  pathname === item.href
                    ? "text-accent font-bold"
                    : "hover:text-accent"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="px-2 py-1 rounded hover:bg-accent"
            onClick={toggleDarkMode}
          >
            {darkMode ? <SunnyIcon /> : <DarkModeIcon />}
          </button>
          <button
            className="px-2 py-1 rounded hover:bg-accent sm:hidden"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>
      {/* Mobile full-screen menu */}
      {isMenuOpen && (
        <div className="fixed top-16 z-50 flex flex-col items-center justify-center gap-8 sm:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={toggleMenu}
              className={`text-2xl px-6 py-3 rounded  ${
                pathname === item.href
                  ? "text-accent font-bold"
                  : "hover:text-accent"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
