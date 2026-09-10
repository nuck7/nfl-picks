import React, { useContext } from "react";
import { Avatar, Layer } from "grommet";
import { useLocation } from "react-router-dom";
import { DefaultAvatarImage, ProfileMenuOptions } from "../../constants";
import { auth } from "../../resources/firebase.config";
import { CurrentUserContext } from "../../App";
import { getVisibleMenuOptions } from "../../utils/admin";
import { CurrentUser, MenuOption } from "../../types";
import { ThemeMode } from "../../utils/themeMode";
import { layout } from "../../theme";
import {
    Divider,
    Identity,
    IdentityEmail,
    IdentityName,
    IdentityText,
    MenuNav,
    MenuRow,
    ModeButton,
    ModeGroup,
    Panel,
    SectionLabel,
} from "./index.styles";

const ThemeModes: { id: ThemeMode; label: string }[] = [
    { id: 'system', label: 'System' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
]

interface Props {
    onClose: () => void
    mode: ThemeMode
    onChooseMode: (mode: ThemeMode) => void
}

// Hangs the panel just below the nav bar, with its right edge on the same line
// as the avatar button that opened it -- the nav bar pads itself by the same
// gutter. Both values go through grommet's parseMetricToNum, which is a bare
// parseFloat: a calc() would silently reduce to its first number, so the 8px
// gap under the bar is added here instead of in CSS.
const PanelOffset = {
    top: `${parseInt(layout.navHeight, 10) + 8}px`,
    right: layout.gutter,
}

const ProfileMenu: React.FC<Props> = ({ onClose, mode, onChooseMode }) => {
    const { user, isAdmin } = useContext<CurrentUser>(CurrentUserContext)
    const { pathname } = useLocation()

    return (
        <Layer
            position='top-right'
            margin={PanelOffset}
            // `plain` drops both halves of grommet's modal chrome: the dark
            // overlay -- far too heavy a scrim for a dropdown this small -- and
            // the container's own background and radius, which Panel supplies.
            // `modal` stays, so the transparent overlay still catches the
            // outside click and focus stays trapped in the panel.
            plain
            modal
            // Without this grommet goes full-screen below its 768px breakpoint,
            // which is the skinny full-height drawer in a different costume.
            responsive={false}
            animation='fadeIn'
            onEsc={onClose}
            onClickOutside={onClose}
            aria-label='Profile menu'
        >
            <Panel>
                {user ? (
                    <>
                        <Identity>
                            <Avatar
                                size='medium'
                                src={auth.currentUser?.photoURL || DefaultAvatarImage}
                                // The name sits right beside it; announcing the
                                // image as well just says everything twice.
                                aria-hidden
                            />
                            <IdentityText>
                                <IdentityName>{user.name}</IdentityName>
                                <IdentityEmail>{user.email}</IdentityEmail>
                            </IdentityText>
                        </Identity>
                        <Divider />
                    </>
                ) : null}

                <SectionLabel id='profile-menu-appearance'>Appearance</SectionLabel>
                <ModeGroup role='group' aria-labelledby='profile-menu-appearance'>
                    {ThemeModes.map((option) => (
                        <ModeButton
                            key={option.id}
                            type='button'
                            $active={mode === option.id}
                            // aria-pressed rather than a radiogroup: these are
                            // three buttons that set a value, and only one is
                            // ever on.
                            aria-pressed={mode === option.id}
                            onClick={() => onChooseMode(option.id)}
                        >
                            {option.label}
                        </ModeButton>
                    ))}
                </ModeGroup>

                <Divider />

                <SectionLabel id='profile-menu-account'>Account</SectionLabel>
                <MenuNav gap='none' aria-labelledby='profile-menu-account'>
                    {getVisibleMenuOptions(ProfileMenuOptions, isAdmin, !!user).map((option: MenuOption) => (
                        <MenuRow
                            key={option.label}
                            to={option.link}
                            onClick={onClose}
                            aria-current={pathname === option.link ? 'page' : undefined}
                        >
                            {option.label}
                        </MenuRow>
                    ))}
                </MenuNav>
            </Panel>
        </Layer>
    )
}

export default ProfileMenu
