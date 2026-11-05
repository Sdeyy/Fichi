import humanize from 'humanize-duration';
import { Command, SubCommand, Declare, Options, Embed, type CommandContext } from 'seyfert';
import { createUserOption, createNumberOption } from 'seyfert';
import UserInvites from '../../data/models/userInvites';
import { bot } from '../../core/bot';
import { resolveColor, template } from '../../core/ui';
import { requireAdmin } from '../../core/permissions';

/** Simple in-memory cooldown for the leaderboard subcommand. */
const leaderboardCooldown = new Map<string, number>();
const LEADERBOARD_COOLDOWN_MS = 2 * 60 * 1000;

/* ------------------------------ /invites check ---------------------------- */

const checkOptions = {
	user: createUserOption({ description: 'Usuario del que quieres ver las invites' }),
};

@Declare({ name: 'check', description: 'Ver las invitaciones de un usuario' })
@Options(checkOptions)
export class InvitesCheckCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof checkOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('invites')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const user = ctx.options.user ?? ctx.author;
		const data = await UserInvites.findOne({ userId: user.id }).lean();

		if (data) {
			await ctx.write({
				content: template(client.language.Invites.hasInvites, {
					user: `<@${user.id}>`,
					invites: data.invites,
				}),
				flags: 64,
			});
			return;
		}

		await ctx.write({
			content: template(client.language.Invites.noHasInvites, { user: `<@${user.id}>` }),
			flags: 64,
		});
	}
}

/* ---------------------------- /invites leaderboard ------------------------ */

@Declare({ name: 'leaderboard', description: 'Ver la leaderboard de invitaciones' })
@Options({})
export class InvitesLeaderboardCommand extends SubCommand {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('invites')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const userId = ctx.author.id;
		const expiresAt = leaderboardCooldown.get(userId);

		if (expiresAt && Date.now() < expiresAt) {
			const remaining = humanize(expiresAt - Date.now(), {
				language: 'es',
				units: ['h', 'm', 's'],
				round: true,
			});

			await ctx.write({
				content: template(client.language.Invites.cooldown, { remainingTime: remaining }),
				flags: 64,
			});
			return;
		}

		leaderboardCooldown.set(userId, Date.now() + LEADERBOARD_COOLDOWN_MS);

		const top = await UserInvites.find().sort({ invites: -1 }).limit(10).lean();

		const embed = new Embed()
			.setColor(resolveColor(client.embeds.Invites.Leaderboard.Color))
			.setTitle(client.embeds.Invites.Leaderboard.Title)
			.setDescription(
				top.map((entry, index) => `${index + 1}. <@${entry.userId}> - ${entry.invites} invitaciones`).join('\n'),
			)
			.setTimestamp()
			.setFooter({ text: client.embeds.Invites.Leaderboard.Footer });

		await ctx.write({ embeds: [embed] });
	}
}

/* ------------------------------- /invites add ----------------------------- */

const amountOptions = {
	user: createUserOption({
		description: 'Usuario del que quieres añadir invitaciones',
		required: true,
	}),
	cantidad: createNumberOption({ description: 'Cantidad de invitaciones a añadir', required: true }),
};

@Declare({ name: 'add', description: 'Añadir invitaciones a un usuario' })
@Options(amountOptions)
export class InvitesAddCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof amountOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('invites')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!requireAdmin(ctx)) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		const user = ctx.options.user;
		const amount = ctx.options.cantidad;

		const updated = await UserInvites.findOneAndUpdate(
			{ userId: user.id },
			{ $inc: { invites: amount } },
			{ new: true, upsert: true, setDefaultsOnInsert: true },
		).lean();

		const embed = new Embed()
			.setColor(resolveColor(client.embeds.Invites.AddInvites.Color))
			.setTitle(client.embeds.Invites.AddInvites.Title)
			.setDescription(
				template(client.embeds.Invites.AddInvites.Description, {
					user: `<@${user.id}>`,
					invites: updated?.invites ?? 0,
				}),
			)
			.setTimestamp()
			.setFooter({ text: client.embeds.Invites.AddInvites.Footer });

		await ctx.write({ embeds: [embed], flags: 64 });
	}
}

/* ----------------------------- /invites remove ---------------------------- */

@Declare({ name: 'remove', description: 'Eliminar invitaciones de un usuario' })
@Options(amountOptions)
export class InvitesRemoveCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof amountOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('invites')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!requireAdmin(ctx)) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		const user = ctx.options.user;
		const amount = ctx.options.cantidad;
		const data = await UserInvites.findOne({ userId: user.id }).lean();
		const nextAmount = Math.max((data?.invites ?? 0) - amount, 0);

		await UserInvites.findOneAndUpdate(
			{ userId: user.id },
			{ $set: { invites: nextAmount } },
			{ upsert: true, new: true },
		);

		const embed = new Embed()
			.setColor(resolveColor(client.embeds.Invites.RemoveInvites.Color))
			.setTitle(client.embeds.Invites.RemoveInvites.Title)
			.setDescription(
				template(client.embeds.Invites.RemoveInvites.Description, {
					user: `<@${user.id}>`,
					amount: nextAmount,
				}),
			)
			.setTimestamp()
			.setFooter({ text: client.embeds.Invites.RemoveInvites.Footer });

		await ctx.write({ embeds: [embed], flags: 64 });
	}
}

/* ------------------------------ /invites clear ---------------------------- */

const clearOptions = {
	user: createUserOption({ description: 'Usuario del que quieres ver las invites', required: true }),
};

@Declare({ name: 'clear', description: 'Reiniciar invitaciones de un usuario' })
@Options(clearOptions)
export class InvitesClearCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof clearOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('invites')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!requireAdmin(ctx)) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		const user = ctx.options.user;

		await UserInvites.findOneAndUpdate(
			{ userId: user.id },
			{ $set: { invites: 0 } },
			{ upsert: true, new: true },
		);

		const embed = new Embed()
			.setColor(resolveColor(client.embeds.Invites.ClearInvites.Color))
			.setTitle(client.embeds.Invites.ClearInvites.Title)
			.setDescription(
				template(client.embeds.Invites.ClearInvites.Description, { user: `<@${user.id}>` }),
			)
			.setTimestamp()
			.setFooter({ text: client.embeds.Invites.ClearInvites.Footer });

		await ctx.write({ embeds: [embed], flags: 64 });
	}
}

/* ------------------------------- /invites --------------------------------- */

@Declare({
	name: 'invites',
	description: 'Invites command.',
	props: { category: 'General' },
})
@Options([
	InvitesCheckCommand,
	InvitesAddCommand,
	InvitesRemoveCommand,
	InvitesClearCommand,
	InvitesLeaderboardCommand,
])
export default class InvitesCommand extends Command {}
