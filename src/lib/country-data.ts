export const TARGET_COUNTRIES = [
  { code: "GB", zh: "英国" }, { code: "FR", zh: "法国" }, { code: "AU", zh: "澳洲" },
  { code: "US", zh: "美国" }, { code: "ES", zh: "西班牙" },
] as const;
export type TargetCountryCode = typeof TARGET_COUNTRIES[number]["code"];
const byCode = new Map<TargetCountryCode, string>(TARGET_COUNTRIES.map((item) => [item.code, item.zh]));
const byLabel = new Map<string, TargetCountryCode>(TARGET_COUNTRIES.map((item) => [item.zh, item.code]));
export const countryLabel = (code: TargetCountryCode) => byCode.get(code) ?? code;
export const countryCode = (label: string) => byLabel.get(label);
export const normalizeCountryCodes = (codes: unknown, labels: unknown): TargetCountryCode[] => {
  const supplied = Array.isArray(codes) ? codes.filter((code): code is TargetCountryCode => typeof code === "string" && byCode.has(code as TargetCountryCode)) : [];
  if (supplied.length) return [...new Set(supplied)];
  return Array.isArray(labels) ? [...new Set(labels.flatMap((label) => typeof label === "string" ? [countryCode(label)].filter((code): code is TargetCountryCode => Boolean(code)) : []))] : [];
};
