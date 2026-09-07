import { css } from 'styled-components'

// The design system, in full. Plain exported consts -- deliberately NOT a
// styled-components ThemeProvider: <Grommet> already publishes the grommet
// theme into styled-components' ThemeContext (grommet re-exports that context
// directly), so a nested ThemeProvider would replace props.theme for every
// grommet internal and crash the app. src/grommetTheme.ts derives the grommet
// object from these values instead, so there is one source and one direction.

/* -------------------------------------------------------------- colour -- */
// Two palettes, one set of token names. Nothing imports these directly except
// GlobalStyle, which writes them out as CSS custom properties for both schemes;
// everything else uses `color` below, whose values are var() references. That
// is what lets a theme switch be an attribute flip on <html> rather than a
// re-render -- the 17 style files that import `color` never learn there are two
// palettes at all.
export const lightPalette = {
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
    inkHover: '#332F2B',
    inkMuted: '#6B6763',   //  5.6:1 -- the safe muted-body colour
    inkFaint: '#8F8B86',   //  3.4:1 -- FAILS AA for body. >=19px or decorative only

    // The nav bar and the mobile drawer are the one dark surface in this
    // system, and they stay dark in BOTH schemes -- which is why `chrome` is
    // its own token rather than reusing `ink`. Sharing them was fine while
    // there was one palette; in dark mode `ink` becomes near-white and the nav
    // bar would have inverted into a white slab.
    chrome: '#1A1816',
    // On-chrome partners. inkInverse is full-strength text there,
    // inkInverseMuted the resting state for a nav link (7.1:1 on chrome). The
    // two washes are what hover and the current page sit on; they are alpha
    // rather than solid so the bar keeps one background colour.
    inkInverse: '#FAF9F7',
    inkInverseMuted: '#A8A39D',
    surfaceInverseHover: 'rgba(250, 249, 247, 0.10)',
    surfaceInverseActive: 'rgba(250, 249, 247, 0.16)',

    // Primary buttons. A dark button on a light page, and the reverse in dark
    // mode -- so this pair inverts between schemes while `chrome` does not.
    action: '#1A1816',
    actionHover: '#332F2B',
    onAction: '#FAF9F7',

    // Team logos carry the colour in this app, so accents are rationed:
    // focus rings, text links, destructive copy.
    accent: '#062F4F',
    negative: '#B82601',
    negativeSurface: '#FCF2F0',
    positive: '#1F7A4D',
} as const

export type ColorToken = keyof typeof lightPalette

// Same names, same roles. Warm neutrals again rather than pure greys, so the
// two schemes read as one design; the team logos are the only saturated thing
// on the page in either.
export const darkPalette: Record<ColorToken, string> = {
    ground: '#141312',
    surface: '#1C1B19',
    surfaceSunken: '#232120',
    surfaceHover: '#272522',

    border: '#302D2A',
    borderStrong: '#423E39',

    ink: '#F2F0EC',        // 15.8:1 on ground
    inkHover: '#FFFFFF',
    inkMuted: '#A9A49D',   //  7.8:1
    inkFaint: '#7E7973',   //  4.3:1 -- same caveat as light: not for body text

    // Deeper than the ground rather than lighter, so the bar still reads as
    // chrome against a dark page instead of as another raised card.
    chrome: '#0E0D0C',
    inkInverse: '#FAF9F7',
    inkInverseMuted: '#A8A39D',
    surfaceInverseHover: 'rgba(250, 249, 247, 0.10)',
    surfaceInverseActive: 'rgba(250, 249, 247, 0.16)',

    action: '#F2F0EC',
    actionHover: '#FFFFFF',
    onAction: '#1A1816',

    // #062F4F is unreadable on a dark ground, so the accent lifts to a tint of
    // itself; the other three lift for the same reason.
    accent: '#8FBCE8',
    negative: '#FF7A5C',
    negativeSurface: '#2B1714',
    positive: '#57C08A',
}

// What every style file imports. These are var() references, not colours, so
// they resolve to whichever palette GlobalStyle has written onto <html>.
//
// Anything doing arithmetic on a colour must NOT use these -- a var() string
// cannot be parsed into channels. utils/teamColors.ts keeps its own literal Ink
// and Paper for exactly that reason.
export const color = Object.fromEntries(
    (Object.keys(lightPalette) as ColorToken[]).map((token) => [token, `var(--c-${token})`])
) as Record<ColorToken, string>

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
    maxWidth: '1100px',   // most pages: schedule, admin, prose
    // The standings only. One column per player plus the matchup column runs
    // past 1100px well before a full pool of fifteen, and the cap was spending
    // the space on margin while the table scrolled inside it.
    wideWidth: '1560px',
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
