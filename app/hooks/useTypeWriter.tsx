import { useEffect, useState } from "react";

interface UseTypeWriterOptions {
  titles: string[];
  speed?: number;
  eraseDelay?: number;
}

export function useTypewriter(
  titles: string[],
  speed = 200,
  eraseDelay = 1000
) {
  const [text, setText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const typeWriter = (index: number) => {
      if (index < titles.length) {
        const title = titles[index];
        for (let i = 1; i <= title.length; i++) {
          timeoutId = setTimeout(() => {
            setText(title.substring(0, i));
          }, i * speed);
        }
        setTimeout(() => eraseText(index), title.length * speed + eraseDelay);
      }
    };

    const eraseText = (index: number) => {
      if (index < titles.length - 1) {
        setText("");
        setTimeout(() => setCurrentIndex(index + 1), eraseDelay);
      }
    };

    typeWriter(currentIndex);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  return text;
}
