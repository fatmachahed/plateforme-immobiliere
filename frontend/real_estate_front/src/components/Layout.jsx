import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children, noFooter = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ flex: 1, width: "100%" }}>
        {children}
      </main>
      {!noFooter && <Footer />}
    </div>
  );
}
