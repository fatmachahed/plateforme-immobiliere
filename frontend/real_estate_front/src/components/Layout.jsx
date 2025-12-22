import React from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <div
      style={{
        // minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
      }}
    >
      <Header />

      {/* Contenu principal */}
      <main
        style={{
          flex: 1,
          width: "100%",
        }}
      >
        {children}
      </main>

      <Footer />
    </div>
  );
}
