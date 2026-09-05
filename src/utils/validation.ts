// Deliberately permissive: a local part, an @, and a domain carrying a dot.
// Anything stricter starts rejecting addresses that genuinely exist, and the
// real check is the confirmation email landing anyway.
const EmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email?: string | null) =>
    !!email && EmailPattern.test(email.trim())

export const InvalidEmailMessage = 'Enter a valid email address.'
