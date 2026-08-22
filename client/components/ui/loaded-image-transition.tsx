"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type LoadedImageTransitionProps = Omit<ImageProps, "src"> & {
  src: string;
  transitionDuration?: number;
};

export function LoadedImageTransition({
  src,
  alt,
  transitionDuration = 0.3,
  ...imageProps
}: LoadedImageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayedSrc, setDisplayedSrc] = useState(src);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);


  const isChanging = src !== displayedSrc;
  const incomingReady = isChanging && loadedSrc === src;

  return (
    <>
      <Image src={displayedSrc} alt={alt} {...imageProps} />
      {isChanging && (
        <motion.div
          key={src}
          initial={false}
          animate={{ opacity: incomingReady ? 1 : 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : transitionDuration,
            ease: "easeInOut",
          }}
          onAnimationComplete={() => {
            if (incomingReady) setDisplayedSrc(src);
          }}
          className="absolute inset-0"
          aria-hidden="true"
        >
          <Image
            src={src}
            alt=""
            {...imageProps}
            priority={false}
            onLoad={() => setLoadedSrc(src)}
          />
        </motion.div>
      )}
    </>
  );
}