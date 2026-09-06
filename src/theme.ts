import { css } from 'styled-components'

// The design system, in full. Plain exported consts -- deliberately NOT a
// styled-components ThemeProvider: <Grommet> already publishes the grommet
// theme into styled-components' ThemeContext (grommet re-exports that context
// directly), so a nested ThemeProvider would replace props.theme for every
// grommet internal and crash the app. src/grommetTheme.ts derives the grommet
// object from these values instead, so there is one source and one direction.

/* -------------------------------------------------------------- colour -- */
export const color = {
    // Ground / surface. Warm at very low chroma. Nothing in this system casts a
    // shadow, so a ground that isn't white is the only thing making a white
    // card read as raised; a neutral grey at the same lightness reads as
    // "disabled" instead. Warm enough to be paper, neutral enough that 32
    // saturated team logos don't pick up a cast.
    ground: '#F7F6F3',
    surface: '#FFFFFF',
    surfaceSunken: '#F2F0EC',
    surfaceHover: '#F4F2EE',

    // Hairlines carry all the depth in this system.
    border: '#E9E7E2',
    borderStrong: '#D9D6CF',

    ink: '#1A1816',        // 16.5:1 on surface
    inkHover: '#332F2B',   // primary button hover
    inkMuted: '#6B6763',   //  5.6:1 -- the safe muted-body colour
    inkFaint: '#8F8B86',   //  3.4:1 -- FAILS AA for body. >=19px or decorative only
    inkInverse: '#FAF9F7',

    // The nav bar is the one dark surface in this system, so it needs on-dark
    // partners for the roles above. inkInverse is its full-strength text;
    // inkInverseMuted is the resting state for a nav link, at 7.1:1 on ink --
    // the on-dark counterpart to inkMuted. The two washes are what hover and the
    // current page sit on; they are alpha rather than solid so the bar keeps one
    // background colour and nothing has to be re-derived if ink ever moves.
    inkInverseMuted: '#A8A39D',
    surfaceInverseHover: 'rgba(250, 249, 247, 0.10)',
    surfaceInverseActive: 'rgba(250, 249, 247, 0.16)',

    // Team logos carry the colour in this app, so accents are rationed:
    // focus rings, text links, destructive copy.
    accent: '#062F4F',
    negative: '#B82601',
    negativeSurface: '#FCF2F0',
    positive: '#1F7A4D',
} as const

/* ---------------------------------------------------------------- type -- */
export const font = {
    family: "'Inter Variable', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    // 400 and 500 only. There is no bold in this system, and GlobalStyle sets
    // font-synthesis-weight: none so the browser can never fake a third.
    regular: 400,
    medium: 500,
} as const

// Tracking tightens as size grows; leading loosens as size shrinks. The two
// display steps clamp, which is why no heading needs a media query.
export const type = {
    display: { size: 'clamp(34px, 6vw, 46px)', weight: font.medium, tracking: '-0.035em', leading: '1.06' },
    title: { size: 'clamp(28px, 4.2vw, 34px)', weight: font.medium, tracking: '-0.03em', leading: '1.12' },
    section: { size: 'clamp(21px, 2.6vw, 24px)', weight: font.medium, tracking: '-0.02em', leading: '1.2' },
    subsection: { size: '19px', weight: font.medium, tracking: '-0.015em', leading: '1.3' },
    lead: { size: '17px', weight: font.regular, tracking: '-0.011em', leading: '1.55' },
    body: { size: '16px', weight: font.regular, tracking: '-0.006em', leading: '1.55' },
    // 17px, not 16: iOS Safari auto-zooms on focus for any input under 16px.
    input: { size: '17px', weight: font.regular, tracking: '-0.008em', leading: '1.4' },
    label: { size: '14px', weight: font.medium, tracking: '-0.004em', leading: '1.3' },
    meta: { size: '14px', weight: font.regular, tracking: '0', leading: '1.45' },
    caption: { size: '13px', weight: font.regular, tracking: '0.004em', leading: '1.4' },
} as const

// One line per type step at the call site.
export const typeStyle = (step: keyof typeof type) => css`
    font-size: ${type[step].size};
    font-weight: ${type[step].weight};
    letter-spacing: ${type[step].tracking};
    line-height: ${type[step].leading};
`

/* ------------------------------------------------------------- spacing -- */
// Numeric keys on a 4px base. Deliberately not xxsmall..xxlarge: that naming is
// what produced a scale where only two of seven steps were ever used.
export const space = {
    0: '0px', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px',
    6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px', 20: '80px', 24: '96px',
} as const

/* -------------------------------------------------- radii and hairlines -- */
export const radius = {
    sm: '8px', md: '12px', lg: '16px', xl: '20px', xxl: '28px',
    pill: '999px', circle: '50%',
} as const

export const border = {
    hairline: `1px solid ${color.border}`,
    hairlineStrong: `1px solid ${color.borderStrong}`,
} as const

/* --------------------------------------------------------- breakpoints -- */
// mobile: 768px is preserved verbatim -- existing @media rules depend on it.
export const breakpoint = { sm: '480px', mobile: '768px', lg: '1040px' } as const

export const media = {
    upToMobile: '@media (max-width: 767.98px)',
    fromMobile: '@media (min-width: 768px)',
    fromLarge: '@media (min-width: 1040px)',
} as const

/* -------------------------------------------------------------- layout -- */
export const layout = {
    maxWidth: '1100px',   // wide pages: standings table, schedule
    readWidth: '620px',   // prose: admin intro, profile
    formWidth: '400px',   // login
    navHeight: '60px',
    gutter: '24px',
    gutterMobile: '16px',
    drawerWidth: '272px',
} as const

/* -------------------------------------------------------------- motion -- */
export const motion = {
    fast: '120ms', base: '180ms', slow: '260ms',
    ease: 'cubic-bezier(0.2, 0, 0, 1)',
} as const
