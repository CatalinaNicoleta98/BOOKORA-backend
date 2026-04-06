

import fs from "fs";
import path from "path";
import multer from "multer";
import { Request } from "express";

const uploadsRootDirectory = path.join(process.cwd(), "uploads");
const profileUploadsDirectory = path.join(uploadsRootDirectory, "profiles");

const ensureDirectoryExists = (directoryPath: string): void => {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
    }
};

ensureDirectoryExists(profileUploadsDirectory);

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, profileUploadsDirectory);
    },
    filename: (_req, file, callback) => {
        const fileExtension = path.extname(file.originalname);
        const sanitizedBaseName = path
            .basename(file.originalname, fileExtension)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 1e9);
        const safeBaseName = sanitizedBaseName || "image";

        callback(null, `${safeBaseName}-${timestamp}-${randomSuffix}${fileExtension}`);
    }
});

const fileFilter: multer.Options["fileFilter"] = (_req: Request, file, callback) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        callback(new Error("Only JPEG, PNG, and WEBP image uploads are allowed."));
        return;
    }

    callback(null, true);
};

export const profileImageUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});