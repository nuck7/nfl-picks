import { MenuOption, Player } from '../types';

// Admin comes from the player's own document and nothing else -- no hardcoded
// allowlist, so no admin identity is baked into the public bundle. The
// collection starts empty, so the first admin is set once by hand in the
// Firebase console; after that admins grant each other access from the Admin
// page.
export const isAdmin = (user?: Player) => user?.role === 'admin'

export const getVisibleMenuOptions = (
    options: MenuOption[],
    isAdmin: boolean,
    isSignedIn = true
) =>
    options.filter((option) =>
        !option.hidden
        && (!option.adminOnly || isAdmin)
        && (!option.authOnly || isSignedIn)
        && (!option.anonOnly || !isSignedIn)
    )
