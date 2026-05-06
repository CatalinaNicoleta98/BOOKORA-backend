import type { CustomHelpers } from "joi";
import type { HydratedDocument } from "mongoose";
import { userModel } from "../models/userModel";
import type { User } from "../interfaces/user";

const HANDLE_MIN_LENGTH = 3;
const HANDLE_MAX_LENGTH = 30;
const HANDLE_SUFFIX_LENGTH = 6;
const GENERATED_HANDLE_BASE_MAX_LENGTH = HANDLE_MAX_LENGTH - HANDLE_SUFFIX_LENGTH - 1;
const HANDLE_PATTERN = /^[A-Za-z0-9_]{3,30}$/;
const FALLBACK_HANDLE_BASE = "reader";

const RESERVED_HANDLES = new Set([
  "profile",
  "login",
  "register",
  "search",
  "library",
  "books",
  "readers",
  "admin",
  "api",
  "settings"
]);

export interface HandleFields {
  handle: string;
  handleLower: string;
}

interface HandleGenerationInput {
  handle?: string;
  name?: string;
  email?: string;
}

export function isReservedHandle(handle: string): boolean {
  return RESERVED_HANDLES.has(handle.toLowerCase());
}

export function isValidHandleFormat(handle: string): boolean {
  return HANDLE_PATTERN.test(handle);
}

export function normalizeHandleCandidate(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function buildHandleFields(handle: string): HandleFields {
  return {
    handle,
    handleLower: handle.toLowerCase()
  };
}

function getEmailPrefix(email?: string): string {
  if (!email) {
    return "";
  }

  const [prefix = ""] = email.split("@");
  return prefix;
}

function buildGeneratedHandleBase(input: HandleGenerationInput): string {
  const baseCandidate = input.handle ?? input.name ?? getEmailPrefix(input.email);
  const normalizedBase = normalizeHandleCandidate(baseCandidate ?? "");

  if (!normalizedBase) {
    return FALLBACK_HANDLE_BASE;
  }

  if (normalizedBase.length >= HANDLE_MIN_LENGTH) {
    return normalizedBase.slice(0, GENERATED_HANDLE_BASE_MAX_LENGTH);
  }

  const emailPrefix = normalizeHandleCandidate(getEmailPrefix(input.email));
  const extendedBase = `${normalizedBase}${emailPrefix}`;

  if (extendedBase.length >= HANDLE_MIN_LENGTH) {
    return extendedBase.slice(0, GENERATED_HANDLE_BASE_MAX_LENGTH);
  }

  return `${FALLBACK_HANDLE_BASE}${normalizedBase}`.slice(0, GENERATED_HANDLE_BASE_MAX_LENGTH);
}

function generateRandomSuffix(): string {
  return Math.random().toString(36).slice(2, 2 + HANDLE_SUFFIX_LENGTH);
}

async function handleExists(handleLower: string, excludeUserId?: string): Promise<boolean> {
  const existingUser = await userModel.findOne({ handleLower }).select("_id");

  if (!existingUser) {
    return false;
  }

  if (!excludeUserId) {
    return true;
  }

  return existingUser._id.toString() !== excludeUserId;
}

export async function generateAvailableHandle(
  input: HandleGenerationInput,
  excludeUserId?: string
): Promise<HandleFields> {
  const baseHandle = buildGeneratedHandleBase(input);
  const initialHandle = baseHandle.slice(0, HANDLE_MAX_LENGTH);
  const initialHandleLower = initialHandle.toLowerCase();

  if (!isReservedHandle(initialHandle) && !(await handleExists(initialHandleLower, excludeUserId))) {
    return buildHandleFields(initialHandle);
  }

  const suffixBase = baseHandle.slice(0, GENERATED_HANDLE_BASE_MAX_LENGTH) || FALLBACK_HANDLE_BASE;

  while (true) {
    const handleWithSuffix = `${suffixBase}_${generateRandomSuffix()}`.slice(0, HANDLE_MAX_LENGTH);
    const handleLower = handleWithSuffix.toLowerCase();

    if (isReservedHandle(handleWithSuffix)) {
      continue;
    }

    if (!(await handleExists(handleLower, excludeUserId))) {
      return {
        handle: handleWithSuffix,
        handleLower
      };
    }
  }
}

export async function ensureUserHandle(user: HydratedDocument<User>): Promise<HydratedDocument<User>> {
  const currentHandle = user.handle;
  const currentHandleLower = user.handleLower;

  if (
    currentHandle &&
    currentHandleLower &&
    currentHandleLower === currentHandle.toLowerCase() &&
    isValidHandleFormat(currentHandle) &&
    !isReservedHandle(currentHandle) &&
    !(await handleExists(currentHandleLower, user._id.toString()))
  ) {
    return user;
  }

  const nextHandleFields = await generateAvailableHandle(
    {
      handle: currentHandle,
      name: user.name,
      email: user.email
    },
    user._id.toString()
  );

  user.handle = nextHandleFields.handle;
  user.handleLower = nextHandleFields.handleLower;
  await user.save();

  return user;
}

export function validateReservedHandle(value: string, helpers: CustomHelpers): string | Error {
  if (isReservedHandle(value)) {
    return helpers.error("any.invalid");
  }

  return value;
}
