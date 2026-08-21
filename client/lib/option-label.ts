const planTerms = /\s*(?:plan|പ്ലാൻ|प्लान|प्लॅन|योजना|திட்டம்)\s*/giu;

export function removePlanTerm(label: string): string {
  const cleanedLabel = label.replace(planTerms, " ").trim();
  return cleanedLabel || label;
}
