
    import UserModel from "../Models/userModel";
    import { onbooardingSchema, verifyOtpSchema, userSchema, loginSchema } from "../schemas/onboardingSchema";
    import { generateOTP } from "../utils/otp";
    import { sendPhoneOtp } from "../utils/sms";
    import type { Response, Request } from "express";
    import z from "zod";
    import { generateToken } from "../utils/token";
    import type { User } from "../types/user";
    import bcrypt from "bcrypt";

    async function onboarding(req: Request, res: Response) {
    try {
        const { phone } = onbooardingSchema.parse(req.body);
        // Store phone as 10-digit number like registerUser (e.g., 9876543210)
        const cleanPhone = phone.replace(/\D/g, '').replace(/^91/, ''); // Remove all non-digits and remove 91 prefix
        const user: User | null = await UserModel.findOne({ phone: cleanPhone });
        
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // OTP valid for 15 minutes
        
        // Send OTP first - use clean phone number
        const smsResult = await sendPhoneOtp(cleanPhone, otp);
        
        if (!smsResult) {
            return res.status(400).json({
                success: false,
                message: "Failed to send OTP. Please try again.",
            });
        }

        if (!user) {
            // Create new user with OTP
            const newUser = await UserModel.create({ 
                phone: cleanPhone,
                otp,
                otpExpiry,
                role: 'user'
            });
            
            return res.status(201).json({
                success: true,
                message: "User created successfully. OTP sent to your phone.",
                user: {
                    _id: newUser._id,
                    phone: newUser.phone,
                    isPhoneVerified: newUser.isPhoneVerified
                },
            });
        } else {
            // Update existing user with new OTP
            await UserModel.updateOne(
                { _id: user._id },
                {
                    otp: otp,
                    otpExpiry: otpExpiry,
                }
            );
            
            return res.status(200).json({
                success: true,
                message: "OTP sent successfully to your phone.",
                user: {
                    _id: user._id,
                    phone: user.phone,
                    isPhoneVerified: user.isPhoneVerified
                },
            });
        }
    } catch (error) {
        console.error("Error during onboarding:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: "Invalid input data",
                errors: error.issues.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
    }

    async function verifyOtp(req: Request, res: Response) {
    try {
        const { phone, otp } = verifyOtpSchema.parse(req.body);

        // Store phone as 10-digit number like onboarding (e.g., 9876543210)
        const cleanPhone = phone.replace(/\D/g, '').replace(/^91/, ''); // Remove all non-digits and remove 91 prefix
        const user: User | null = await UserModel.findOne({ phone: cleanPhone });
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: "User not found. Please request OTP first." 
            });
        }

        // Check if OTP exists
        if (!user.otp) {
            return res.status(400).json({ 
                success: false, 
                message: "No OTP found. Please request a new OTP." 
            });
        }

        // Check if OTP is expired
        if (user.otpExpiry && user.otpExpiry < new Date()) {
            return res.status(400).json({ 
                success: false, 
                message: "OTP has expired. Please request a new OTP." 
            });
        }

        // Verify submitted OTP matches stored OTP
        if (user.otp !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: "Incorrect OTP. Please try again." 
            });
        }

        // Clear OTP and mark phone as verified
        await UserModel.updateOne(
            { _id: user._id },
            {
                $unset: { otp: 1, otpExpiry: 1 },
                isPhoneVerified: true
            }
        );

        // Generate JWT token
        const token = generateToken(user._id.toString());

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully. You are now logged in.",
            user: {
                _id: user._id,
                phone: user.phone,
                isPhoneVerified: true,
                role: user.role
            },
            token,
            isProfileComplete: true,
        });

    } catch (error) {
        console.error("Error during OTP verification:", error);
        
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: "Invalid input data",
                errors: error.issues.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }
        
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
    }


    async function getProfile(req: Request, res: Response) {
    try {
        // User is already authenticated by middleware
        const user = (req as any).user;
        
        return res.status(200).json({
            success: true,
            message: "Profile retrieved successfully",
            user: {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                isPhoneVerified: user.isPhoneVerified,
                isEmailVerified: user.isEmailVerified,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Error getting profile:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
    }

    async function registerUser(req: Request, res: Response): Promise<void> {
        try {
            console.log('Register request body:', req.body);
            
            // Validate request body
            if (!req.body || Object.keys(req.body).length === 0) {
                res.status(400).json({ 
                    success: false,
                    message: 'Request body is required' 
                });
                return;
            }
            
            const { name, email, phone, password } = userSchema.parse(req.body);
            console.log('Parsed data:', { name, email, phone });
            
            // Check if user already exists by email (if email provided)
            if (email) {
                const existingUserByEmail = await UserModel.findOne({ email: email.toLowerCase().trim() });
                if (existingUserByEmail) {
                    res.status(400).json({ 
                        success: false,
                        message: 'User with this email already exists' 
                    });
                    return;
                }
            }
            
            // Check if user already exists by phone (if phone provided)
            if (phone) {
                // Store phone as 10-digit number like onboarding (e.g., 9876543210)
                const cleanPhone = phone.replace(/\D/g, '').replace(/^91/, ''); // Remove all non-digits and remove 91 prefix
                const existingUserByPhone = await UserModel.findOne({ phone: cleanPhone });
                if (existingUserByPhone) {
                    res.status(400).json({ 
                        success: false,
                        message: 'User with this phone number already exists' 
                    });
                    return;
                }
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log('Password hashed successfully');
            
            // Create user object
            const userData: any = { 
                name: name.trim(),
                password: hashedPassword,
                role: 'user' // Always default to user role
            };
            
            // Add email if provided
            if (email) {
                userData.email = email.toLowerCase().trim();
                userData.isEmailVerified = true; // Email auth is verified immediately
            }
            
            // Add phone if provided
            if (phone) {
                // Store phone as 10-digit number like onboarding (e.g., 9876543210)
                userData.phone = phone.replace(/\D/g, '').replace(/^91/, ''); // Remove all non-digits and remove 91 prefix
                userData.isPhoneVerified = false; // Phone needs to be verified via OTP later
            }
            
            // Create user
            const user = await UserModel.create(userData);
            console.log('User created:', user._id);
            
            // Generate token
            const token = generateToken(user._id.toString());
            console.log('Token generated');
            
            // Remove sensitive data from response
            const userResponse = user.toObject();
            delete userResponse.password;
            delete userResponse.otp;
            delete userResponse.otpExpiry;
            
            res.status(201).json({ 
                success: true,
                user: userResponse,
                token,
                message: 'Registration successful'
            });
        } catch (error) {
            console.error('Registration error:', error);
            
            // Handle Zod validation errors
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    success: false,
                    message: 'Validation failed', 
                    errors: error.issues.map((err: any) => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
                return;
            }
            
            // Handle MongoDB duplicate key errors
            if (error instanceof Error && error.message.includes('duplicate key')) {
                if (error.message.includes('email')) {
                    res.status(400).json({ 
                        success: false,
                        message: 'User with this email already exists' 
                    });
                } else if (error.message.includes('phone')) {
                    res.status(400).json({ 
                        success: false,
                        message: 'User with this phone number already exists' 
                    });
                } else {
                    res.status(400).json({ 
                        success: false,
                        message: 'User already exists' 
                    });
                }
                return;
            }
            
            // Generic error response
            res.status(500).json({ 
                success: false,
                message: 'Internal server error', 
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

async function loginUser(req: Request, res: Response): Promise<void> {
    try {
        // Validate request body - allow OTP login for phone
        const { email, phone, password, otp } = req.body;
        
        // Validate input - must have either email+password OR phone+password OR phone+otp
        if (!((email && password) || (phone && password) || (phone && otp))) {
            res.status(400).json({ 
                success: false,
                message: 'Invalid login credentials provided' 
            });
            return;
        }
        
        console.log('Login attempt:', { 
            email: email ? 'provided' : 'not provided', 
            phone: phone ? 'provided' : 'not provided',
            method: otp ? 'OTP' : 'password'
        });
        
        let user;
        let loginMethod = '';
        
        // Find user by email or phone
        if (email) {
            user = await UserModel.findOne({ email: email.toLowerCase().trim() }).select('+password');
            loginMethod = 'email';
            console.log('Email login attempt for:', email);
        } else if (phone) {
            // Store phone as 10-digit number like onboarding (e.g., 9876543210)
            const cleanPhone = phone.replace(/\D/g, '').replace(/^91/, ''); // Remove all non-digits and remove 91 prefix
            user = await UserModel.findOne({ phone: cleanPhone }).select('+password');
            loginMethod = 'phone';
            console.log('Phone login attempt for:', phone, '-> clean phone:', cleanPhone);
        }
        
        if (!user) {
            console.log('User not found');
            res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
            return;
        }
        
        // Handle different login methods
        if (otp) {
            // OTP login - first check if user has an OTP, if not generate one
            if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
                // Generate new OTP
                const newOtp = generateOTP();
                const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // OTP valid for 15 minutes
                
                // Update user with new OTP
                await UserModel.updateOne(
                    { _id: user._id },
                    { otp: newOtp, otpExpiry }
                );
                
                // Send OTP via SMS - use the clean phone number from database
                try {
                    const phoneToSend = user.phone; // Use the phone number from database (10-digit format)
                    if (!phoneToSend) {
                        console.log('No phone number found for user');
                        res.status(400).json({ 
                            success: false,
                            message: 'No phone number found for this account' 
                        });
                        return;
                    }
                    await sendPhoneOtp(phoneToSend, newOtp);
                    console.log('New OTP sent for login to:', phoneToSend);
                } catch (smsError) {
                    console.log('Failed to send OTP:', smsError);
                }
                
                res.status(200).json({ 
                    success: true, 
                    message: 'OTP sent to your phone. Please enter the OTP to complete login.',
                    requiresOtp: true 
                });
                return;
            }
            
            // Verify provided OTP
            if (user.otp !== otp) {
                console.log('Invalid OTP for user');
                res.status(401).json({ message: 'Invalid OTP' });
                return;
            }
            
            // Clear OTP and mark phone as verified
            await UserModel.updateOne(
                { _id: user._id },
                {
                    $unset: { otp: 1, otpExpiry: 1 },
                    isPhoneVerified: true
                }
            );
            
            console.log('OTP login successful for:', phone);
        } else if (password) {
            // Password login (email or phone)
            if (!user.password) {
                console.log('No password set for user');
                res.status(400).json({ 
                    success: false,
                    message: 'No password set for this account' 
                });
                return;
            }
            
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                console.log('Invalid password for:', loginMethod);
                res.status(401).json({ 
                    success: false,
                    message: 'Invalid credentials' 
                });
                return;
            }
            
            console.log('Password login successful for:', loginMethod);
        }

        const token = generateToken(user._id.toString());
        
        // Remove sensitive data from response
        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.otp;
        delete userResponse.otpExpiry;
        
        res.status(200).json({ 
            success: true, 
            user: userResponse, 
            token,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        
        // Handle Zod validation errors
        if (error instanceof z.ZodError) {
            res.status(400).json({ 
                success: false,
                message: 'Validation failed', 
                errors: error.issues.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
            return;
        }
        
        // Generic error response
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
}


    export { onboarding, verifyOtp, getProfile, registerUser, loginUser };
