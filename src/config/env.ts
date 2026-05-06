import dotenvFlow from "dotenv-flow";

dotenvFlow.config();

type NodeEnvironment = "development" | "production" | "test";

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
    nodeEnv
} as const;
