import { MenuOption, Player } from '../types';

// Admin comes from the player's own document and nothing else -- no hardcoded
// allowlist, so no admin identity is baked into the public bundle. The
// collection starts empty, so the owner is set once by hand in the Firebase
// console (role: "owner"); every other admin is granted from the Admin page by
// the owner, and by nobody else.
export const isOwner = (user?: Player) => user?.role === 'owner'

// The owner has every admin power as well, so this is what the pages gate on.
// Only the Access column on the Admin page asks the narrower question.
export const isAdmin = (user?: Player) => user?.role === 'admin' || isOwner(user)

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
