export const STATE_OPTIONS = [
  { value: "SA", label: "South Australia (SA)" },
  { value: "VIC", label: "Victoria (VIC)" },
  { value: "NSW", label: "New South Wales (NSW)" },
  { value: "QLD", label: "Queensland (QLD)" },
  { value: "TAS", label: "Tasmania (TAS)" },
  { value: "ACT", label: "Australian Capital Territory (ACT)" },
  { value: "WA", label: "Western Australia (WA)" },
  { value: "NT", label: "Northern Territory (NT)" },
];

export const TIMEZONE_MAPPING: Record<string, string> = {
  SA: "Australia/Adelaide",
  VIC: "Australia/Melbourne",
  NSW: "Australia/Sydney",
  QLD: "Australia/Brisbane",
  TAS: "Australia/Hobart",
  ACT: "Australia/Sydney",
  WA: "Australia/Perth",
  NT: "Australia/Darwin",
};
