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

export const onbooardingSchema = z.object({
    phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
    phone: phoneSchema,
    otp: z.string()
        .length(4, "OTP must be exactly 4 characters long")
        .regex(/^\d{4}$/, "OTP must contain only digits"),
});
