import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Star, Quote } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export interface TestimonialCardProps {
  name: string;
  location: string;
  rating: number;
  review: string;
  image: string;
}

export function TestimonialCard({ name, location, rating, review, image }: TestimonialCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -4 }} 
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="relative h-full overflow-hidden rounded-2xl border border-black/5 bg-[#fffaf6]/90 backdrop-blur-sm shadow-sm transition-shadow hover:shadow-xl hover:shadow-saffron/10">
        <Quote className="absolute right-4 top-4 h-12 w-12 text-saffron/10" />
      <CardContent className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <div
            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100"
            onContextMenu={(event) => event.preventDefault()}
          >
            <Image 
              src={image} 
              alt={name}
              fill
              sizes="48px"
              draggable={false}
              className="select-none object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-start gap-1.5">
              <h4 className="min-w-0 text-wrap-safe text-base font-medium leading-tight text-text-primary">{name}</h4>
              <CheckCircle2 className="h-4 w-4 shrink-0 fill-green-600 text-white" />
            </div>
            <p className="mt-1 text-wrap-safe text-sm leading-5 text-text-primary/65">{location}</p>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              size={17}
              fill={i < rating ? "#E67E22" : "transparent"}
              color={i < rating ? "#E67E22" : "#D1D5DB"}
            />
          ))}
        </div>

        <p className="text-wrap-safe text-base font-medium leading-7 text-text-primary/80">
          {review}
        </p>
      </CardContent>
      </Card>
    </motion.div>
  );
}
