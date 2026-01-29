export function normalizeToE164(input: string | null | undefined, defaultCountryCode: string = "+47"): string {
  if (!input) return "";
  let s = String(input).trim().replace(/[\s\-().]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (s.startsWith("+")) return s;
  const digitsOnly = s.replace(/[^\d]/g, "");
  if (!digitsOnly) return "";
  let national = digitsOnly;
  if (defaultCountryCode === "+47" && national.startsWith("0")) national = national.replace(/^0+/, "");
  return defaultCountryCode + national;
}
export function makeTelHref(e164: string): string {
  if (!e164) return "#";
  return "tel:" + e164.replace(/\s/g, "");
}
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "-";
  const e164 = normalizeToE164(phone);
  if (!e164) return phone;
  if (e164.startsWith("+47") && e164.length === 11) return `+47 ${e164.slice(3, 6)} ${e164.slice(6, 8)} ${e164.slice(8)}`;
  return e164;
}
export function wasCalledRecently(lastCalledAt: string | null | undefined): boolean {
  if (!lastCalledAt) return false;
  const hoursSince = (new Date().getTime() - new Date(lastCalledAt).getTime()) / (1000 * 60 * 60);
  return hoursSince < 24;
}
export function formatLastCalled(lastCalledAt: string | null | undefined): string {
  if (!lastCalledAt) return "";
  const hoursSince = Math.floor((new Date().getTime() - new Date(lastCalledAt).getTime()) / (1000 * 60 * 60));
  if (hoursSince < 1) return "Ringt nylig";
  if (hoursSince < 24) return "Ringt for " + hoursSince + "t siden";
  const daysSince = Math.floor(hoursSince / 24);
  return daysSince === 1 ? "Ringt i går" : "Ringt for " + daysSince + " dager siden";
}
