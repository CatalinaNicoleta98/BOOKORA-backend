import {
    type Request,
    type Response,
} from "express";
import Joi, { ValidationResult } from "joi";

// Project imports
import { User } from "../interfaces/user";
import { validateReservedHandle } from "../services/userHandleService";
import { toSafeUserResponse } from "../services/userResponseService";
import { loginUserAccount, registerUserAccount } from "../services/authService";

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

        const result = await registerUserAccount(req.body);

        if (result.kind === "duplicate_email") {
            res.status(409).json({ error: "Email is already registered" });
            return;
        }

        if (result.kind === "duplicate_handle") {
            res.status(409).json({ error: "Handle is already taken" });
            return;
        }

        if (result.kind === "handle_generation_failed") {
            res.status(500).json({ error: "Could not generate a unique handle" });
            return;
        }

        res.status(201).json({
            error: null,
            data: {
                id: result.user._id,
                message: "User registered successfully",
                user: toSafeUserResponse(result.user)
            }
        });
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

        const result = await loginUserAccount(req.body.email, req.body.password);

        if (result.kind === "invalid_credentials") {
            res.status(401).json({ error: "Email or password is incorrect" });
            return;
        }

        res.status(200)
            .header("auth-token", result.token)
            .json({
                error: null,
                data: {
                    userId: result.userId,
                    token: result.token,
                    user: toSafeUserResponse(result.user)
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
