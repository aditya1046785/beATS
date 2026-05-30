"use client";

import { useEffect, useMemo, useState } from "react";

type TypewriterTextProps = {
  text: string;
  speed?: number;
  loop?: boolean;
  loopDelay?: number;
  onComplete?: () => void;
  className?: string;
  startDelay?: number;
};

export default function TypewriterText({
  text,
  speed = 40,
  loop = false,
  loopDelay = 3000,
  onComplete,
  className,
  startDelay = 0,
}: TypewriterTextProps) {
  const [display, setDisplay] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  const chars = useMemo(() => text.split(""), [text]);

  useEffect(() => {
    let index = 0;
    let typingInterval: NodeJS.Timeout;
    let resetTimeout: NodeJS.Timeout;

    const startTyping = () => {
      typingInterval = setInterval(() => {
        index += 1;
        setDisplay(chars.slice(0, index).join(""));

        if (index >= chars.length) {
          clearInterval(typingInterval);
          onComplete?.();

          if (loop) {
            resetTimeout = setTimeout(() => {
              index = 0;
              setDisplay("");
              startTyping();
            }, loopDelay);
          }
        }
      }, speed);
    };

    const delayTimer = setTimeout(startTyping, startDelay);

    return () => {
      clearTimeout(delayTimer);
      clearInterval(typingInterval);
      clearTimeout(resetTimeout);
    };
  }, [chars, loop, loopDelay, onComplete, speed, startDelay]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <span className={className}>
      {display}
      <span className={cursorVisible ? "opacity-100" : "opacity-0"}>|</span>
    </span>
  );
}
