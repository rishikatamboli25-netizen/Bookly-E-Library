import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import React from "react";

const Layout = () => {
  const location = useLocation();

  const hideNavbar = [
    "/MyLibrary",
    "/Notes",
    "/Notedetail",
    "/Collection",
    "/Profile",
  ].includes(location.pathname);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="relative flex flex-col flex-1 overflow-x-hidden min-w-0">
        {!hideNavbar && <Navbar />}

        <main className="flex-1  overflow-y-auto">

          
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;