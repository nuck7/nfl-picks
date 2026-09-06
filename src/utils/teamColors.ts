import { Team } from '../types'

/* ---------------------------------------------------------------------------
 * ESPN sends hex with no leading '#', e.g. "a71930". Everything here works on
 * the bare 6-digit body and only puts the '#' back on the way out, so a colour
 * is normalised exactly once -- here -- rather than at every call site.
 * ------------------------------------------------------------------------ */

type Rgb = readonly [number, number, number]

const HexBody = /^[0-9a-f]{6}$/

const parseHex = (value?: string): Rgb | undefined => {
    const body = (value ?? '').trim().toLowerCase().replace(/^#/, '')
    if (!HexBody.test(body)) {
        return undefined
    }
    return [
        parseInt(body.slice(0, 2), 16),
        parseInt(body.slice(2, 4), 16),
        parseInt(body.slice(4, 6), 16),
    ]
}

const toHex = ([r, g, b]: Rgb) =>
    `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`

// '#rrggbb', or undefined for anything ESPN could send that isn't a colour --
// an empty string, a name, a malformed value.
export const toCssColor = (value?: string): string | undefined => {
    const rgb = parseHex(value)
    return rgb ? toHex(rgb) : undefined
}

export const withAlpha = (value: string, alpha: number): string => {
    const rgb = parseHex(value)
    return rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})` : value
}

/* --- Colorimetry (WCAG 2.1 relative luminance) --------------------------- */

const toLinear = (channel: number) => {
    const c = channel / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const fromLinear = (value: number) => {
    const c = Math.min(1, Math.max(0, value))
    return Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055))
}

const luminanceOf = ([r, g, b]: Rgb) =>
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)

export const luminance = (value?: string): number => {
    const rgb = parseHex(value)
    return rgb ? luminanceOf(rgb) : 0
}

export const contrastRatio = (a?: string, b?: string): number => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
}

export const Ink = '#101418'
export const Paper = '#ffffff'

// White and black cross over at L = 0.179, where 1.05/(L+0.05) and
// (L+0.05)/0.05 are equal. Of the 32 primaries, 26 land on white and 6 -- LAC,
// CIN, MIA, NO, CAR, TEN -- on black. None fails both, so this always resolves.
export const readableTextOn = (background?: string): string =>
    luminance(background) > 0.179 ? Ink : Paper

// Slides a colour down the linear ramp until white text on it clears
// `minContrast`. Relative luminance is linear in the linear-light channels, so
// one multiply lands on the target exactly -- no search -- and hue is preserved
// because all three channels move by the same factor.
export const darkenForWhiteText = (value: string, minContrast: number): string => {
    const rgb = parseHex(value)
    if (!rgb) {
        return value
    }
    const maxLuminance = 1.05 / minContrast - 0.05
    const current = luminanceOf(rgb)
    if (current <= maxLuminance) {
        return toHex(rgb)
    }

    const scaled = (factor: number): Rgb => [
        fromLinear(toLinear(rgb[0]) * factor),
        fromLinear(toLinear(rgb[1]) * factor),
        fromLinear(toLinear(rgb[2]) * factor),
    ]

    // One multiply lands on the target in continuous space, but channels are
    // 8-bit: rounding them can put luminance back over the line (measured worst
    // case 0.3009 against a 0.3000 target, i.e. 2.99:1 rather than 3:1). Step
    // down until the rounded colour actually clears the target, so the function
    // keeps its contract rather than nearly keeping it. Converges in 1-2 passes
    // and terminates at black regardless.
    let factor = maxLuminance / current
    let out = scaled(factor)
    for (let i = 0; i < 8 && luminanceOf(out) > maxLuminance; i++) {
        factor *= 0.99
        out = scaled(factor)
    }
    return toHex(out)
}

export const rgbDistance = (a?: string, b?: string): number => {
    const left = parseHex(a)
    const right = parseHex(b)
    if (!left || !right) {
        return 0
    }
    return Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2])
}

/* --- Matchup band colours ------------------------------------------------ */

// Below this the two ends read as one flat block. Primaries alone can't clear
// it for 74 of the 496 matchups: DAL, NE and SEA are all #002a5c outright, and
// LV and PIT are both #000000.
const MinSeparation = 60

// Rejects an alternate that would vanish into the page. ESPN gives ARI, IND and
// NYJ an alternateColor of #ffffff; without this gate the fallback paints a
// white gradient end in 20 of the 992 ordered matchups.
const MinPageContrast = 1.3

// 24px names are WCAG "large text" (>= 18pt) so 3:1 carries them; the 16px
// compact heading needs 4.5:1. Both are met by darkening the band ends rather
// than by picking an ink, which is why band text is always white and never has
// to flip part-way along the gradient. The 3:1 clamp moves exactly one team
// (New Orleans, #d3bc8d, the league's only light primary); the 4.5:1 clamp
// moves six, five of them imperceptibly.
export const BandContrast = { regular: 3, compact: 4.5 }

export const BandInk = Paper
// The centre of a band: a fixed near-black scrim, laid over the team gradient
// rather than derived from it, so the "@" and the kickoff time have the same
// contrast in every one of the 992 matchups.
export const BandScrimRgb = '9, 11, 14'
const NeutralBand = '#39414b'

const candidateColors = (team?: Team): string[] => {
    const out: string[] = []
    for (const raw of [team?.color, team?.alternateColor]) {
        const value = toCssColor(raw)
        if (value && !out.includes(value) && contrastRatio(value, Paper) >= MinPageContrast) {
            out.push(value)
        }
    }
    return out
}

export type BandColors = {
    away: string
    home: string
    // false while TeamsContext is still empty. The band paints neutral so the
    // row's geometry settles before the colours land, and because both the
    // neutral and every clamped team colour take white text, only the hue
    // changes when they arrive -- no ink flip, no reflow.
    resolved: boolean
}

// 32 teams x 32 teams x 2 contrast levels bounds this; a week touches ~16.
const bandCache = new Map<string, BandColors>()

export const resolveBandColors = (
    awayTeam: Team | undefined,
    homeTeam: Team | undefined,
    minContrast: number = BandContrast.regular
): BandColors => {
    const key = `${awayTeam?.id ?? '-'}|${homeTeam?.id ?? '-'}|${minContrast}`
    const cached = bandCache.get(key)
    if (cached) {
        return cached
    }

    const away = candidateColors(awayTeam)
    const home = candidateColors(homeTeam)
    let result: BandColors

    if (!away.length || !home.length) {
        result = { away: NeutralBand, home: NeutralBand, resolved: false }
    } else {
        // Ranked, so a matchup keeps both primaries whenever they are far
        // enough apart, then gives up the home primary, then the away one.
        // Measured across all 992 ordered matchups: 844 primary/primary, 128
        // primary/home-alternate, 20 away-alternate/primary, 0 forced.
        const options: { away: string; home: string; rank: number; distance: number }[] = []
        for (let a = 0; a < away.length; a++) {
            for (let h = 0; h < home.length; h++) {
                options.push({
                    away: away[a],
                    home: home[h],
                    rank: a * 2 + h,
                    distance: rgbDistance(away[a], home[h]),
                })
            }
        }

        const separated = options.filter((option) => option.distance >= MinSeparation)
        // The `else` never fires against today's league, but a colour change at
        // ESPN's end should degrade to "the most different pair we have" rather
        // than to undefined.
        const chosen = separated.length
            ? separated.sort((x, y) => x.rank - y.rank)[0]
            : options.sort((x, y) => y.distance - x.distance)[0]

        result = {
            away: darkenForWhiteText(chosen.away, minContrast),
            home: darkenForWhiteText(chosen.home, minContrast),
            resolved: true,
        }
    }

    bandCache.set(key, result)
    return result
}

/* --- Solid fills --------------------------------------------------------- */

export type FillColors = { background: string; ink: string; resolved: boolean }

const NeutralFill = '#eef0f3'

// For a surface painted one flat colour -- a standings pick cell. Unlike a band
// this uses the primary at full saturation, because the background under the
// content is a single known value rather than a ramp, so readableTextOn is
// exact instead of a worst case.
export const resolveFillColor = (value?: string): FillColors => {
    const css = toCssColor(value)
    return css
        ? { background: css, ink: readableTextOn(css), resolved: true }
        : { background: NeutralFill, ink: Ink, resolved: false }
}
