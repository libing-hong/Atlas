import { AU_VISA_POLICY } from "./AU";
import { FR_VISA_POLICY } from "./FR";
import { GB_VISA_POLICY } from "./GB";
import type { VisaCountryCode, VisaPolicy } from "./types";

export * from "./types";

export const VISA_POLICIES: Record<VisaCountryCode, VisaPolicy> = {
  GB: GB_VISA_POLICY,
  FR: FR_VISA_POLICY,
  AU: AU_VISA_POLICY,
};

export function normalizeVisaCountry(country: string): VisaCountryCode | null {
  const value = country.trim().toLowerCase();
  if (["英国", "gb", "uk", "united kingdom"].includes(value)) return "GB";
  if (["法国", "fr", "france"].includes(value)) return "FR";
  if (["澳大利亚", "澳洲", "au", "australia"].includes(value)) return "AU";
  return null;
}
