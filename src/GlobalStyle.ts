import { createGlobalStyle } from 'styled-components'
import { color, font, space, type } from './theme'

// Rendered as the first child inside <Grommet>. Everything here is a bare
// element selector -- specificity 0-0-1 -- while every styled-component class
// is 0-1-0, so nothing in this file can ever outrank a component's own styles.
//
// The headings block is why this file exists: nine pages render a bare <h1>
// (Standings, Schedule, Login, Admin x2, Profile x2, Teams, Weeks, Seasons) and
// have been picking up browser defaults. They inherit the scale from here
// without any page being edited.
export const GlobalStyle = createGlobalStyle`
    *, *::before, *::after { box-sizing: border-box; }

    html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }

    body {
        margin: 0;
        background: ${color.ground};
        color: ${color.ink};
        font-family: ${font.family};
        font-size: ${type.body.size};
        font-weight: ${font.regular};
        line-height: ${type.body.leading};
        letter-spacing: ${type.body.tracking};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        /* 400 and 500 only means the browser must never synthesise a third. */
        font-synthesis-weight: none;
    }

    h1, h2, h3, h4, h5, h6 {
        font-weight: ${font.medium};
        color: ${color.ink};
        margin: 0 0 ${space[4]};
        text-wrap: balance;
    }
    h1 {
        font-size: ${type.title.size};
        letter-spacing: ${type.title.tracking};
        line-height: ${type.title.leading};
        margin-bottom: ${space[6]};
    }
    h2 {
        font-size: ${type.section.size};
        letter-spacing: ${type.section.tracking};
        line-height: ${type.section.leading};
        margin-top: ${space[10]};
    }
    h3 {
        font-size: ${type.subsection.size};
        letter-spacing: ${type.subsection.tracking};
        line-height: ${type.subsection.leading};
        margin-top: ${space[8]};
    }
    h4 {
        font-size: ${type.label.size};
        letter-spacing: ${type.label.tracking};
        line-height: ${type.label.leading};
    }
    h1:first-child, h2:first-child, h3:first-child { margin-top: 0; }

    p { margin: 0 0 ${space[4]}; max-width: 68ch; }
    p:last-child { margin-bottom: 0; }

    a { color: ${color.accent}; text-underline-offset: 2px; }
    b, strong { font-weight: ${font.medium}; }

    /* Makes grommet's controls and the raw <button>s in Login and Admin
       inherit the family rather than falling back to the UA font. */
    button, input, select, textarea { font-family: inherit; letter-spacing: inherit; }

    img { max-width: 100%; }

    :focus-visible { outline: 2px solid ${color.accent}; outline-offset: 2px; }
    /* grommet rings on :focus, not :focus-visible -- keep it off mouse clicks. */
    a:focus:not(:focus-visible), button:focus:not(:focus-visible) { outline: none; }
`
