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

function isDuplicateKeyError(error: unknown): error is { code: number; keyPattern?: Record<string, number> } {
    return typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;
}

function logAuthError(context: "registerUser" | "loginUser", error: unknown) {
    console.error(`[authController] ${context} failed`, error);
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
            res.status(409).json({ error: "Email is already registered" });
            return;
        }

        const requestedHandle = typeof req.body.handle === "string" ? req.body.handle.trim() : undefined;

        if (requestedHandle) {
            const handleExists = await userModel.findOne({ handleLower: requestedHandle.toLowerCase() });

            if (handleExists) {
                res.status(409).json({ error: "Handle is already taken" });
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
                    res.status(409).json({ error: "Email is already registered" });
                    return;
                }

                if (error.keyPattern?.handleLower) {
                    if (requestedHandle) {
                        res.status(409).json({ error: "Handle is already taken" });
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
        logAuthError("registerUser", error);
        res.status(500).json({ error: "Error registering user." });
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
            res.status(401).json({ error: "Email or password is incorrect" });
            return;
        }

        // Check password
        const validPassword: boolean = await bcrypt.compare(req.body.password, user.password);

        if (!validPassword) {
            res.status(401).json({ error: "Email or password is incorrect" });
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
        logAuthError("loginUser", error);
        res.status(500).json({ error: "Error logging in user." });
    }
}


// Validate user registration data
export function validateUserRegistration(data: User): ValidationResult {
    const schema = Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().min(6).max(255).required(),
        password: Joi.string().min(6).max(20).required(),
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
        password: Joi.string().min(6).max(20).required()
    });

    return schema.validate(data);
}
