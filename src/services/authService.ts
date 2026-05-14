import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { HydratedDocument } from "mongoose";
import { userModel } from "../models/userModel";
import type { User } from "../interfaces/user";
import { connect } from "../config/db";
import { buildHandleFields, ensureUserHandle, generateAvailableHandle } from "./userHandleService";
import { envConfig } from "../config/env";

function isDuplicateKeyError(error: unknown): error is { code: number; keyPattern?: Record<string, number> } {
    return typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;
}

export type RegisterUserInput = Pick<User, "name" | "email" | "password" | "bio" | "isProfilePublic"> & {
    handle?: string;
};

export type RegisterUserResult =
    | { kind: "success"; user: HydratedDocument<User> }
    | { kind: "duplicate_email" }
    | { kind: "duplicate_handle" }
    | { kind: "handle_generation_failed" };

export interface LoginUserResultSuccess {
    kind: "success";
    token: string;
    userId: string;
    user: HydratedDocument<User>;
}

export type LoginUserResult =
    | LoginUserResultSuccess
    | { kind: "invalid_credentials" };

export async function registerUserAccount(input: RegisterUserInput): Promise<RegisterUserResult> {
    await connect();

    const emailExist = await userModel.findOne({ email: input.email });

    if (emailExist) {
        return { kind: "duplicate_email" };
    }

    const requestedHandle = typeof input.handle === "string" ? input.handle.trim() : undefined;

    if (requestedHandle) {
        const handleExists = await userModel.findOne({ handleLower: requestedHandle.toLowerCase() });

        if (handleExists) {
            return { kind: "duplicate_handle" };
        }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHashed = await bcrypt.hash(input.password, salt);

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const handleFields = requestedHandle
            ? buildHandleFields(requestedHandle)
            : await generateAvailableHandle({
                name: input.name,
                email: input.email
            });

        const userObject = new userModel({
            name: input.name,
            email: input.email,
            password: passwordHashed,
            handle: handleFields.handle,
            handleLower: handleFields.handleLower,
            bio: input.bio,
            isProfilePublic: input.isProfilePublic,
            role: "user"
        });

        try {
            const savedUser = await userObject.save();

            return {
                kind: "success",
                user: savedUser
            };
        } catch (error) {
            if (!isDuplicateKeyError(error)) {
                throw error;
            }

            if (error.keyPattern?.email) {
                return { kind: "duplicate_email" };
            }

            if (error.keyPattern?.handleLower) {
                if (requestedHandle) {
                    return { kind: "duplicate_handle" };
                }

                continue;
            }

            throw error;
        }
    }

    return { kind: "handle_generation_failed" };
}

export async function loginUserAccount(email: string, password: string): Promise<LoginUserResult> {
    await connect();

    const user = await userModel.findOne({ email });

    if (!user) {
        return { kind: "invalid_credentials" };
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
        return { kind: "invalid_credentials" };
    }

    const userWithHandle = await ensureUserHandle(user);
    const userId = userWithHandle._id.toString();
    const token = jwt.sign(
        {
            userId,
            name: userWithHandle.name,
            email: userWithHandle.email,
            role: userWithHandle.role
        },
        envConfig.tokenSecret,
        { expiresIn: "2h" }
    );

    return {
        kind: "success",
        token,
        userId,
        user: userWithHandle
    };
}
