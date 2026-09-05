import React from 'react';

// Inline SVG rather than image files: webpack has no asset loader configured,
// and both brands require their official mark on the sign-in button.
export const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
        <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
        />
        <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
        />
        <path
            fill="#FBBC05"
            d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
        />
        <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
        />
    </svg>
)

export const AppleIcon = () => (
    <svg width="16" height="18" viewBox="0 0 14 17" aria-hidden="true" focusable="false">
        <path
            fill="currentColor"
            d="M11.62 8.96c-.02-1.83 1.5-2.71 1.57-2.75-.85-1.25-2.18-1.42-2.66-1.44-1.13-.11-2.21.67-2.78.67-.57 0-1.46-.65-2.4-.64-1.23.02-2.37.72-3 1.82-1.28 2.22-.33 5.5.92 7.3.61.88 1.34 1.87 2.29 1.83.92-.04 1.27-.59 2.38-.59s1.42.59 2.39.57c.99-.02 1.61-.9 2.21-1.78.7-1.02.99-2.01 1-2.06-.02-.01-1.92-.74-1.94-2.93zM9.83 3.5c.5-.61.84-1.46.75-2.3-.72.03-1.6.48-2.12 1.09-.47.54-.88 1.4-.77 2.23.8.06 1.63-.41 2.14-1.02z"
        />
    </svg>
)
