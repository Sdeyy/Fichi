import { Command, SubCommand, Declare, Options, Embed, createUserOption, createStringOption, type CommandContext } from 'seyfert';
import Blacklist from '../../data/models/blacklist';
import { bot } from '../../core/bot';
import { resolveColor, template } from '../../core/ui';
import { hasRoleId } from '../../core/permissions';
import { config } from '../../core/config';

/* ---------------------------- /blacklist add ------------------------------ */

const userReasonOptions = {
	user: createUserOption({ description: 'User to update in the tickets blacklist', required: true }),
	reason: createStringOption({
		description: 'The reason for the action.',
		required: false,
	}),
};

@Declare({ name: 'add', description: 'Add a user to the blacklist of the tickets' })
@Options(userReasonOptions)
export class BlacklistAddCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof userReasonOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (config.DISABLE_COMMANDS.DISABLED.includes('blacklist')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!hasRoleId(ctx, config.TICKET.SUPPORT_ROLE)) {
			await ctx.write({ content: 'Only the Staff Team can use this command.' });
			return;
		}

		if (!ctx.guildId) return;

		const user = ctx.options.user;
		const reason = ctx.options.reason ?? 'No reason provided';

		if (await Blacklist.exists({ guildID: ctx.guildId, userID: user.id })) {
			const embed = new Embed()
				.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR))
				.setTitle(client.embeds.BLACKLIST.USERBLACKLISTED.Title)
				.setDescription(
					template(client.embeds.BLACKLIST.USERBLACKLISTED.Description, { user: `<@${user.id}>` }),
				);

			await ctx.write({ embeds: [embed] });
			return;
		}

		await Blacklist.create({ guildID: ctx.guildId, userID: user.id, reason });

		const embed = new Embed()
			.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR))
			.setTitle(client.embeds.BLACKLIST.BLACKLISTED.Title)
			.setDescription(
				template(client.embeds.BLACKLIST.BLACKLISTED.Description, {
					user: `<@${user.id}>`,
					reason,
				}),
			);

		await ctx.write({ embeds: [embed] });
	}
}

/* -------------------------- /blacklist remove ----------------------------- */

@Declare({ name: 'remove', description: 'Remove a user from the blacklist' })
@Options(userReasonOptions)
export class BlacklistRemoveCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof userReasonOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (config.DISABLE_COMMANDS.DISABLED.includes('blacklist')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!hasRoleId(ctx, config.TICKET.SUPPORT_ROLE)) {
			await ctx.write({ content: 'Only the Staff Team can use this command.' });
			return;
		}

		if (!ctx.guildId) return;

		const user = ctx.options.user;
		const reason = ctx.options.reason ?? 'No reason provided';

		const record = await Blacklist.findOne({ guildID: ctx.guildId, userID: user.id }).lean();

		if (!record) {
			const embed = new Embed()
				.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR))
				.setTitle(client.embeds.BLACKLIST.UNBLACKLIST.USERUNBLACKLISTED.Title)
				.setDescription(
					template(client.embeds.BLACKLIST.UNBLACKLIST.USERUNBLACKLISTED.Description, {
						user: `<@${user.id}>`,
					}),
				);

			await ctx.write({ embeds: [embed] });
			return;
		}

		await Blacklist.deleteOne({ guildID: ctx.guildId, userID: user.id });

		const embed = new Embed()
			.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR))
			.setTitle(client.embeds.BLACKLIST.UNBLACKLIST.UNBLACKLISTED.Title)
			.setDescription(
				template(client.embeds.BLACKLIST.UNBLACKLIST.UNBLACKLISTED.Description, {
					user: `<@${user.id}>`,
					reason,
				}),
			);

		await ctx.write({ embeds: [embed] });
	}
}

/* --------------------------- /blacklist check ----------------------------- */

const checkOptions = {
	user: createUserOption({ description: 'User to check the blacklist', required: true }),
};

@Declare({ name: 'check', description: 'Check the reason of a blacklist' })
@Options(checkOptions)
export class BlacklistCheckCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof checkOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (config.DISABLE_COMMANDS.DISABLED.includes('blacklist')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!hasRoleId(ctx, config.TICKET.SUPPORT_ROLE)) {
			await ctx.write({ content: 'Only the Staff Team can use this command.' });
			return;
		}

		if (!ctx.guildId) return;

		const user = ctx.options.user;
		const record = await Blacklist.findOne({ guildID: ctx.guildId, userID: user.id }).lean();

		if (!record) {
			const embed = new Embed()
				.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR))
				.setTitle(client.embeds.BLACKLIST.CHECKBLACKLIST.NOBLACKLISTED.Title)
				.setDescription(
					template(client.embeds.BLACKLIST.CHECKBLACKLIST.NOBLACKLISTED.Description, {
						user: `<@${user.id}>`,
					}),
				);

			await ctx.write({ embeds: [embed] });
			return;
		}

		const embed = new Embed()
			.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR))
			.setTitle(client.embeds.BLACKLIST.CHECKBLACKLIST.BLACKLISTED.Title)
			.setDescription(
				template(client.embeds.BLACKLIST.CHECKBLACKLIST.BLACKLISTED.Description, {
					user: `<@${user.id}>`,
					reason: record.reason ?? 'No reason provided',
				}),
			);

		await ctx.write({ embeds: [embed] });
	}
}

/* ------------------------------ /blacklist -------------------------------- */

@Declare({
	name: 'blacklist',
	description: 'add or remove blacklist a user from the tickets.',
	props: { category: 'Tickets' },
})
@Options([BlacklistAddCommand, BlacklistRemoveCommand, BlacklistCheckCommand])
export default class BlacklistCommand extends Command {}
