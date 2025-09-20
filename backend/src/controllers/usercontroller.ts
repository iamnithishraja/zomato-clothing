
    import UserModel from "../Models/userModel";
    import { onbooardingSchema, verifyOtpSchema, emailRegisterSchema, emailLoginSchema } from "../schemas/onboardingSchema";
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
        const user: User | null = await UserModel.findOne({ phone: phone });
        
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // OTP valid for 15 minutes
        
        // Send OTP first
        const smsResult = await sendPhoneOtp(phone, otp);
        
        if (!smsResult) {
            return res.status(400).json({
                success: false,
                message: "Failed to send OTP. Please try again.",
            });
        }

        if (!user) {
            // Create new user with OTP
            const newUser = await UserModel.create({ 
                phone,
                otp,
                otpExpiry
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

        const user: User | null = await UserModel.findOne({ phone: phone });
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
                phone: user.phone,
                email: user.email,
                isPhoneVerified: user.isPhoneVerified,
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

    async function emailRegister(req: Request, res: Response) {
        const startTime = Date.now();
        
        try {
            // Validate input using schema with safeParse for better error handling
            const validationResult = emailRegisterSchema.safeParse(req.body);
            
            if (!validationResult.success) {
                const firstError = validationResult.error.issues[0];
                console.log('Registration validation failed:', validationResult.error.issues);
                
                return res.status(400).json({
                    success: false,
                    message: firstError?.message || "Invalid input data",
                    field: firstError?.path.join('.') || 'unknown',
                    errors: validationResult.error.issues.map((err: any) => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }

            const { email, password } = validationResult.data;
            console.log('Email registration attempt for:', email);

            // Check if user already exists with this email
            const existingUser: User | null = await UserModel.findOne({ email });
            console.log('User existence check for email:', email, 'Result:', existingUser ? 'EXISTS' : 'NOT_FOUND');
            
            if (existingUser) {
                console.log('Registration failed - user already exists:', email);
                return res.status(409).json({
                    success: false,
                    message: "An account with this email already exists. Please login instead.",
                });
            }

            // Hash password with higher salt rounds for production
            const saltRounds = process.env.NODE_ENV === 'production' ? 14 : 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Create new user
            const newUser = await UserModel.create({
                email,
                password: hashedPassword,
                isPhoneVerified: false, // Email users don't need phone verification
            });
            console.log('User created successfully:', newUser._id);

            // Generate JWT token
            const token = generateToken(newUser._id.toString());

            // Prepare user response (exclude sensitive data)
            const userResponse = {
                _id: newUser._id,
                email: newUser.email,
                role: newUser.role,
                createdAt: newUser.createdAt
            };

            return res.status(201).json({
                success: true,
                message: "Account created successfully. You are now logged in.",
                user: userResponse,
                token,
            });

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error("Error during email registration:", error);
            
            // Handle MongoDB duplicate key error (backup check)
            if ((error as any).code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: "An account with this email already exists. Please login instead.",
                });
            }
            
            return res.status(500).json({
                success: false,
                message: "Registration failed. Please try again.",
                ...(process.env.NODE_ENV === 'development' && {
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            });
        }
    }

    async function emailLogin(req: Request, res: Response) {
        const startTime = Date.now();
        
        try {
            // Validate input using schema with safeParse for better error handling
            const validationResult = emailLoginSchema.safeParse(req.body);
            
            if (!validationResult.success) {
                const firstError = validationResult.error.issues[0];
                console.log('Login validation failed:', validationResult.error.issues);
                
                return res.status(400).json({
                    success: false,
                    message: firstError?.message || "Invalid input data",
                    field: firstError?.path.join('.') || 'unknown',
                    errors: validationResult.error.issues.map((err: any) => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }

            const { email, password } = validationResult.data;
            console.log('Email login attempt for:', email);

            // Find user by email
            const user: User | null = await UserModel.findOne({ email });

            // Always hash the password even if user doesn't exist (timing attack prevention)
            const dummyHash = '$2a$12$dummy.hash.to.prevent.timing.attacks.against.user.enumeration.attacks';
            const passwordToCompare = user?.password || dummyHash;
            const isPasswordValid = await bcrypt.compare(password, passwordToCompare);

            if (!user || !isPasswordValid) {
                console.log('Login failed for:', email, 'Reason:', !user ? 'USER_NOT_FOUND' : 'INVALID_PASSWORD');
                
                // Generic error message to prevent user enumeration
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // Check if user has a password (in case they registered with phone)
            if (!user.password) {
                console.log('Login failed - no password set for user:', email);
                return res.status(400).json({
                    success: false,
                    message: "No password set for this account. Please use phone login or reset your password.",
                });
            }

            // Generate JWT token
            const token = generateToken(user._id.toString());
            console.log('Login successful for:', email);

            // Prepare user response (exclude sensitive data)
            const userResponse = {
                _id: user._id,
                email: user.email,
                phone: user.phone,
                isPhoneVerified: user.isPhoneVerified,
                role: user.role
            };

            return res.status(200).json({
                success: true,
                message: "Login successful.",
                user: userResponse,
                token,
            });

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error("Error during email login:", error);

            return res.status(500).json({
                success: false,
                message: "Login failed. Please try again.",
                ...(process.env.NODE_ENV === 'development' && {
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            });
        }
    }

    async function getAllUsers(req: Request, res: Response) {
        try {
            const users = await UserModel.find({});
            console.log('Total users in database:', users.length);
            
            // Debug: Check for users with specific email patterns
            const emailUsers = await UserModel.find({ email: { $exists: true, $ne: null } });
            console.log('Users with email field:', emailUsers.length);
            
            // Debug: Check for users with specific email
            const testEmail = 'newuser@example.com';
            const specificUser = await UserModel.findOne({ email: testEmail });
            console.log('Specific user check for', testEmail, ':', specificUser ? 'FOUND' : 'NOT_FOUND');
            
            return res.status(200).json({
                success: true,
                message: "Users retrieved successfully",
                count: users.length,
                emailUsersCount: emailUsers.length,
                specificUserCheck: specificUser ? 'FOUND' : 'NOT_FOUND',
                users: users.map(user => ({
                    id: user._id,
                    email: user.email,
                    phone: user.phone,
                    hasPassword: !!user.password,
                    isPhoneVerified: user.isPhoneVerified
                }))
            });
        } catch (error) {
            console.error("Error getting all users:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
    export { onboarding, verifyOtp, getProfile, emailRegister, emailLogin, getAllUsers,  };
