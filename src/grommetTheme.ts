import { ThemeType } from 'grommet'
import { color, font, motion, radius, space, type } from './theme'

// The grommet theme, derived from the tokens in ./theme.ts so there is one
// source of truth and one direction of dependency. <Grommet theme={...}> is
// itself a styled-components ThemeProvider -- grommet re-exports that context
// directly -- so this object is what every styled-component in the app sees as
// props.theme. That is also why we never nest a ThemeProvider inside it.
//
// Several entries below exist to undo a grommet base default rather than to
// express a preference; those are commented individually.

// Inputs, selects and buttons all agree on one radius.
const controlRadius = radius.lg

export const grommetTheme: ThemeType = {
    global: {
        // grommet resolves colours by NAME internally (normalizeColor), so
        // every name its components reach for has to be redefined here or the
        // stock palette leaks through.
        colors: {
            background: color.ground,
            'background-back': color.ground,
            'background-front': color.surface,
            'background-contrast': color.surfaceSunken,

            brand: color.ink,
            control: color.ink,
            focus: color.accent,
            // base ships rgba(0,0,0,0.33) -- far too dark for a hairline, and
            // it is what draws the heavy grid lines on the data tables.
            border: color.border,

            text: { light: color.ink, dark: color.inkInverse },
            'text-strong': { light: color.ink, dark: color.inkInverse },
            'text-weak': { light: color.inkMuted, dark: color.borderStrong },
            'text-xweak': { light: color.inkFaint, dark: color.border },
            icon: { light: color.inkMuted, dark: color.inkInverse },
            placeholder: color.inkFaint,

            selected: color.ink,
            'selected-background': color.surfaceSunken,
            'selected-text': color.ink,
            active: color.surfaceHover,
            'active-background': color.surfaceHover,
            'active-text': color.ink,

            'status-critical': color.negative,
            'status-error': color.negative,
            'status-ok': color.positive,
            'status-disabled': color.borderStrong,

            white: color.surface,
            black: color.ink,
        },

        font: {
            family: font.family,
            size: type.body.size,
            height: type.body.leading,
            weight: font.regular,
        },

        // Bare TextInput / Select outside a FormField get their box from here.
        control: {
            border: { width: '1px', radius: controlRadius, color: 'border' },
            disabled: { opacity: 0.4 },
        },

        input: {
            // base.js:356 ships weight 600. That single value is why every
            // grommet input in this app renders semibold today.
            font: { size: type.input.size, height: type.input.leading, weight: font.regular },
            padding: { horizontal: '15px', vertical: '13px' },
        },

        focus: {
            // base.js:325 ships focus.shadow -- a 2px box-shadow ring, which
            // breaks the no-shadow rule. deepMerge CANNOT delete it; grommet's
            // focusStyles() checks `outline` BEFORE `shadow`, so defining an
            // outline is the only way to suppress the shadow.
            border: { color: 'focus' },
            outline: { color: 'focus', size: '2px' },
        },

        drop: {
            background: color.surface,
            border: { radius: radius.md },
            shadowSize: 'none',
            zIndex: '30',
        },

        // Belt and braces: nothing in this design casts a shadow. Depth comes
        // from hairlines and whitespace only.
        elevation: {
            light: {
                none: 'none', xsmall: 'none', small: 'none',
                medium: 'none', large: 'none', xlarge: 'none',
            },
        },

        hover: {
            background: { color: color.surfaceHover },
            color: { light: color.ink },
        },

        breakpoints: { small: { value: 768 } },
    },

    button: {
        border: { width: '1px', radius: controlRadius },
        padding: { vertical: '13px', horizontal: '21px' },
        size: {
            small: { border: { radius: radius.md }, pad: { vertical: '8px', horizontal: '15px' } },
            medium: { border: { radius: controlRadius }, pad: { vertical: '12px', horizontal: '19px' } },
            large: { border: { radius: controlRadius }, pad: { vertical: '15px', horizontal: '27px' } },
        },
        default: {
            background: 'transparent',
            border: { color: 'border', width: '1px' },
            color: color.ink,
            font: { weight: font.medium },
        },
        primary: {
            background: color.ink,
            border: { color: color.ink, width: '1px' },
            color: color.inkInverse,
            font: { weight: font.medium },
        },
        secondary: {
            background: color.surface,
            border: { color: color.borderStrong, width: '1px' },
            color: color.ink,
            font: { weight: font.medium },
        },
        // Drives the nav's selected item, via grommet Button's `active` prop.
        active: {
            background: color.surfaceSunken,
            color: color.ink,
            border: { color: color.border },
        },
        hover: {
            default: { background: color.surfaceHover },
            primary: { background: color.inkHover },
            secondary: { background: color.surfaceSunken },
        },
        transition: {
            timing: motion.ease,
            duration: 0.14,
            properties: ['color', 'background-color', 'border-color'],
        },
    },

    formField: {
        // base.js:994 ships side:'bottom', so every FormField in the app is an
        // underline today rather than a box. This is the flip to a boxed input.
        // `position` must stay 'inner': grommet puts the border on the content
        // box when inner, and around the whole label+input+error stack when
        // outer.
        border: {
            color: 'border',
            side: 'all',
            size: 'xsmall',
            position: 'inner',
            error: { color: { light: 'status-critical', dark: 'white' } },
        },
        round: controlRadius,
        content: { pad: { horizontal: '15px', vertical: '13px' } },
        // Required by grommet's FormFieldType even though base leaves it
        // commented out; a checkbox field should not get the text input's box.
        checkBox: { pad: 'small' },
        // base indents the label 12px; flush-left reads better against a boxed
        // input, and deepMerge cannot remove the base's own margin entries, so
        // they have to be overridden rather than deleted.
        //
        // `vertical` is deliberately absent. grommet's edgeStyle short-circuits
        // when horizontal and vertical are equal -- it emits a single
        // `margin: none` and never reaches `bottom` -- so setting both to 'none'
        // silently threw the gap away and left the label sitting on the box with
        // nothing but its own leading between them. Naming `top` instead keeps
        // the shortcut from firing, so `bottom` actually lands.
        label: {
            size: type.label.size,
            weight: font.medium,
            color: color.ink,
            margin: { horizontal: 'none', top: 'none', bottom: space[3] },
        },
        help: { color: 'text-weak', margin: { start: 'none', bottom: space[3] } },
        info: { color: 'text-weak', margin: { horizontal: 'none', vertical: '6px' } },
        error: { color: 'status-critical', margin: { horizontal: 'none', vertical: '6px' } },
        disabled: { background: { color: color.surfaceSunken, opacity: 1 } },
        focus: { border: { color: 'focus' } },
        // Replaces the hand-rolled `margin-bottom: 16px` StyledFormField in
        // Login, Profile, Admin and PickForm.
        //
        // Twice the label's 12px gap, so proximity does the grouping: a label
        // is unmistakably nearer the box it names than the field above it. At
        // the old 20px against a working label gap the two distances were close
        // enough to read as one evenly spaced stack.
        margin: { bottom: space[6] },
    },

    select: {
        control: { extend: `border-radius: ${controlRadius};` },
        icons: { margin: { horizontal: '12px' } },
        options: {
            container: { align: 'start', pad: { horizontal: '12px', vertical: '10px' } },
            text: { size: type.body.size, margin: 'none' },
        },
        clear: {
            container: { pad: '12px', background: color.surfaceSunken },
            text: { color: 'text-weak', size: type.caption.size },
        },
    },

    dataTable: {
        container: { gap: 'none' },
        header: {
            border: { side: 'bottom', color: 'border', size: 'xsmall' },
            pad: { horizontal: '12px', vertical: '10px' },
            font: { weight: `${font.medium}`, size: type.caption.size },
            color: 'text-weak',
            gap: 'small',
        },
        // base.js:924 ships 'bold'. There is no bold in this system.
        primary: { weight: `${font.medium}` },
        groupHeader: {
            background: { light: color.surfaceSunken, dark: 'dark-2' },
            border: { side: 'bottom', size: 'xsmall' },
            pad: { horizontal: '12px', vertical: '8px' },
        },
        resize: { border: { color: 'border', side: 'end' } },
        // The pinned header scrolls over the rows, so it has to be opaque --
        // the default is transparent and the logos slide straight through it.
        // The hairline is repeated here because border-collapse: separate (which
        // grommet switches on for pinning) drops the one set above.
        pinned: {
            header: {
                extend: `
                    background: ${color.surface};
                    /* Two shadows, two jobs. The outset one paints a solid band
                       just ABOVE the header: the scrollport's clip edge lands on
                       a fractional pixel, and without it a hairline of the row
                       passing underneath bleeds through along the top. It is
                       clipped by the scroll container, so it never paints
                       outside the table. The inset one is the header's own
                       bottom hairline, which border-collapse: separate drops. */
                    box-shadow:
                        0 -3px 0 0 ${color.surface},
                        inset 0 -1px 0 ${color.border};
                `,
            },
        },
    },

    table: {
        header: { align: 'start', border: 'bottom', pad: { horizontal: '12px', vertical: '10px' } },
        body: { align: 'start', border: 'bottom', pad: { horizontal: '12px', vertical: '10px' } },
    },

    text: {
        xsmall: { size: type.caption.size, height: type.caption.leading },
        small: { size: type.meta.size, height: type.meta.leading },
        medium: { size: type.body.size, height: type.body.leading },
        large: { size: type.lead.size, height: type.lead.leading },
        xlarge: { size: type.subsection.size, height: type.subsection.leading },
        xxlarge: { size: type.section.size, height: type.section.leading },
    },

    heading: {
        font: { family: font.family },
        // base.js ships 600.
        weight: font.medium,
        level: {
            1: { medium: { size: type.title.size, height: type.title.leading, maxWidth: 'none' } },
            2: { medium: { size: type.section.size, height: type.section.leading, maxWidth: 'none' } },
            3: { medium: { size: type.subsection.size, height: type.subsection.leading, maxWidth: 'none' } },
        },
    },

    paragraph: { medium: { size: type.body.size, height: type.body.leading, maxWidth: '68ch' } },

    anchor: { color: color.accent, fontWeight: font.regular, textDecoration: 'underline' },

    avatar: { size: { small: '32px', medium: '40px' } },

    card: { container: { round: radius.lg, elevation: 'none' } },

    layer: {
        // When a Layer opens, LayerContainer parks focus on a 0x0 aria-hidden
        // anchor so tabbing starts inside the dialog. GlobalStyle's
        // :focus-visible ring then paints around it as a stray 4px square
        // floating beside the panel.
        extend: `
            a[aria-hidden='true'][tabindex='-1']:focus-visible { outline: none; }
        `,
        background: color.surface,
        border: { radius: radius.xl },
        overlay: { background: 'rgba(26, 24, 22, 0.32)' },
        container: { elevation: 'none' },
        zIndex: '40',
    },
}
