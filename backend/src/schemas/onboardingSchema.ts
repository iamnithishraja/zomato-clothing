import z from "zod";

// Phone number validation with proper formatting
const phoneSchema = z.string()
    .min(10, "Phone number must be at least 10 characters long")
    .max(15, "Phone number must be at most 15 characters long")
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format")
    .transform((phone) => {
        // Clean phone number - remove all non-digit characters except +
        const cleaned = phone.replace(/[^\d+]/g, '');
        // If it starts with +, keep it, otherwise add +91 for Indian numbers
        return cleaned.startsWith('+') ? cleaned : `+91${cleaned}`;
    });

// Email validation
const emailSchema = z.string()
    .min(1, "Email is required")
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address")
    .max(320, "Email is too long"); // RFC 5321 limit

// Password validation for registration
const passwordRegisterSchema = z.string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password is too long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    });

// Password validation for login (less strict)
const passwordLoginSchema = z.string()
    .min(1, "Password is required")
    .max(128, "Password is too long");

export const onbooardingSchema = z.object({
    phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
    phone: phoneSchema,
    otp: z.string()
        .length(4, "OTP must be exactly 4 characters long")
        .regex(/^\d{4}$/, "OTP must contain only digits"),
});

// Email/Password registration schema
export const emailRegisterSchema = z.object({
    email: emailSchema,
    password: passwordRegisterSchema,
});

// Email/Password login schema
export const emailLoginSchema = z.object({
    email: emailSchema,
    password: passwordLoginSchema,
});
