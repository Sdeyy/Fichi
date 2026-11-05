import type { CommandContext, PermissionStrings } from 'seyfert';

/**
 * Permission helpers.
 *
 * - `ctx.member.permissions` holds the permissions of the user running the command.
 * - `ctx.interaction.appPermissions` holds the permissions of the bot itself.
 *
 * In Seyfert `PermissionStrings` is an array of resolvable permission names, so
 * `PermissionsBitField#has` accepts either a name or an array of names.
 */

export function memberHas(ctx: CommandContext, required: PermissionStrings[number]): boolean {
	const permissions = ctx.member?.permissions;

	if (!permissions) return false;

	return permissions.has(required);
}

export function memberHasAny(ctx: CommandContext, required: PermissionStrings[number][]): boolean {
	const permissions = ctx.member?.permissions;

	if (!permissions) return false;

	return required.some((permission) => permissions.has(permission));
}

export function botHas(ctx: CommandContext, required: PermissionStrings[number]): boolean {
	const permissions = ctx.interaction.appPermissions;

	if (!permissions) return false;

	return permissions.has(required);
}

/** `Administrator` shortcut used by most admin-only commands. */
export function requireAdmin(ctx: CommandContext): boolean {
	return memberHas(ctx, 'Administrator');
}

/** Role-id check for the ticket system (support / admin roles come from config). */
export function hasRoleId(
	ctx: { member?: { roles?: { keys: readonly string[] } } | null },
	roleId: string,
): boolean {
	if (!roleId) return false;

	const roles = ctx.member?.roles?.keys;

	if (!roles) return false;

	return roles.includes(roleId);
}
