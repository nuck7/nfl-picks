import styled, { createGlobalStyle } from 'styled-components'
import { border, color, font, space, typeStyle } from '../../theme'

// Mounted by the print view and nothing else, so these rules exist only while
// that route is on screen -- styled-components removes them on unmount and the
// rest of the app keeps its ordinary print behaviour.
export const PrintPageStyle = createGlobalStyle`
    @page {
        size: landscape;
        margin: 12mm;
    }

    @media print {
        /* App chrome is not part of the sheet. */
        nav {
            display: none !important;
        }

        /* Main and the page card exist to centre and inset content on screen.
           On paper the @page margin already does that, and their padding just
           costs column width -- which is the whole constraint here. */
        /* Two levels: grommet's own wrapper, then Shell, which paints the
           warm ground. Only reaching the first leaves a tinted block under the
           table on any printer with "background graphics" switched on. */
        #app > div,
        #app > div > div {
            background: #fff !important;
        }
        main {
            max-width: none !important;
            padding: 0 !important;
        }
        main > div {
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: #fff !important;
        }

        body {
            background: #fff !important;
        }
    }
`

// Buttons and back links: on screen only.
export const ToolBar = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${space[3]};
    margin-bottom: ${space[6]};

    @media print {
        display: none;
    }
`

export const SheetHeading = styled.h1`
    margin-bottom: ${space[2]};
`

export const SheetMeta = styled.p`
    ${typeStyle('meta')}
    color: ${color.inkMuted};
    margin-bottom: ${space[6]};
`

export const Notice = styled.p`
    color: ${color.inkMuted};
`

// Sized in pt rather than px: this table only ever exists to be printed, and pt
// is the unit the page size is actually reasoned about in.
export const Sheet = styled.table`
    width: 100%;
    border-collapse: collapse;
    ${typeStyle('caption')}

    th,
    td {
        border: ${border.hairline};
        padding: ${space[1]} ${space[2]};
        text-align: center;
        white-space: nowrap;
    }

    /* The matchup column is the only wide one; every player column can be
       narrow because an abbreviation is at most three characters. */
    th:first-child,
    td:first-child {
        text-align: left;
        width: 1%;
    }

    thead th {
        font-weight: ${font.medium};
        background: ${color.surfaceSunken};
    }

    tfoot th,
    tfoot td {
        font-weight: ${font.medium};
        background: ${color.surfaceSunken};
    }

    tbody th {
        font-weight: ${font.regular};
    }

    @media print {
        font-size: 8pt;

        /* Fixed layout is what makes the sheet fit any pool size. Left to size
           itself, the table takes its width from its widest content -- with 15
           players and real surnames that measured 1439px against a 1032px A4
           landscape content box, so the right-hand columns simply fell off the
           page. Fixed gives every player an equal share of whatever is left. */
        table-layout: fixed;

        th,
        td {
            padding: 3px 4px;
        }

        /* The one column whose text cannot shorten: "NYG @ WSH" needs its width
           and there is nothing to wrap. Everything else divides the remainder. */
        th:first-child,
        td:first-child {
            width: 92px;
        }

        /* Headers wrap rather than widen their column -- a long surname is the
           only thing here that would otherwise blow the layout out. */
        thead th {
            white-space: normal;
            overflow-wrap: anywhere;
        }

        /* Repeat the player names on every page, and never split a matchup
           across a page break. */
        thead {
            display: table-header-group;
        }
        tfoot {
            display: table-footer-group;
        }
        tr {
            break-inside: avoid;
        }

        th,
        td {
            border-color: #999;
        }

        /* Browsers drop background colours from print by default; these two
           bands are the only ones worth insisting on. */
        thead th,
        tfoot th,
        tfoot td {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
    }
`

// A correct pick is marked with a tick rather than a colour, because colour is
// the first thing a printer drops.
export const Correct = styled.span`
    font-weight: ${font.medium};
`

export const NoPick = styled.span`
    color: ${color.inkFaint};
`
