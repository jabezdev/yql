/**
 * Data Validation Helpers
 * 
 * Centralized validation functions for common data types used
 * throughout the HR Core System.
 */

// ============================================
// EMAIL VALIDATION
// ============================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email);
}

export function validateEmail(email: string): void {
    if (!isValidEmail(email)) {
        throw new Error(`Invalid email format: ${email}`);
    }
}

// ============================================
// SLUG VALIDATION
// ============================================

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
    return SLUG_REGEX.test(slug) && slug.length >= 2 && slug.length <= 50;
}

export function validateSlug(slug: string): void {
    if (!isValidSlug(slug)) {
        throw new Error(
            `Invalid slug format: ${slug}. Use lowercase letters, numbers, and hyphens only.`
        );
    }
}

/**
 * Generates a slug from a string
 */
export function generateSlug(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/-+/g, '-')      // Remove consecutive hyphens
        .substring(0, 50);        // Limit length
}

// ============================================
// DATE VALIDATION
// ============================================

export function isValidTimestamp(timestamp: number): boolean {
    // Check if it's a reasonable timestamp (between 2020 and 2100)
    const minTimestamp = new Date('2020-01-01').getTime();
    const maxTimestamp = new Date('2100-01-01').getTime();
    return timestamp >= minTimestamp && timestamp <= maxTimestamp;
}

export function validateDateRange(startDate: number, endDate?: number): void {
    if (!isValidTimestamp(startDate)) {
        throw new Error('Invalid start date');
    }
    if (endDate !== undefined) {
        if (!isValidTimestamp(endDate)) {
            throw new Error('Invalid end date');
        }
        if (endDate < startDate) {
            throw new Error('End date cannot be before start date');
        }
    }
}

// ============================================
// STRING VALIDATION
// ============================================

export function isNonEmptyString(value: string): boolean {
    return typeof value === 'string' && value.trim().length > 0;
}

export function validateNonEmptyString(value: string, fieldName: string): void {
    if (!isNonEmptyString(value)) {
        throw new Error(`${fieldName} cannot be empty`);
    }
}

export function validateStringLength(
    value: string,
    fieldName: string,
    minLength: number,
    maxLength: number
): void {
    if (value.length < minLength || value.length > maxLength) {
        throw new Error(
            `${fieldName} must be between ${minLength} and ${maxLength} characters`
        );
    }
}

// ============================================
// CLEARANCE LEVEL VALIDATION  
// ============================================

export function isValidClearanceLevel(level: number): boolean {
    return Number.isInteger(level) && level >= 0 && level <= 5;
}

export function validateClearanceLevel(level: number): void {
    if (!isValidClearanceLevel(level)) {
        throw new Error('Clearance level must be an integer between 0 and 5');
    }
}

// ============================================
// SANITIZATION HELPERS
// ============================================

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}

/**
 * Normalize email to lowercase
 */
export function normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
}
