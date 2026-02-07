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

export const resolveStateTimezone = (state?: string, timezone?: string) => {
    // If timezone is already provided and valid, use it
    if (timezone) {
        // Simple check, could be more robust
        const isValid = Object.values(TIMEZONE_MAPPING).includes(timezone);
        if (isValid) {
            // Try to infer state if not provided
            const inferredState = state || Object.keys(TIMEZONE_MAPPING).find(key => TIMEZONE_MAPPING[key] === timezone) || 'SA';
             return { state: inferredState, timezone };
        }
    }

    // Default to SA if nothing provided
    const targetState = state || 'SA';
    const resolvedTimezone = TIMEZONE_MAPPING[targetState] || TIMEZONE_MAPPING['SA'];
    
    return {
        state: targetState,
        timezone: resolvedTimezone
    };
};
