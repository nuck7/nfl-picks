// Deliberately permissive: a local part, an @, and a domain carrying a dot.
// Anything stricter starts rejecting addresses that genuinely exist, and the
// real check is the confirmation email landing anyway.
const EmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email?: string | null) =>
    !!email && EmailPattern.test(email.trim())

export const InvalidEmailMessage = 'Enter a valid email address.'

// For comparing two addresses rather than for storing one. Providers hand back
// whatever casing was typed -- Google in particular preserves it -- so the
// bob@x.com an admin types and the Bob@x.com already on a player document are
// two strings for one mailbox, and a raw === would call them different people.
//
// Deliberately NOT a full canonicalisation. Gmail ignores dots and everything
// after a +, but that is a Gmail rule, not an email one: folding them here
// would declare two genuinely different addresses at every other provider to be
// the same person.
export const normalizeEmail = (email?: string | null) => email?.trim().toLowerCase() ?? ''
