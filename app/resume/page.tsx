import React from "react";

export default function ResumePage() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-4rem)] bg-background text-text">
      <iframe
        src="/resume.pdf"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        title="Bryce Sharp Resume"
      />
    </div>
  );
}
