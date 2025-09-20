// Brand / Primary Colors
export const ZOMATO_CRANBERRY    = '#E23744';  // brand red:contentReference[oaicite:8]{index=8}
export const ZOMATO_PEPPERCORN   = '#2D2D2D';  // dark gray (text):contentReference[oaicite:9]{index=9}
export const ZOMATO_FETA         = '#FFFFFF';  // white:contentReference[oaicite:10]{index=10}
export const ZOMATO_TYROLEAN     = '#F4F4F2';  // light gray background:contentReference[oaicite:11]{index=11}
export const ZOMATO_YELLOW         = '#FFD700';  // pink background:contentReference[oaicite:12]{index=12}

export const BLINKIT_GREEN       = '#0C831F';  // Blinkit brand (green) 
export const BLINKIT_BLACK       = '#1F1F1F';  // Blinkit text (dark)
export const BLINKIT_WHITE       = '#FFFFFF';  // white background

export const FEEDING_CARNATION  = '#EF4F5F';  // Feeding India brand red/pink
export const FEEDING_DARKRED    = '#830B15';  // dark accent red for Feeding India
export const FEEDING_WHITE      = '#F8F8F8';  // light background for Feeding India

// Text Colors
export const TEXT_PRIMARY        = '#2D2D2D';  // main text (dark grey)
export const TEXT_SECONDARY      = '#6F6F6F';  // secondary text (medium grey)
export const TEXT_DISABLED       = '#B0B0B0';  // disabled text (light grey)

// Background & Surface
export const BG_PRIMARY          = '#FFFFFF';  // app background (white)
export const BG_SECONDARY        = '#F4F4F2';  // alternate background (light gray, Zomato Tyrolean)
export const BORDER_LIGHT        = '#E0E0E0';  // light border color

// Button Colors (Light Mode)
export const BUTTON_PRIMARY_BG       = '#FFD700';          // yellow
export const BUTTON_PRIMARY_HOVER    = '#FFC107';          // darker yellow
export const BUTTON_SECONDARY_BG     = '#FFFFFF';          // white
export const BUTTON_SECONDARY_BORDER = '#FFD700';          // yellow border
export const BUTTON_SECONDARY_TEXT   = '#FFD700';          // yellow text

// Status / Semantic Colors:contentReference[oaicite:12]{index=12}
export const INFO       = '#17A2B8';  // informational (blue)
export const SUCCESS    = '#28A745';  // success (green)
export const WARNING    = '#FFC107';  // warning (yellow)
export const ERROR      = '#DC3545';  // error/danger (red)

// Additional UI Colors
export const ICON_DEFAULT  = TEXT_PRIMARY;   // default icon color
export const DIVIDER       = '#E0E0E0';     // divider/line color (light gray)

// Consolidated Colors object for easy component usage
export const Colors = {
  // Primary Brand Colors
  primary: ZOMATO_CRANBERRY,
  primaryDark: BUTTON_PRIMARY_HOVER,
  primaryLight: FEEDING_CARNATION,
  
  // Background Colors
  background: BG_PRIMARY,
  backgroundSecondary: BG_SECONDARY,
  backgroundTertiary: ZOMATO_TYROLEAN,
  
  // Text Colors
  textPrimary: TEXT_PRIMARY,
  textSecondary: TEXT_SECONDARY,
  textMuted: TEXT_DISABLED,
  textInverse: ZOMATO_FETA,
  
  // Status Colors
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
  info: INFO,
  
  // UI Colors
  border: BORDER_LIGHT,
  separator: DIVIDER,
  shadow: 'rgba(45, 45, 45, 0.1)',
  
  // Button Colors
  buttonPrimary: BUTTON_PRIMARY_BG,
  buttonPrimaryPressed: BUTTON_PRIMARY_HOVER,
  buttonSecondary: BUTTON_SECONDARY_BG,
  buttonSecondaryPressed: BG_SECONDARY,
  
  // Navigation
  tabActive: ZOMATO_YELLOW,
  tabInactive: TEXT_DISABLED,
  navigationBackground: BG_PRIMARY,
  
      // Gradients
      gradients: {
        primary: [BUTTON_PRIMARY_BG, BUTTON_PRIMARY_HOVER],
        background: [BG_PRIMARY, BG_SECONDARY],
        success: [SUCCESS, '#1E7E34'],
      },
};
