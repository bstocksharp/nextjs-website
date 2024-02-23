"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";

export default function Home() {
  const [myTitle, setMyTitle] = useState("Software Engineer.");

  useEffect(() => {
    const timeouts = [
      setTimeout(() => setMyTitle("UI/UX Designer."), 4000),
      setTimeout(() => setMyTitle("Father."), 8000),
      // If you want the third thing to stay permanently
      // you don't need to set another timeout
    ];

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="home-wrapper">
      <div className="pic-and-words-wrapper">
        <div className="words-wrapper">
          <h1>H!! I&apos;m Bryce. </h1>
          <h2>I&apos;m a </h2>
          <h2 className="words-box-wrapper">{myTitle}</h2>
        </div>
        <div className="center-image">
          <Image
            src="/profile_pic_2_removed.png"
            alt="Profile Picture"
            width={300}
            height={300}
            style={{ borderRadius: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
