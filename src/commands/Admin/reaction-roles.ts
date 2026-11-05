import {
	Command,
	SubCommand,
	Declare,
	Options,
	Embed,
	ActionRow,
	StringSelectMenu,
	type CommandContext,
} from 'seyfert';
import { createRoleOption, createStringOption, createChannelOption } from 'seyfert';
import ReactionRoles, { type ReactionRolesDocument } from '../../data/models/reactionRoles';
import { bot } from '../../core/bot';
import { resolveColor } from '../../core/ui';

/* -------------------------------------------------------------------------- */
/*                                   /add                                     */
/* -------------------------------------------------------------------------- */

const addOptions = {
	role: createRoleOption({ description: 'The role to add', required: true }),
	description: createStringOption({ description: 'The description of the role' }),
	emoji: createStringOption({ description: 'The emoji to use' }),
};

@Declare({ name: 'add', description: 'Add an autorole' })
@Options(addOptions)
export class ReactionRolesAddCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof addOptions>): Promise<void> {
		const client = bot(ctx.client);
		const roleId = ctx.options.role.id;
		const description = ctx.options.description ?? null;
		const emoji = ctx.options.emoji ?? null;

		if (!ctx.guildId) return;

		const me = await ctx.me();
		const highest = await me?.roles.highest();

		if (highest && ctx.options.role.position >= highest.position) {
			await ctx.write({
				content: "I can't add that role, it's higher than my highest role.",
				flags: 64,
			});
			return;
		}

		const guildData = await ReactionRoles.findOne({ guildID: ctx.guildId });
		const entry = { roleId, roleDescription: description, roleEmoji: emoji };

		if (guildData) {
			const exists = guildData.roles.some((item) => item.roleId === roleId);

			if (exists) {
				await ReactionRoles.updateOne(
					{ guildID: ctx.guildId, 'roles.roleId': roleId },
					{ $set: { 'roles.$.roleDescription': description, 'roles.$.roleEmoji': emoji } },
				);
			} else {
				await ReactionRoles.updateOne(
					{ guildID: ctx.guildId },
					{ $push: { roles: entry } },
					{ upsert: true },
				);
			}
		} else {
			await ReactionRoles.create({ guildID: ctx.guildId, roles: [entry] });
		}

		const embed = new Embed()
			.setTitle(client.embeds.ReactionRoles.AddCommand.Title)
			.setDescription(client.embeds.ReactionRoles.AddCommand.Description.replace('%role%', `<@&${roleId}>`))
			.setColor(resolveColor(client.embeds.ReactionRoles.AddCommand.Color));

		await ctx.write({ embeds: [embed], flags: 64 });
	}
}

/* -------------------------------------------------------------------------- */
/*                                  /remove                                   */
/* -------------------------------------------------------------------------- */

const removeOptions = {
	role: createRoleOption({ description: 'The role to remove', required: true }),
};

@Declare({ name: 'remove', description: 'Remove an autorole' })
@Options(removeOptions)
export class ReactionRolesRemoveCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof removeOptions>): Promise<void> {
		const client = bot(ctx.client);
		const roleId = ctx.options.role.id;

		if (!ctx.guildId) return;

		const guildData = await ReactionRoles.findOne({ guildID: ctx.guildId });

		if (!guildData) {
			await ctx.write({ content: 'There are no autoroles set up for this server.', flags: 64 });
			return;
		}

		if (!guildData.roles.some((item) => item.roleId === roleId)) {
			await ctx.write({ content: 'That role is not in the autoroles.', flags: 64 });
			return;
		}

		await ReactionRoles.updateOne(
			{ guildID: ctx.guildId },
			{ $pull: { roles: { roleId } } },
		);

		const embed = new Embed()
			.setTitle(client.embeds.ReactionRoles.RemoveCommand.Title)
			.setDescription(
				client.embeds.ReactionRoles.RemoveCommand.Description.replace('%role%', `<@&${roleId}>`),
			)
			.setColor(resolveColor(client.embeds.ReactionRoles.RemoveCommand.Color));

		await ctx.write({ embeds: [embed], flags: 64 });
	}
}

/* -------------------------------------------------------------------------- */
/*                                   /panel                                   */
/* -------------------------------------------------------------------------- */

const panelOptions = {
	channel: createChannelOption({ description: 'The channel to send the panel' }),
};

@Declare({ name: 'panel', description: 'Open the autoroles panel' })
@Options(panelOptions)
export class ReactionRolesPanelCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof panelOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (!ctx.guildId) return;

		const guildData: ReactionRolesDocument | null = await ReactionRoles.findOne({
			guildID: ctx.guildId,
		}).lean();

		if (!guildData?.roles.length) {
			await ctx.write({ content: 'There are no autoroles set up for this server.', flags: 64 });
			return;
		}

		const guild = await ctx.guild();

		if (!guild) {
			await ctx.write({ content: 'Guild not found.', flags: 64 });
			return;
		}

		const roles = await guild.roles.list();

		const choices = guildData.roles
			.map((item) => {
				const role = roles.find((candidate) => candidate.id === item.roleId);

				if (!role) return null;

				return {
					label: role.name,
					value: role.id,
					...(item.roleDescription ? { description: item.roleDescription } : {}),
					...(item.roleEmoji ? { emoji: { name: item.roleEmoji } } : {}),
				};
			})
			.filter((item) => item !== null);

		if (!choices.length) {
			await ctx.write({ content: 'There are no autoroles set up for this server.', flags: 64 });
			return;
		}

		const embed = new Embed()
			.setTitle(client.config.REACTION_ROLES.EMBED_CONFIG.TITLE)
			.setDescription(client.config.REACTION_ROLES.EMBED_CONFIG.DESCRIPTION)
			.setColor(resolveColor(client.config.REACTION_ROLES.EMBED_CONFIG.COLOR));

		if (client.config.REACTION_ROLES.EMBED_CONFIG.FOOTER) {
			embed.setFooter({ text: client.config.REACTION_ROLES.EMBED_CONFIG.FOOTER });
		}

		const menu = new StringSelectMenu()
			.setCustomId('autoroles')
			.setValuesLength({ max: 1 })
			.addOption(choices);

		const row = new ActionRow().addComponents(menu);
		const target = ctx.options.channel ?? (await ctx.channel());

		if (!target.isTextable()) {
			await ctx.write({ content: 'That channel cannot receive messages.', flags: 64 });
			return;
		}

		await target.messages.write({ embeds: [embed], components: [row] });
		await ctx.write({ content: `Sent the panel to <#${target.id}>`, flags: 64 });
	}
}

/* -------------------------------------------------------------------------- */
/*                                 /reaction-roles                            */
/* -------------------------------------------------------------------------- */

@Declare({
	name: 'reaction-roles',
	description: 'Manage autoroles',
	props: { category: 'Admin' },
})
@Options([ReactionRolesAddCommand, ReactionRolesRemoveCommand, ReactionRolesPanelCommand])
export default class ReactionRolesCommand extends Command {}
