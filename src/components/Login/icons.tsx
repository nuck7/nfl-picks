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

// The X mark. Firebase still calls the provider "twitter.com"; the brand does
// not.
export const XIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
            fill="currentColor"
            d="M18.9 2.25h3.32l-7.25 8.29 8.53 11.21h-6.68l-5.23-6.84-5.99 6.84H2.28l7.76-8.87L1.86 2.25h6.85l4.73 6.25 5.46-6.25zm-1.17 17.52h1.84L7.02 4.13H5.05l12.68 15.64z"
        />
    </svg>
)

