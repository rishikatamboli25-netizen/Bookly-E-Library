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
  LuX,
} from "react-icons/lu";

const Sidebar = ({ open, setOpen }) => {
  const [collapsed, setCollapsed] = useState(false);

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
      label: "My Library",
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

  const isActive = (path) => {
    const currentPath = location.pathname;

    if (path === "/") {
      return currentPath === "/";
    }

    return (
      currentPath === path ||
      currentPath.startsWith(`${path}/`)
    );
  };

  return (
    <>
      {/* ===============================
          Mobile Overlay
      =============================== */}

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ===============================
          Sidebar
      =============================== */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          flex
          h-[100dvh]
          flex-col
          overflow-hidden
          border-r
          border-border-light
          bg-gradient-to-b
          from-brand-light
          via-white
          to-white
          transition-all
          duration-300

          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }

          w-72

          md:relative
          md:translate-x-0
          ${
            collapsed
              ? "md:w-20"
              : "md:w-64 lg:w-72"
          }
        `}
      >
        {/* Decorative blobs */}

        <div className="pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 rounded-full bg-brand-hover/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-60 w-60 rounded-full bg-brand/15 blur-3xl" />

        {/* ===============================
            Header
        =============================== */}

        <div
          className={`
            relative
            z-10
            flex
            items-center
            px-5
            pt-6
            pb-4

            ${
              collapsed
                ? "justify-center"
                : "justify-between"
            }
          `}
        >
          {!collapsed && (
            <img
              src={logo}
              alt="Logo"
              className="w-36 lg:w-40"
            />
          )}

          {/* Desktop collapse */}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="
              hidden
              md:flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
              border-white/80
              bg-white/60
              text-text-secondary
              shadow-md
              transition-all
              hover:bg-white
              hover:text-brand
            "
          >
            {collapsed ? (
              <LuPanelLeft size={20} />
            ) : (
              <LuPanelRight size={20} />
            )}
          </button>

          {/* Mobile close */}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
              border-white/80
              bg-white/60
              md:hidden
            "
          >
            <LuX size={20} />
          </button>
        </div>

        {/* ===============================
            Navigation
        =============================== */}

        <div className="relative z-10 flex-1 px-3">
          <ul className="flex flex-col gap-2">
            {navItems.map(({ label, icon: Icon, path }) => {
              const active = isActive(path);

              return (
                <li key={label}>
                  <Link
                    to={path}
                    onClick={() => setOpen(false)}
                    className={`
                      group
                      flex
                      items-center
                      rounded-xl
                      transition-all
                      duration-300

                      ${
                        collapsed
                          ? "justify-center px-0 py-3"
                          : "gap-3 px-4 py-3"
                      }

                      ${
                        active
                          ? "bg-brand-light text-brand shadow-md"
                          : "text-text-secondary hover:bg-white hover:text-brand"
                      }
                    `}
                  >
                    <Icon
                      size={20}
                      className="shrink-0 transition-transform group-hover:scale-105"
                    />

                    {!collapsed && (
                      <span className="font-medium">
                        {label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ===============================
            Profile
        =============================== */}

        <div className="relative z-10 p-4">
          <Link
            to="/Profile"
            onClick={() => setOpen(false)}
          >
            {!collapsed ? (
              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-white/80
                  bg-white/60
                  p-2
                  shadow-md
                  transition
                  hover:bg-white
                "
              >
                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-full
                    bg-brand-light
                  "
                >
                  <LuUser
                    size={22}
                    className="text-brand"
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    Alex
                  </p>

                  <p className="text-xs text-text-secondary">
                    View Profile
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="
                  mx-auto
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/80
                  bg-white/60
                  shadow-md
                  transition
                  hover:bg-white
                "
              >
                <LuUser
                  size={20}
                  className="text-brand"
                />
              </div>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;