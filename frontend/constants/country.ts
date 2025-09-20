export type Country = {
    name: string;
    dialCode: string;
    code: string;
    flag: string; // emoji flag for lightweight display
  };
  
  export const COUNTRIES: Country[] = [
    { name: "India", dialCode: "+91", code: "IN", flag: "🇮🇳" },
    { name: "United States", dialCode: "+1", code: "US", flag: "🇺🇸" },
    { name: "United Kingdom", dialCode: "+44", code: "GB", flag: "🇬🇧" },
    { name: "United Arab Emirates", dialCode: "+971", code: "AE", flag: "🇦🇪" },
    { name: "Singapore", dialCode: "+65", code: "SG", flag: "🇸🇬" },
    { name: "Canada", dialCode: "+1", code: "CA", flag: "🇨🇦" },
    { name: "Germany", dialCode: "+49", code: "DE", flag: "🇩🇪" },
    { name: "France", dialCode: "+33", code: "FR", flag: "🇫🇷" },
    { name: "Australia", dialCode: "+61", code: "AU", flag: "🇦🇺" },
    { name: "Spain", dialCode: "+34", code: "ES", flag: "🇪🇸" },
    { name: "Italy", dialCode: "+39", code: "IT", flag: "🇮🇹" },
    { name: "Brazil", dialCode: "+55", code: "BR", flag: "🇧🇷" },
    { name: "South Africa", dialCode: "+27", code: "ZA", flag: "🇿🇦" },
    { name: "Saudi Arabia", dialCode: "+966", code: "SA", flag: "🇸🇦" },
    { name: "Qatar", dialCode: "+974", code: "QA", flag: "🇶🇦" },
    { name: "Kuwait", dialCode: "+965", code: "KW", flag: "🇰🇼" },
    { name: "Oman", dialCode: "+968", code: "OM", flag: "🇴🇲" },
    { name: "Bahrain", dialCode: "+973", code: "BH", flag: "🇧🇭" },
    { name: "Sri Lanka", dialCode: "+94", code: "LK", flag: "🇱🇰" },
    { name: "Nepal", dialCode: "+977", code: "NP", flag: "🇳🇵" }
  ];
  
  export const DEFAULT_COUNTRY: Country = COUNTRIES[0];