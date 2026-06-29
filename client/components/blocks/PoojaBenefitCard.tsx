import Image from "next/image";

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
    <article className="flex w-full max-w-68 flex-col items-center text-center">
      <div className="relative h-22 w-22 overflow-hidden rounded-lg bg-[#f4f4f4] md:h-24 md:w-24">
        {image && (
          <Image
            src={image}
            alt={title || fallbackAlt}
            fill
            unoptimized
            className="object-cover"
          />
        )}
      </div>
      <h3 className="mt-4 text-base font-extrabold leading-6 text-text-primary">
        {title}
      </h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-text-primary/75">
        {description}
      </p>
    </article>
  );
}
