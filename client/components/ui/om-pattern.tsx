const mobileOmMarkIndexes = new Set([0, 2, 4, 5]);

const omMarks = [
  "-left-5 top-3 text-[5rem] opacity-[0.10] sm:text-[7rem]",
  "left-[14%] -top-8 text-[9rem] opacity-[0.075] sm:text-[12rem]",
  "left-[36%] top-[58%] text-[4rem] opacity-[0.11] sm:text-[6rem]",
  "left-[52%] top-2 text-[7rem] opacity-[0.085] sm:text-[10rem]",
  "right-[18%] top-[60%] text-[5rem] opacity-[0.105] sm:text-[7rem]",
  "-right-8 -top-10 text-[11rem] opacity-[0.09] sm:text-[15rem]",
  "left-[3%] top-[68%] text-[3.5rem] opacity-[0.09] sm:text-[5rem]",
  "right-[2%] top-[64%] text-[4rem] opacity-[0.10] sm:text-[6rem]",
];

export function OmPattern() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none text-saffron opacity-[0.55]"
    >
      {omMarks.map((className, index) => (
        <span
          key={index}
          className={`font-devanagari absolute font-normal leading-none ${
            mobileOmMarkIndexes.has(index) ? "" : "hidden sm:block"
          } ${className}`}
        >
          {"\u0950"}
        </span>
      ))}
    </div>
  );
}