import React from 'react'
import { Button, ButtonExtendedProps } from 'grommet'
import { Link, LinkProps } from 'react-router-dom'

export type LinkButtonProps = ButtonExtendedProps & Omit<LinkProps, 'color' | 'type'>

// A grommet Button that navigates through react-router instead of doing a full
// page load. grommet supports this at runtime -- Button.js picks its dom tag as
// `!as && href ? 'a' : as` -- but it types only the `as` prop itself and not the
// props the substituted component needs, so `to` is absent from
// ButtonExtendedProps.
//
// `as` is baked in rather than passed by callers: styled(LinkButton) has its own
// polymorphic `as`, and the two collide if both are in play.
//
// grommet's `href` is deliberately unused -- it renders a real anchor that
// reloads the page, which is what discarded TeamsContext (up to 32 ESPN
// requests) on every nav click.
const LinkButton: React.FC<LinkButtonProps> = (props) => {
    const Polymorphic = Button as React.FC<any>
    return <Polymorphic as={Link} {...props} />
}

export default LinkButton
