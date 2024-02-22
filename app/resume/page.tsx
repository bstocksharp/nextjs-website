import "./resume.css";
import React from "react";

export default function ResumePage() {
  return (
    <main>
      <iframe
        src={"/resume.pdf"}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          overflow: "auto",
        }}
        title="Bryce Sharp Resume"
      />
    </main>
  );
}
