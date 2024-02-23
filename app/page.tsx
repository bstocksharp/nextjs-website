"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";

export default function Home() {
  const [myTitle, setMyTitle] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const titles = ["Software Engineer.", "UI/UX Designer.", "Father."]; // Add more titles as needed
    let timeoutId: string | number | NodeJS.Timeout | undefined;

    const typeWriter = (index: number) => {
      if (index < titles.length) {
        const title = titles[index];
        for (let i = 1; i <= title.length; i++) {
          timeoutId = setTimeout(() => {
            setMyTitle(title.substring(0, i));
          }, i * 200); // Adjust the interval duration as needed
        }
        setTimeout(() => eraseText(index), title.length * 200 + 1000); // 1000 milliseconds delay before erasing
      }
    };

    const eraseText = (index: number) => {
      if (index < titles.length - 1) {
        setMyTitle("");
        setTimeout(() => setCurrentIndex(index + 1), 1000);
      }
    };

    typeWriter(currentIndex); // Start typing with the first title

    return () => clearTimeout(timeoutId);
  }, [currentIndex]);

  return (
    <div className="home-wrapper">
      <div className="pic-and-words-wrapper">
        <div className="words-wrapper">
          <h1>Hi! I&apos;m Bryce. </h1>
          <div className="words-single-line">
            <h2>I&apos;m a </h2>
            <h2 className="title-box-wrapper">{myTitle}</h2>
          </div>
        </div>
        <div className="profile-image">
          <Image
            src="/profile_pic_2_removed.png"
            alt="Profile Picture"
            width={350}
            height={350}
            style={{ borderRadius: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
