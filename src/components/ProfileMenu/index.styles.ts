import { Nav } from 'grommet'
import styled, { css, keyframes } from 'styled-components'
import { border, color, layout, motion, radius, space, typeStyle } from '../../theme'
import LinkButton from '../LinkButton'

// The panel used to be a full-height <Layer position='right' full='vertical'>:
// a 272px column running floor to ceiling for two links. It is now an anchored
// card that hangs off the avatar button, which is what the two links actually
// need.
const rise = keyframes`
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`

export const Panel = styled.div`
    width: 320px;
    /* The Layer is offset from the right edge by PanelOffset.right; leaving the
       same gap on the left keeps the card off both edges on a narrow phone. */
    max-width: calc(100vw - ${layout.gutter} * 2);
    padding: ${space[2]};
    /* The stronger hairline, not the plain one: this is the only thing holding
       the card off the page, since nothing in this system casts a shadow. A
       translucent + backdrop-filter treatment was tried first and dropped --
       the blur does not composite over a grommet Layer, so all it did was let
       the page text behind show through unblurred. */
    border: ${border.hairlineStrong};
    border-radius: ${radius.xl};
    background: ${color.surface};
    transform-origin: top right;
    animation: ${rise} ${motion.base} ${motion.ease} both;

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`

// Who you are signed in as. The avatar repeats the one in the nav bar on
// purpose: it is the thing that was clicked, so it anchors the panel to it.
export const Identity = styled.div`
    display: flex;
    align-items: center;
    gap: ${space[3]};
    padding: ${space[3]};
`

export const IdentityText = styled.div`
    /* min-width: 0 is what lets the email below actually ellipsize -- a flex
       item's default min-width is auto, which refuses to shrink past content. */
    min-width: 0;
`

const truncate = css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

export const IdentityName = styled.div`
    ${typeStyle('label')}
    ${truncate}
    color: ${color.ink};
`

export const IdentityEmail = styled.div`
    ${typeStyle('caption')}
    ${truncate}
    color: ${color.inkMuted};
`

export const Divider = styled.hr`
    height: 0;
    margin: ${space[1]} ${space[3]};
    border: 0;
    border-top: ${border.hairline};
`

export const SectionLabel = styled.div`
    ${typeStyle('caption')}
    color: ${color.inkMuted};
    padding: ${space[2]} ${space[3]} ${space[1]};
`

export const MenuNav = styled(Nav)`
    gap: 0;
`

export const MenuRow = styled(LinkButton)`
    ${typeStyle('lead')}
    display: block;
    width: 100%;
    color: ${color.ink};
    /* Even top and bottom now the rows are a single line; they carried a
       heavier bottom pad when a description sat under each label. */
    padding: ${space[2]} ${space[3]};
    border: none;
    border-radius: ${radius.sm};
    background: transparent;
    text-align: start;
    text-decoration: none;
    transition: background-color ${motion.fast} ${motion.ease};

    &:hover { background: ${color.surfaceHover}; }

    &[aria-current='page'] { background: ${color.surfaceSunken}; }
`

