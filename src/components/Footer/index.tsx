import React from 'react'
import nuckIcon from '../../assets/nuck-icon.svg'
import {
    FooterBar,
    FooterCredit,
    FooterInner,
    FooterLink,
    FooterMark,
} from './index.styles'

const Footer: React.FC = () => (
    <FooterBar>
        <FooterInner>
            <FooterCredit>
                Brought to you by
                {/* rel is not optional on a target=_blank link: without noopener
                    the new tab gets a handle back to this one through
                    window.opener. */}
                <FooterLink
                    href='https://nuck.app'
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    {/* Decorative: the link's own text already names the site,
                        so announcing the mark as well just says it twice. */}
                    <FooterMark src={nuckIcon} alt='' />
                    nuck.app
                </FooterLink>
            </FooterCredit>
        </FooterInner>
    </FooterBar>
)

export default Footer
