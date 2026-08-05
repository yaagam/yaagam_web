import Image from "next/image";
import { motion } from "framer-motion";

type PoojaBenefitCardProps = {
  image: string;
  title: string;
  description: string;
  fallbackAlt: string;
};

export function PoojaBenefitCard({
  image,
  title,
  description,
  fallbackAlt,
}: PoojaBenefitCardProps) {
  return (
    <motion.article 
      whileHover={{ y: -2, transition: { duration: 0.3, ease: "easeOut" } }}
      className="flex w-full items-start gap-4 text-left group"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f4f4f4] md:h-20 md:w-20">
        {image && (
          <Image
            src={image}
            alt={title || fallbackAlt}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        )}
      </div>
      <div className="flex flex-col">
        <h3 className="text-sm font-semibold text-text-primary md:text-base">
          {title}
        </h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-text-primary/75 md:text-sm">
          {description}
        </p>
      </div>
    </motion.article>
  );
}
