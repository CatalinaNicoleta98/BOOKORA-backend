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

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHashed = await bcrypt.hash(req.body.password, salt);

        // Create user object and save to database
        const userObject = new userModel({
            name: req.body.name,
            email: req.body.email,
            password: passwordHashed,
            profilePicture: req.body.profilePicture,
            bio: req.body.bio,
            isProfilePublic: req.body.isProfilePublic,
            role: "user"
        });

        const savedUser = await userObject.save();

        res.status(201).json({
            error: null,
            data: {
                id: savedUser._id,
                message: "User registered successfully"
            }
        });

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
        const user: User | null = await userModel.findOne({ email: req.body.email });

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

        const jwtSecret = process.env.TOKEN_SECRET;

        if (!jwtSecret) {
            res.status(500).json({ error: "TOKEN_SECRET is not defined" });
            return;
        }

        const userId: string = user._id;

        // Create and assign token
        const token: string = jwt.sign(
            {
                userId,
                name: user.name,
                email: user.email,
                role: user.role
            },
            jwtSecret,
            { expiresIn: "2h" }
        );

        res.status(200)
            .header("auth-token", token)
            .json({
                error: null,
                data: {
                    userId,
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        profilePicture: user.profilePicture,
                        bio: user.bio,
                        isProfilePublic: user.isProfilePublic,
                        role: user.role
                    }
                }
            });

    } catch (error) {
        res.status(500).send("Error logging in user. Error: " + error);
    }
}

// Get current authenticated user
export async function getCurrentUser(req: Request, res: Response) {
    try {
        await connect();

        const userId = (req as any).userId;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const user = await userModel.findById(userId);

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.status(200).json({
            error: null,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    profilePicture: user.profilePicture,
                    bio: user.bio,
                    isProfilePublic: user.isProfilePublic,
                    role: user.role
                }
            }
        });
    } catch (error) {
        res.status(500).send("Error fetching current user. Error: " + error);
    }
}

// Update current authenticated user profile
export async function updateUserProfile(req: Request, res: Response) {
    try {
        await connect();

        const userId = (req as any).userId;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const {
            avatarUrl,
            coverImageUrl,
            bio,
            name
        } = req.body;

        const updatePayload: Partial<User> = {};

        if (typeof avatarUrl === "string") {
            updatePayload.avatarUrl = avatarUrl.trim();
        }

        if (typeof coverImageUrl === "string") {
            updatePayload.coverImageUrl = coverImageUrl.trim();
        }

        if (typeof bio === "string") {
            updatePayload.bio = bio.trim();
        }

        if (typeof name === "string" && name.trim().length >= 2) {
            updatePayload.name = name.trim();
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updatePayload },
            { new: true }
        );

        if (!updatedUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.status(200).json({
            error: null,
            data: {
                user: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    avatarUrl: updatedUser.avatarUrl,
                    coverImageUrl: updatedUser.coverImageUrl,
                    profilePicture: updatedUser.profilePicture,
                    bio: updatedUser.bio,
                    isProfilePublic: updatedUser.isProfilePublic,
                    role: updatedUser.role
                }
            }
        });

    } catch (error) {
        res.status(500).send("Error updating user profile. Error: " + error);
    }
}


// Validate user registration data
export function validateUserRegistration(data: User): ValidationResult {
    const schema = Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().min(6).max(255).required(),
        password: Joi.string().min(6).max(20).required(),
        profilePicture: Joi.string().allow("", null),
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