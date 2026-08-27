import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/Logo/Logo.png";

import {
  LuHouse,
  LuSearch,
  LuBookOpen,
  LuPackage,
  LuNotebook,
  LuPanelLeft,
  LuPanelRight,
  LuUser,
} from "react-icons/lu";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  const location = useLocation();

  const navItems = [
    {
      label: "Home",
      icon: LuHouse,
      path: "/",
    },
    {
      label: "Discover",
      icon: LuSearch,
      path: "/Discover",
    },
    {
      label: "MyLibrary",
      icon: LuBookOpen,
      path: "/MyLibrary",
    },
    {
      label: "Collection",
      icon: LuPackage,
      path: "/Collection",
    },
    {
      label: "Notes",
      icon: LuNotebook,
      path: "/Notes",
    },
  ];

  /*
  ============================================================
  ACTIVE TAB
  ============================================================

  Instead of storing the active tab in state, determine it
  directly from the current URL.

  This means:
  - Clicking a Link works
  - navigate() works
  - Manually changing the URL works
  - Browser back/forward works
  - Refreshing the page works
  */

  const isActive = (path) => {
    const currentPath = location.pathname;

    // Home should ONLY be active on exactly "/"
    if (path === "/") {
      return currentPath === "/";
    }

    // Other routes can also match nested routes.
    // Example:
    // /reader/123
    // /Notes/something
    // etc.
    return (
      currentPath === path ||
      currentPath.startsWith(`${path}/`)
    );
  };

  return (
    <>
      <div
        className={`relative h-screen pt-6 pl-7 pb-5 flex flex-col overflow-hidden
          bg-gradient-to-b from-brand-light/75 via-white to-white
          border-r border-border-light
          transition-[width] duration-300
          ${isOpen ? "w-[20vw]" : "w-[6vw]"}`}
      >

        {/* =====================================================
            BACKGROUND BLOOMS
        ====================================================== */}

        <div className="pointer-events-none absolute -top-20 -left-16 w-72 h-72 rounded-full bg-brand/10 blur-3xl" />

        <div className="pointer-events-none absolute top-1/2 -right-20 w-64 h-64 rounded-full bg-brand-hover/15 blur-3xl" />

        <div className="pointer-events-none absolute bottom-0 -left-12 w-60 h-60 rounded-full bg-brand/15 blur-3xl" />

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`relative z-10 flex items-center p-4 ${
            isOpen ? "justify-between" : "justify-center"
          }`}
        >
          {isOpen && (
            <img
              className="w-[60%]"
              src={logo}
              alt="Logo"
            />
          )}

          <button
            type="button"
            className="p-2.5 rounded-full text-text-secondary
              bg-white/60 backdrop-blur-xl border border-white/80
              shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_6px_16px_rgba(124,58,237,0.12)]
              hover:text-brand hover:bg-white/80 hover:-translate-y-0.5
              hover:shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_8px_20px_rgba(124,58,237,0.18)]
              active:translate-y-0
              transition-all duration-300"
          >
            {isOpen ? (
              <LuPanelRight size={20} />
            ) : (
              <LuPanelLeft size={20} />
            )}
          </button>
        </div>

        {/* =====================================================
            NAVIGATION
        ====================================================== */}

        <div className="relative z-10 mt-7 h-full flex-1">
          <ul
            className="h-full w-full p-2 flex flex-col gap-3
              font-medium text-text-secondary
              text-[clamp(14px,2vw,16px)]"
          >
            {navItems.map(
              ({ label, icon: Icon, path }) => {
                const active = isActive(path);

                return (
                  <Link
                    key={label}
                    to={path}
                    className={`group relative flex items-center gap-3
                      py-2.5 px-4 rounded-full
                      backdrop-blur-xl
                      transition-all duration-300

                      ${
                        !isOpen
                          ? "justify-center px-2.5"
                          : ""
                      }

                      ${
                        active
                          ? "bg-gray/50 border border-white/90 text-brand shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_10px_24px_rgba(124,58,237,0.15)]"
                          : "bg-gray-300/15 border border-gray-200 text-text-secondary hover:bg-white/55 hover:border-white/70 hover:text-brand hover:-translate-y-0.5"
                      }
                    `}
                  >
                    {/* Top glass sheen */}

                    <span
                      className="pointer-events-none absolute
                        inset-x-3 top-0 h-px
                        bg-gradient-to-r
                        from-transparent
                        via-white/90
                        to-transparent"
                    />

                    <Icon
                      size={20}
                      className={`shrink-0 transition-transform duration-300 ${
                        active
                          ? "scale-105"
                          : "group-hover:scale-105"
                      }`}
                    />

                    {isOpen && (
                      <li className="list-none tracking-wide">
                        {label}
                      </li>
                    )}
                  </Link>
                );
              }
            )}
          </ul>
        </div>

        {/* =====================================================
            PROFILE
        ====================================================== */}

        {isOpen && (
          <Link
            to="/Profile"
            className="relative z-10"
          >
            <div
              className="flex items-center gap-2 w-fit
                rounded-full pl-1.5 pr-4 py-1.5
                bg-white/60 backdrop-blur-xl
                border border-white/80
                shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_6px_16px_rgba(124,58,237,0.12)]
                hover:bg-white/80 hover:-translate-y-0.5
                transition-all duration-300"
            >
              <div
                className="w-[3vw] h-[6vh]
                  rounded-full bg-brand-light
                  border border-white
                  flex items-center justify-center"
              >
                <LuUser
                  size={22}
                  className="text-brand"
                />
              </div>

              <div>
                <p
                  className="text-[clamp(8px,2vw,16px)]
                    font-semibold text-text-primary"
                >
                  Alex
                </p>

                <p
                  className="text-[clamp(7px,2vw,14px)]
                    text-text-secondary"
                >
                  View Profile
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </>
  );
};

export default Sidebar;