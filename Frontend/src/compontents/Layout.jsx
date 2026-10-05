import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if current page is the full-screen reader view
  const isReaderPage = 
    location.pathname.startsWith("/read") || 
    location.pathname.startsWith("/reader");

  const hideNavbar =
    [
      "/MyLibrary",
      "/Notes",
      "/Notedetail",
      "/Collection",
      "/Profile",
    ].includes(location.pathname) || isReaderPage;

  // Render clean full-screen layout for the Reader page
  if (isReaderPage) {
    return (
      <main className="h-screen w-full overflow-hidden bg-background">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {!hideNavbar && (
          <Navbar
            openSidebar={() => setSidebarOpen(true)}
          />
        )}

        <main
          className={`
            flex-1
            overflow-y-auto
            ${
              !hideNavbar
                ? "pt-20 md:pt-24"
                : ""
            }
          `}
        > 


          <Outlet />
          <Footer/>
        </main>
        
      </div>
    </div>
  );
};

export default Layout;