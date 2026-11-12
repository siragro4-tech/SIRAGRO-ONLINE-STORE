"use client";

import { useEffect } from "react";

/**
 * ScrollEffects attaches dynamic scroll triggers,
 * floating parallax micro-particles, and 3D card tilts.
 */
export function ScrollEffects() {
  useEffect(() => {
    // 1. Intersection Observer for elements entering / leaving viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            // Optional: reset when scrolled out so it animates again when scrolling back up
            if (entry.boundingClientRect.top > 0) {
              entry.target.classList.remove("is-visible");
            }
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const animatedElements = document.querySelectorAll(
      ".scroll-pop, .scroll-slide-left, .scroll-slide-right, .scroll-fade, .crazy-card"
    );
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}

