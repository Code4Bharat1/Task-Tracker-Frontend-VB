"use client";

import { useEffect, useState } from "react";

export default function TypeWriter({
  words = ["Accountability", "Discipline", "Execution"],
  speed = 60,
  pause = 1400,
  className = "",
  cursor = "|",
  cursorClass = "typewriter-cursor",
}) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!words || words.length === 0) return;
    const current = words[index % words.length];
    let timer;

    if (!isDeleting) {
      if (displayed.length < current.length) {
        timer = setTimeout(
          () => setDisplayed(current.slice(0, displayed.length + 1)),
          speed,
        );
      } else {
        timer = setTimeout(() => setIsDeleting(true), pause);
      }
    } else {
      if (displayed.length > 0) {
        timer = setTimeout(
          () => setDisplayed(current.slice(0, displayed.length - 1)),
          Math.max(20, Math.floor(speed / 2)),
        );
      } else {
        setIsDeleting(false);
        setIndex((i) => (i + 1) % words.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayed, isDeleting, index, words, speed, pause]);

  return (
    <span className={className} aria-hidden={false}>
      {displayed}
      <span className={cursorClass}>{cursor}</span>
    </span>
  );
}
