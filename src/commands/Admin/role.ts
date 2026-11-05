import ms from 'ms';
import { Command, SubCommand, Declare, Options, Embed, type CommandContext } from 'seyfert';
import {
	createUserOption,
	createRoleOption,
	createStringOption,
} from 'seyfert';
import TempRole from '../../data/models/tempRole';
import { checkExpiredRoles } from '../../functions/checkTempRoles';
import { bot } from '../../core/bot';
import { resolveColor, template } from '../../core/ui';
import { memberHas, requireAdmin } from '../../core/permissions';

/* ------------------------------- /role list ------------------------------- */

@Declare({ name: 'list', description: 'List Roles' })
@Options({})
export class RoleListCommand extends SubCommand {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (!ctx.guildId) return;

		const roles = await TempRole.find({ guildId: ctx.guildId }).lean();

		if (!roles.length) {
			await ctx.write({ content: client.language.TempRoles.NotFoundRoles, flags: 64 });
			return;
		}

		const description = roles
			.map((entry) => `<@&${entry.roleId}> → <@${entry.userId}> (<t:${Math.floor(entry.expiresAt.getTime() / 1000)}:R>)`)
			.join('\n');

		const embed = new Embed()
			.setColor(resolveColor(client.embeds.TempRoles.CheckTimeEmbed.Color))
			.setTitle(client.embeds.TempRoles.CheckTimeEmbed.Title.replace('%userTag%', 'Guild'))
			.setDescription(description);

		await ctx.write({ embeds: [embed], flags: 64 });
	}
}

/* ------------------------------ /role add-temp ---------------------------- */

const addTempOptions = {
	user: createUserOption({ description: 'User to add rol', required: true }),
	role: createRoleOption({ description: 'Role to be given to the user', required: true }),
	time: createStringOption({ description: 'Amount of time for which you will be given the role', required: true }),
};

@Declare({ name: 'add-temp', description: 'temporarily adds a role to a user' })
@Options(addTempOptions)
export class RoleAddTempCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof addTempOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (!memberHas(ctx, 'ManageRoles')) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		if (!ctx.guildId) return;

		const user = ctx.options.user;
		const role = ctx.options.role;
		const time = ctx.options.time;
		const duration = ms(time);

		if (typeof duration !== 'number' || duration <= 0) {
			await ctx.write({ content: 'Invalid duration. Try `3d`, `12h` or `30m`.', flags: 64 });
			return;
		}

		const member = await ctx.client.members.fetch(ctx.guildId, user.id).catch(() => null);

		if (!member) {
			await ctx.write({ content: 'Member not found', flags: 64 });
			return;
		}

		const existing = await TempRole.findOne({
			guildId: ctx.guildId,
			userId: user.id,
			roleId: role.id,
		});

		if (existing) {
			existing.expiresAt = new Date(existing.expiresAt.getTime() + duration);
			await existing.save();

			await ctx.write({
				content: `El tiempo del rol temporal **${role.name}** para **${user.username}** ha sido extendido por ${time}.`,
				flags: 64,
			});
			return;
		}

		await ctx.client.members.addRole(ctx.guildId, user.id, role.id);
		await TempRole.create({
			guildId: ctx.guildId,
			userId: user.id,
			roleId: role.id,
			expiresAt: new Date(Date.now() + duration),
		});

		await ctx.write({
			content: template(client.language.TempRoles.Added, {
				role: `<@&${role.id}>`,
				roleName: role.name,
				user: `<@${user.id}>`,
				userTag: user.username,
				userID: user.id,
				time,
			}),
			flags: 64,
		});
	}
}

/* ---------------------------- /role check-time ---------------------------- */

const checkTimeOptions = {
	user: createUserOption({
		description: 'El usuario al que revisar los roles temporales',
		required: true,
	}),
};

@Declare({
	name: 'check-time',
	description: 'Revisar cuánto tiempo le queda a los roles temporales de un usuario',
})
@Options(checkTimeOptions)
export class RoleCheckTimeCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof checkTimeOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (!memberHas(ctx, 'ManageRoles')) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		if (!ctx.guildId) return;

		const user = ctx.options.user;
		const tempRoles = await TempRole.find({ guildId: ctx.guildId, userId: user.id }).lean();

		if (!tempRoles.length) {
			await ctx.write({ content: client.language.TempRoles.NotFoundRoles, flags: 64 });
			return;
		}

		const roles = await (await ctx.guild())?.roles.list();

		const now = Date.now();
		const lines = tempRoles.map((entry) => {
			const role = roles?.find((candidate) => candidate.id === entry.roleId);
			const remaining = entry.expiresAt.getTime() - now;

			if (remaining <= 0) {
				return `<@&${entry.roleId}>: Expirado`;
			}

			const days = Math.floor(remaining / 86_400_000);
			const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
			const minutes = Math.floor((remaining % 3_600_000) / 60_000);
			const seconds = Math.floor((remaining % 60_000) / 1000);

			return `${role ? `<@&${role.id}>` : `Rol desconocido (${entry.roleId})`}: Expira en ${days}d ${hours}h ${minutes}m ${seconds}s`;
		});

		const embed = new Embed()
			.setColor(resolveColor(client.embeds.TempRoles.CheckTimeEmbed.Color))
			.setTitle(client.embeds.TempRoles.CheckTimeEmbed.Title.replace('%userTag%', user.username))
			.setDescription(lines.join('\n'));

		await ctx.write({ embeds: [embed], flags: 64 });
	}
}

