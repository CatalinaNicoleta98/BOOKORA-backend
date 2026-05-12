import {
    type Request,
    type Response,
} from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Joi, { ValidationResult } from "joi";

// Project imports
import { userModel } from "../models/userModel";
import { User } from "../interfaces/user";
import { connect } from "../config/db";
import { buildHandleFields, ensureUserHandle, generateAvailableHandle, validateReservedHandle } from "../services/userHandleService";
import { toSafeUserResponse } from "../services/userResponseService";
import { envConfig } from "../config/env";
import {
    createPasswordResetToken,
    getPasswordResetExpiryMinutes,
    resetPasswordWithToken
} from "../services/passwordResetService";
import { sendPasswordResetEmail } from "../services/mailService";

const FORGOT_PASSWORD_RESPONSE = {
    error: null,
    data: {
        message: "If an account matches that email, a password reset link has been sent."
    }
} as const;

function getPasswordValidationRule(): Joi.StringSchema<string> {
    return Joi.string().min(6).max(20).required();
}

function buildPasswordResetUrl(token: string): string {
    const frontendUrl = envConfig.mail.frontendUrl;

    if (!frontendUrl) {
        throw new Error("FRONTEND_URL is required for password reset.");
    }

    return `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isDuplicateKeyError(error: unknown): error is { code: number; keyPattern?: Record<string, number> } {
    return typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;
}

// Register a new user
export async function registerUser(req: Request, res: Response) {
    try {
        // Validate the user registration data
        const { error } = validateUserRegistration(req.body);

        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }

        await connect();

        // Check if the email is already registered
        const emailExist = await userModel.findOne({ email: req.body.email });

        if (emailExist) {
            res.status(400).json({ error: "Email is already registered" });
            return;
        }

        const requestedHandle = typeof req.body.handle === "string" ? req.body.handle.trim() : undefined;

        if (requestedHandle) {
            const handleExists = await userModel.findOne({ handleLower: requestedHandle.toLowerCase() });

            if (handleExists) {
                res.status(400).json({ error: "Handle is already taken" });
                return;
            }
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHashed = await bcrypt.hash(req.body.password, salt);

        for (let attempt = 0; attempt < 3; attempt += 1) {
            const handleFields = requestedHandle
                ? buildHandleFields(requestedHandle)
                : await generateAvailableHandle({
                    name: req.body.name,
                    email: req.body.email
                });

            // Create user object and save to database
            const userObject = new userModel({
                name: req.body.name,
                email: req.body.email,
                password: passwordHashed,
                handle: handleFields.handle,
                handleLower: handleFields.handleLower,
                bio: req.body.bio,
                isProfilePublic: req.body.isProfilePublic,
                role: "user"
            });

            try {
                const savedUser = await userObject.save();

                res.status(201).json({
                    error: null,
                    data: {
                        id: savedUser._id,
                        message: "User registered successfully",
                        user: toSafeUserResponse(savedUser)
                    }
                });
                return;
            } catch (error) {
                if (!isDuplicateKeyError(error)) {
                    throw error;
                }

                if (error.keyPattern?.email) {
                    res.status(400).json({ error: "Email is already registered" });
                    return;
                }

                if (error.keyPattern?.handleLower) {
                    if (requestedHandle) {
                        res.status(400).json({ error: "Handle is already taken" });
                        return;
                    }

                    continue;
                }

                throw error;
            }
        }

        res.status(500).json({ error: "Could not generate a unique handle" });
        return;

    } catch (error) {
        res.status(500).send("Error registering user. Error: " + error);
    }
}


// Login user
export async function loginUser(req: Request, res: Response) {
    try {
        // Validate login data
        const { error } = validateUserLogin(req.body);

        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }

        await connect();

        // Check if user exists
        const user = await userModel.findOne({ email: req.body.email });

        if (!user) {
            res.status(400).json({ error: "Email or password is incorrect" });
            return;
        }

        // Check password
        const validPassword: boolean = await bcrypt.compare(req.body.password, user.password);

        if (!validPassword) {
            res.status(400).json({ error: "Email or password is incorrect" });
            return;
        }

        const userWithHandle = await ensureUserHandle(user);
        const userId: string = userWithHandle._id.toString();

        // Create and assign token
        const token: string = jwt.sign(
            {
                userId,
                name: userWithHandle.name,
                email: userWithHandle.email,
                role: userWithHandle.role
            },
            envConfig.tokenSecret,
            { expiresIn: "2h" }
        );

        res.status(200)
            .header("auth-token", token)
            .json({
                error: null,
                data: {
                    userId,
                    token,
                    user: toSafeUserResponse(userWithHandle)
                }
            });

    } catch (error) {
        res.status(500).send("Error logging in user. Error: " + error);
    }
}

export async function forgotPassword(req: Request, res: Response) {
    try {
        const { error } = validateForgotPasswordRequest(req.body);

        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }

        await connect();

        const normalizedEmail = req.body.email.trim();
        const user = await userModel.findOne({
            email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i")
        });

        if (!user) {
            res.status(200).json(FORGOT_PASSWORD_RESPONSE);
            return;
        }

        const { token } = await createPasswordResetToken(user._id.toString());
        const resetUrl = buildPasswordResetUrl(token);

        await sendPasswordResetEmail({
            email: user.email,
            name: user.name,
            resetUrl,
            expiresInMinutes: getPasswordResetExpiryMinutes()
        });

        res.status(200).json(FORGOT_PASSWORD_RESPONSE);
    } catch (error) {
        res.status(500).json({
            error: "PASSWORD_RESET_REQUEST_FAILED",
            message: error instanceof Error ? error.message : "Failed to process password reset request."
        });
    }
}

export async function resetPassword(req: Request, res: Response) {
    try {
        const { error } = validateResetPasswordRequest(req.body);

        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }

        await connect();

        const resetSucceeded = await resetPasswordWithToken(req.body.token.trim(), req.body.password);

        if (!resetSucceeded) {
            res.status(400).json({
                error: "Reset token is invalid or has expired."
            });
            return;
        }

        res.status(200).json({
            error: null,
            data: {
                message: "Password reset successful."
            }
        });
    } catch (error) {
        res.status(500).json({
            error: "PASSWORD_RESET_FAILED",
            message: error instanceof Error ? error.message : "Failed to reset password."
        });
    }
}


// Validate user registration data
export function validateUserRegistration(data: User): ValidationResult {
    const schema = Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().min(6).max(255).required(),
        password: getPasswordValidationRule(),
        handle: Joi.string()
            .trim()
            .pattern(/^[A-Za-z0-9_]{3,30}$/)
            .custom(validateReservedHandle)
            .messages({
                "string.pattern.base": "Handle must be 3-30 characters and use only letters, numbers, or underscores",
                "any.invalid": "Handle is reserved"
            })
            .optional(),
        avatarUrl: Joi.string().allow("", null),
        coverImageUrl: Joi.string().allow("", null),
        bio: Joi.string().max(500).allow("", null),
        isProfilePublic: Joi.boolean()
    });

    return schema.validate(data);
}


// Validate user login data
export function validateUserLogin(data: User): ValidationResult {
    const schema = Joi.object({
        email: Joi.string().email().min(6).max(255).required(),
        password: getPasswordValidationRule()
    });

    return schema.validate(data);
}

export function validateForgotPasswordRequest(data: { email?: string }): ValidationResult {
    const schema = Joi.object({
        email: Joi.string().email().min(6).max(255).required()
    });

    return schema.validate(data);
}

export function validateResetPasswordRequest(data: { token?: string; password?: string }): ValidationResult {
    const schema = Joi.object({
        token: Joi.string().trim().min(32).required(),
        password: getPasswordValidationRule()
    });

    return schema.validate(data);
}
