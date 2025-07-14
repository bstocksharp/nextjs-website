"use client";

import { Button } from "@mui/material";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useTypewriter } from "./hooks/useTypeWriter";

export default function Home() {
  const titles = ["Software Engineer.", "UI/UX Designer.", "Father."];
  const myTitles = useTypewriter(titles);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 pt-20 w-full max-w-4xl">
        {/* Left side: Text */}
        <div className="flex flex-col items-start md:items-start gap-4 flex-1">
          <h1 className="text-4xl md:text-6xl font-bold mb-2">
            Hi! I&apos;m Bryce.
          </h1>
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold">I&apos;m a</h2>
            <h2 className="text-2xl md:text-3xl text-accent font-bold mt-2 h-8 title-box-wrapper flex items-center">
              {myTitles}
            </h2>
          </div>
        </div>
        {/* Right side: Image */}
        <div className="flex-1 flex justify-center">
          <Image
            src="/profile_pic_2_removed.png"
            alt="Profile Picture"
            priority
            width={350}
            height={350}
            style={{ borderRadius: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
