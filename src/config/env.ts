import dotenvFlow from "dotenv-flow";

dotenvFlow.config();

type NodeEnvironment = "development" | "production" | "test";
type MailConfiguration = {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    from?: string;
    frontendUrl?: string;
};

function getRequiredEnvVar(name: "DBHOST" | "TOKEN_SECRET"): string {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`${name} is required but was not provided.`);
    }

    return value;
}

function parsePort(value: string | undefined): number {
    if (!value?.trim()) {
        return 4000;
    }

    const parsedPort = Number.parseInt(value, 10);

    if (Number.isNaN(parsedPort) || parsedPort <= 0) {
        throw new Error("PORT must be a positive integer when provided.");
    }

    return parsedPort;
}

function parseNodeEnv(value: string | undefined): NodeEnvironment {
    if (value === "production" || value === "test") {
        return value;
    }

    return "development";
}

function parseOptionalPort(value: string | undefined): number | undefined {
    if (!value?.trim()) {
        return undefined;
    }

    const parsedPort = Number.parseInt(value, 10);

    if (Number.isNaN(parsedPort) || parsedPort <= 0) {
        throw new Error("SMTP_PORT must be a positive integer when provided.");
    }

    return parsedPort;
}

function parseBoolean(value: string | undefined, envName: string): boolean | undefined {
    if (!value?.trim()) {
        return undefined;
    }

    if (value === "true") {
        return true;
    }

    if (value === "false") {
        return false;
    }

    throw new Error(`${envName} must be true or false when provided.`);
}

function parseOptionalUrl(value: string | undefined, envName: string): string | undefined {
    if (!value?.trim()) {
        return undefined;
    }

    try {
        const parsedUrl = new URL(value.trim());
        return parsedUrl.toString().replace(/\/+$/, "");
    } catch {
        throw new Error(`${envName} must be a valid absolute URL when provided.`);
    }
}

function parseMailConfig(): MailConfiguration {
    return {
        host: process.env.SMTP_HOST?.trim() || undefined,
        port: parseOptionalPort(process.env.SMTP_PORT),
        secure: parseBoolean(process.env.SMTP_SECURE, "SMTP_SECURE"),
        user: process.env.SMTP_USER?.trim() || undefined,
        pass: process.env.SMTP_PASS?.trim() || undefined,
        from: process.env.MAIL_FROM?.trim() || undefined,
        frontendUrl: parseOptionalUrl(process.env.FRONTEND_URL, "FRONTEND_URL")
    };
}

function parseCorsOrigins(value: string | undefined): string[] {
    if (!value?.trim()) {
        console.warn("CORS_ORIGINS is not set. Browser cross-origin requests will be blocked.");
        return [];
    }

    return value
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
}

const nodeEnv = parseNodeEnv(process.env.NODE_ENV);

export const envConfig = {
    dbHost: getRequiredEnvVar("DBHOST"),
    tokenSecret: getRequiredEnvVar("TOKEN_SECRET"),
    port: parsePort(process.env.PORT),
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
    nodeEnv,
    mail: parseMailConfig()
} as const;