/* --------------------------- /role force-check ---------------------------- */

@Declare({
	name: 'force-check',
	description: 'Tira un check forzado a la base de datos para que se quiten los roles',
})
@Options({})
export class RoleForceCheckCommand extends SubCommand {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (!requireAdmin(ctx)) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		await checkExpiredRoles(client);
		await ctx.write({ content: client.language.TempRoles.CheckExpiredRoles, flags: 64 });
	}
}

/* -------------------------------- /role add ------------------------------- */

const addOptions = {
	user: createUserOption({ description: 'User to be given the role', required: true }),
	role: createRoleOption({ description: 'Role to be given to the user', required: true }),
};

@Declare({ name: 'add', description: 'Adds a role PERMANENTLY to a user' })
@Options(addOptions)
export class RoleAddCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof addOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (!memberHas(ctx, 'ManageRoles')) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		if (!ctx.guildId) return;

		const { user, role } = ctx.options;
		const me = await ctx.me();
		const highest = await me?.roles.highest();
		const authorHighest = await ctx.member?.roles.highest();

		if (highest && role.position >= highest.position) {
			await ctx.write({ content: client.language.NO_PERMSROLEHIGHER, flags: 64 });
			return;
		}

		if (authorHighest && role.position >= authorHighest.position) {
			await ctx.write({ content: client.language.NO_PERMSROLEHIGHER, flags: 64 });
			return;
		}

		const member = await ctx.client.members.fetch(ctx.guildId, user.id).catch(() => null);

		if (!member) {
			await ctx.write({ content: 'Member not found', flags: 64 });
			return;
		}

		if (member.roles.keys.includes(role.id)) {
			await ctx.write({
				content: template(client.language.Roles.Already, {
					role: `<@&${role.id}>`,
					roleName: role.name,
					user: `<@${user.id}>`,
					userTag: user.username,
				}),
				flags: 64,
			});
			return;
		}

		await ctx.client.members.addRole(ctx.guildId, user.id, role.id);

		const embed = new Embed()
			.setTitle(client.embeds.Roles.Added.Title)
			.setDescription(
				template(client.embeds.Roles.Added.Description, {
					role: `<@&${role.id}>`,
					user: `<@${user.id}>`,
					userTag: user.username,
				}),
			)
			.setColor(resolveColor(client.embeds.Roles.Added.Color));

		await ctx.write({ embeds: [embed], flags: 64 });
	}
}

/* ------------------------------ /role remove ------------------------------ */

const removeOptions = {
	user: createUserOption({ description: 'User to be removed the role', required: true }),
	role: createRoleOption({ description: 'Role to be removed to ther user', required: true }),
};

@Declare({ name: 'remove', description: 'Removes a role to a user' })
@Options(removeOptions)
export class RoleRemoveCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof removeOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (!memberHas(ctx, 'ManageRoles')) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		if (!ctx.guildId) return;

		const { user, role } = ctx.options;
		const me = await ctx.me();
		const highest = await me?.roles.highest();

		if (highest && role.position >= highest.position) {
			await ctx.write({ content: client.language.NO_PERMSROLEHIGHER, flags: 64 });
			return;
		}

		const member = await ctx.client.members.fetch(ctx.guildId, user.id).catch(() => null);

		if (!member) {
			await ctx.write({ content: 'Member not found', flags: 64 });
			return;
		}

		if (!member.roles.keys.includes(role.id)) {
			await ctx.write({
				content: template(client.language.Roles.NoHaveRole, {
					role: `<@&${role.id}>`,
					roleName: role.name,
					user: `<@${user.id}>`,
					userTag: user.username,
				}),
				flags: 64,
			});
			return;
		}

		await ctx.client.members.removeRole(ctx.guildId, user.id, role.id);
		await TempRole.deleteMany({ guildId: ctx.guildId, userId: user.id, roleId: role.id });

		const embed = new Embed()
			.setTitle(client.embeds.Roles.Removed.Title)
			.setDescription(
				template(client.embeds.Roles.Removed.Description, {
					role: `<@&${role.id}>`,
					user: `<@${user.id}>`,
					userTag: user.username,
				}),
			)
			.setColor(resolveColor(client.embeds.Roles.Removed.Color));

		await ctx.write({ embeds: [embed], flags: 64 });
	}
}

/* --------------------------------- /role ---------------------------------- */

@Declare({
	name: 'role',
	description: 'Add temp/perm role to a user',
	props: { category: 'Admin' },
})
@Options([
	RoleListCommand,
	RoleAddTempCommand,
	RoleCheckTimeCommand,
	RoleForceCheckCommand,
	RoleAddCommand,
	RoleRemoveCommand,
])
export default class RoleCommand extends Command {}
