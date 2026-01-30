import type { Id } from "../../convex/_generated/dataModel";

// Simple local storage auth wrapper
const STORAGE_KEY = "yql_auth_user";

export interface AuthUser {
    _id: Id<"users">;
    name: string;
    email: string;
    role: string;
}

export const getAuthUser = (): AuthUser | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
};

export const setAuthUser = (user: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const clearAuthUser = () => {
    localStorage.removeItem(STORAGE_KEY);
};
