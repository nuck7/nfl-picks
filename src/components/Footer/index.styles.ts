import styled from 'styled-components'
import { border, color, layout, media, motion, space, typeStyle } from '../../theme'

// A plain document footer, deliberately not sticky: it sits after the main
// content and you meet it by reaching the end of the page. Shell is a flex
// column with Main at flex: 1, so on a short page it still settles at the
// bottom of the viewport rather than floating mid-screen.
export const FooterBar = styled.footer`
    flex: 0 0 auto;
    border-top: ${border.hairline};
    background: ${color.surface};
`

// Matches Main's gutter so the footer's contents line up with the page above
// it. Its own max-width is the narrower one on purpose -- the standings page
// runs wide, but a one-line footer stretched to 1560px reads as adrift.
export const FooterInner = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: ${space[2]};
    width: 100%;
    max-width: ${layout.maxWidth};
    margin: 0 auto;
    padding: ${space[5]} ${layout.gutter};

    ${media.upToMobile} {
        padding: ${space[4]} ${layout.gutterMobile};
    }
`

export const FooterCredit = styled.p`
    ${typeStyle('meta')}
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: ${space[2]};
    margin: 0;
    max-width: none;
    color: ${color.inkMuted};
`

// No border-radius of our own: the icon draws its own rounded square (rx=116 on
// a 512 viewBox), and rounding the box again would clip its corners twice.
export const FooterMark = styled.img`
    display: block;
    /* 24, not 20: the mark carries real detail inside the helmet, and at 20 the
       "n" and the porthole ring collapse into a dark smudge. This is the size
       where it still reads as the icon beside 14px text. */
    height: 24px;
    width: 24px;
    flex: 0 0 auto;
`

// The icon lives inside the link so the mark and the name are one target
// rather than two things sitting near each other.
export const FooterLink = styled.a`
    display: inline-flex;
    align-items: center;
    gap: ${space[2]};
    color: ${color.inkMuted};
    text-decoration: none;
    transition: color ${motion.fast} ${motion.ease};

    &:hover {
        color: ${color.ink};
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`
