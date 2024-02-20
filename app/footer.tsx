import "./globals.css";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import Image from "next/image";

export default function Footer() {
  const [isLinkedInHovered, setIsLinkedInHovered] = useState(false);
  const [isGithubHovered, setIsGithubHovered] = useState(false);
  const [isEmailHovered, setIsEmailHovered] = useState(false);

  const handleCopyEmail = () => {
    const emailToCopy = "bstocksharp@gmail.com";

    // Create a textarea element to hold the email address
    const textarea = document.createElement("textarea");
    textarea.value = emailToCopy;
    document.body.appendChild(textarea);

    // Select the email address inside the textarea
    textarea.select();

    // Copy the selected email address to the clipboard
    document.execCommand("copy");

    // Remove the textarea from the DOM
    document.body.removeChild(textarea);
  };

  return (
    <footer className="foot">
      <div className="footer-logos">
        <a
          href="https://www.linkedin.com/in/bryce-sharp/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src={
              isLinkedInHovered
                ? "/linkedin_logo.png"
                : "/linkedin_logo_dark.png"
            }
            width={40}
            height={40}
            alt="LinkedIn"
            onMouseEnter={() => setIsLinkedInHovered(true)}
            onMouseLeave={() => setIsLinkedInHovered(false)}
            style={{ margin: "10px" }}
          />
        </a>
        <a
          href="https://github.com/bstocksharp"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src={isGithubHovered ? "/github_logo.png" : "/github_logo_dark.png"}
            width={40}
            height={40}
            alt="Github"
            onMouseEnter={() => setIsGithubHovered(true)}
            onMouseLeave={() => setIsGithubHovered(false)}
            style={{ margin: "10px" }}
          />
        </a>
        <Image
          src={isEmailHovered ? "/email_logo.png" : "/email_logo_dark.png"}
          width={40}
          height={40}
          alt="Email"
          onMouseEnter={() => setIsEmailHovered(true)}
          onMouseLeave={() => setIsEmailHovered(false)}
          onClick={handleCopyEmail}
          style={{ margin: "10px", cursor: "pointer" }}
        />
        <div className={isEmailHovered ? "show-email-tooltip" : "hidden"}>
          Click to copy email address
        </div>
        {/* TODO add confirmation sometime */}
      </div>
    </footer>
  );
}
