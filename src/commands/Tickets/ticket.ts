import {
	Command,
	SubCommand,
	Declare,
	Options,
	Embed,
	ActionRow,
	Button,
	StringSelectMenu,
	createStringOption,
	createChannelOption,
	createRoleOption,
	createUserOption,
	type CommandContext,
} from 'seyfert';
import TicketDB from '../../data/models/ticketDB';
import { bot } from '../../core/bot';
import { buttonStyle, resolveColor, template } from '../../core/ui';
import { requireAdmin, hasRoleId } from '../../core/permissions';
import { sendLog } from '../../functions/ticketFlow';
import { config } from '../../core/config';

/* ---------------------------- /ticket setup-panel ------------------------- */

const setupPanelOptions = {
	type: createStringOption({
		description: 'Type of the panel',
		required: true,
		choices: [
			{ name: 'buttons', value: 'buttons' },
			{ name: 'dropdown', value: 'dropdown' },
		],
	}),
	channel: createChannelOption({
		description: 'Channel to send ticket-panel.',
		required: true,
		channel_types: [0],
	}),
};

@Declare({ name: 'setup-panel', description: 'Setup ticket panel.' })
@Options(setupPanelOptions)
export class TicketSetupPanelCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof setupPanelOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (config.DISABLE_COMMANDS.DISABLED.includes('ticket')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!requireAdmin(ctx)) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		if (!ctx.guildId) return;

		const data = await TicketDB.findOne({ guildID: ctx.guildId }).lean();

		if (!data?.tickets.length) {
			await ctx.write({ content: 'No ticket panel found in this server.', flags: 64 });
			return;
		}

		const target = ctx.options.channel;

		if (!target.isTextable()) {
			await ctx.write({ content: 'That channel cannot receive messages.', flags: 64 });
			return;
		}

		if (ctx.options.type === 'buttons') {
			const rows: ActionRow<Button>[] = [];
			let current = new ActionRow<Button>();

			for (const ticket of data.tickets) {
				if (!ticket.ticketEmoji) continue;

				current.addComponents(
					new Button()
						.setCustomId(ticket.customID)
						.setEmoji(ticket.ticketEmoji)
						.setLabel(ticket.ticketName)
						.setStyle(buttonStyle(ticket.ticketStyle)),
				);

				if (current.components.length === 5) {
					rows.push(current);
					current = new ActionRow<Button>();
				}
			}

			if (current.components.length > 0) rows.push(current);

			const panel = client.embeds.Tickets.MULTI_BUTTONS_TICKETS;

			const embed = new Embed()
				.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR))
				.setTitle(template(panel.Title, { botName: config.BOT_CONFIG.NAME }))
				.setDescription(
					template(panel.Description, {
						ticketPanel: data.tickets
							.map(
								(ticket) =>
									`**${ticket.ticketName}**\n${ticket.ticketDescription}\n${panel.messagePanel} ${ticket.ticketEmoji}`,
							)
							.join('\n\n'),
					}),
				)
				.setFooter({ text: template(panel.Footer, { botName: config.BOT_CONFIG.NAME }) })
				.setTimestamp();

			if (panel.Banner) embed.setImage(panel.Banner);

			await target.messages.write({ embeds: [embed], components: rows });
			await ctx.write({ content: `Panel sent correctly to <#${target.id}>!`, flags: 64 });
			return;
		}

		const options = data.tickets.map((ticket) => ({
			label: ticket.ticketName,
			value: ticket.customID,
			description: ticket.ticketDescription,
			...(ticket.ticketEmoji ? { emoji: { name: ticket.ticketEmoji } } : {}),
		}));

		const menu = new StringSelectMenu()
			.setCustomId('ticketDropdown')
			.setValuesLength({ max: 1 })
			.addOption(options);

		const panel = client.embeds.Tickets.DROPDOWN_TICKET_PANEL;

		const embed = new Embed()
			.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR))
			.setTitle(template(panel.Title, { botName: config.BOT_CONFIG.NAME }))
			.setDescription(
				template(panel.Description, {
					ticketPanel: data.tickets
						.map(
							(ticket) =>
								`**${ticket.ticketName}**\n${ticket.ticketDescription}\n${panel.messagePanel} ${ticket.ticketEmoji}`,
						)
						.join('\n\n'),
				}),
			)
			.setFooter({ text: template(panel.Footer, { botName: config.BOT_CONFIG.NAME }) })
			.setTimestamp();

		if (panel.Banner) embed.setImage(panel.Banner);

		await target.messages.write({ embeds: [embed], components: [new ActionRow().addComponents(menu)] });
		await ctx.write({ content: `Panel sent correctly to <#${target.id}>!`, flags: 64 });
	}
}

/* ---------------------------- /ticket rename ------------------------------ */

const renameOptions = {
	'new-name': createStringOption({
		description: 'The new name of the ticket channel',
		required: true,
	}),
};

@Declare({ name: 'rename', description: 'Rename a ticket channel' })
@Options(renameOptions)
export class TicketRenameCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof renameOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (!hasRoleId(ctx, config.TICKET.SUPPORT_ROLE)) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		if (!config.TICKET.LOGS_SYSTEM) {
			await ctx.write({ content: client.language.Tickets.NoPerms, flags: 64 });
			return;
		}

		const channelId = ctx.channelId;
		const channel = await ctx.channel();

		if (!channel.isGuild()) {
			await ctx.write({ content: client.language.Tickets.NoPerms, flags: 64 });
			return;
		}

		await ctx.client.channels.edit(channelId, { name: ctx.options['new-name'] }, { guildId: ctx.guildId });

		await ctx.write({
			content: template(client.language.Tickets.TicketRenamed, {
				rename: ctx.options['new-name'],
			}),
		});

		const target = client.cache.channels?.get(channelId);
		void target;
	}
}

/* ------------------------ /ticket create-category ------------------------- */

const createCategoryOptions = {
	'category-name': createStringOption({ description: 'Name of the category', required: true }),
	'category-id': createStringOption({
		description: 'Identificator of the category (NOT THE CATEGORY CHANNEL)',
		required: true,
	}),
	'category-description': createStringOption({
		description: 'Category Description (Ticket Panel Description)',
		required: true,
	}),
	'category-button-emoji': createStringOption({ description: 'Category Button Emoji.', required: true }),
	'category-button-style': createStringOption({
		description: 'DANGER | SUCCESS | PRIMARY | SECONDARY',
		required: true,
		choices: [
			{ name: 'Danger', value: '4' },
			{ name: 'Success', value: '3' },
			{ name: 'Primary', value: '1' },
			{ name: 'Secondary', value: '2' },
		],
	}),
	'category-category': createChannelOption({
		description: 'Category to open tickets.',
		required: true,
		channel_types: [4],
	}),
	'category-support-role-1': createRoleOption({ description: 'Support role 1.', required: true }),
	'category-support-role-2': createRoleOption({ description: 'Support role 2. (OPTIONAL)' }),
	'category-support-role-3': createRoleOption({ description: 'Support role 3. (OPTIONAL)' }),
};

@Declare({ name: 'create-category', description: 'Create category.' })
@Options(createCategoryOptions)
export class TicketCreateCategoryCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof createCategoryOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (config.DISABLE_COMMANDS.DISABLED.includes('ticket')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!requireAdmin(ctx)) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		if (!ctx.guildId) return;

		const customID = ctx.options['category-id'];
		const name = ctx.options['category-name'];
		const description = ctx.options['category-description'];
		const emoji = ctx.options['category-button-emoji'];
		const style = ctx.options['category-button-style'];
		const category = ctx.options['category-category'];
		const role1 = ctx.options['category-support-role-1'] ?? {
			id: config.TICKET.SUPPORT_ROLE,
		};
		const role2 = ctx.options['category-support-role-2'];
		const role3 = ctx.options['category-support-role-3'];

		const roles = [role1.id, role2?.id ?? role1.id, role3?.id ?? role1.id];
		const unique = [...new Set(roles)];

		const entry = {
			customID,
			ticketName: name,
			ticketDescription: description,
			ticketCategory: category.id,
			ticketEmoji: emoji,
			ticketStyle: style,
			ticketRoles: unique,
		};

		const existing = await TicketDB.findOne({ guildID: ctx.guildId }).lean();

		if (existing?.tickets.some((ticket) => ticket.customID === customID)) {
			await ctx.write({ content: `Category ${customID} already exists`, flags: 64 });
			return;
		}

		await TicketDB.findOneAndUpdate(
			{ guildID: ctx.guildId },
			{ $push: { tickets: entry } },
			{ upsert: true, setDefaultsOnInsert: true },
		);

		const embed = new Embed()
			.setTitle(`${config.BOT_CONFIG.NAME} | Tickets`)
			.setDescription(
				[
					`Category with ID **${customID}** has been created successfully!`,
					'',
					'**Category Info**',
					`Category Name: ${name}`,
					`Dropdown Description: ${description}`,
					`Category Roles: ${unique.map((roleId) => `<@&${roleId}>`).join(', ')}`,
					`Button Panel Style: ${style}`,
					`Emoji Panel Button: ${emoji}`,
				].join('\n'),
			)
			.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR));

		await ctx.write({ embeds: [embed] });
	}
}

/* ------------------------ /ticket delete-category ------------------------- */

const categoryIdOptions = {
	'category-id': createStringOption({ description: 'Ticket category ID.', required: true }),
};

@Declare({ name: 'delete-category', description: 'Delete a specific category.' })
@Options(categoryIdOptions)
export class TicketDeleteCategoryCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof categoryIdOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (!requireAdmin(ctx)) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		if (!ctx.guildId) return;

		const customID = ctx.options['category-id'];
		const data = await TicketDB.findOne({ guildID: ctx.guildId }).lean();

		if (!data) {
			await ctx.write({ content: 'No ticket panel found in this server.', flags: 64 });
			return;
		}

		if (!data.tickets.some((ticket) => ticket.customID === customID)) {
			await ctx.write({ content: 'No ticket panel created with that name was found.', flags: 64 });
			return;
		}

		await TicketDB.updateOne({ guildID: ctx.guildId }, { $pull: { tickets: { customID } } });

		const embed = new Embed()
			.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR))
			.setTitle(`${config.BOT_CONFIG.NAME} | Tickets`)
			.setDescription('The panel has been successfully **removed**');

		await ctx.write({ embeds: [embed] });
	}
}

/* ------------------------- /ticket list-category -------------------------- */

@Declare({ name: 'list-category', description: 'Panel Category list' })
@Options({})
export class TicketListCategoryCommand extends SubCommand {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (!requireAdmin(ctx)) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		if (!ctx.guildId) return;

		const data = await TicketDB.findOne({ guildID: ctx.guildId }).lean();

		if (!data?.tickets.length) {
			const embed = new Embed()
				.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR))
				.setTitle(`${config.BOT_CONFIG.NAME} | Tickets`)
				.setDescription('No panels created');

			await ctx.write({ embeds: [embed] });
			return;
		}

		const lines: string[] = [];

		for (const ticket of data.tickets) {
			lines.push(
				`**Category info with ID:** ${ticket.customID}`,
				`Category Name: ${ticket.ticketName}`,
				`Dropdown Panel Description: ${ticket.ticketDescription}`,
				`Category Emoji: ${ticket.ticketEmoji}`,
				`Category Style: ${ticket.ticketStyle}`,
				`Category Roles: ${ticket.ticketRoles.map((roleId) => `<@&${roleId}>`).join(', ') || 'No specified!'}`,
				`Category: ${ticket.ticketCategory}`,
				'',
			);
		}

		const embed = new Embed()
			.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR))
			.setTitle(`${config.BOT_CONFIG.NAME} | Ticket - Category List`)
			.setDescription(lines.join('\n'));

		await ctx.write({ embeds: [embed] });
	}
}

/* ------------------------------ /ticket alert ----------------------------- */

const alertOptions = {
	user: createUserOption({ description: 'User to notify', required: true }),
};

@Declare({ name: 'alert', description: 'Notify a user that their ticket will be closed.' })
@Options(alertOptions)
export class TicketAlertCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof alertOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (!hasRoleId(ctx, config.TICKET.SUPPORT_ROLE)) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		const user = ctx.options.user;

		await user
			.write({
				content: template(client.language.Tickets.AlertMessage, { user: `<@${user.id}>` }),
			})
			.catch(async () => {
				await ctx.write({ content: 'This user has closed direct messages.', flags: 64 });
			});

		await ctx.write({
			content: template(client.language.Tickets.AlertSent, { user: `<@${user.id}>` }),
			flags: 64,
		});

		await sendLog(ctx.client as never, {
			title: `${config.BOT_CONFIG.NAME} | Ticket Alert`,
			description: `**Staff**: <@${ctx.author.id}>\n**Notified**: <@${user.id}>`,
		});
	}
}

/* -------------------------------- /ticket --------------------------------- */

@Declare({
	name: 'ticket',
	description: 'Setup ticket panel.',
	props: { category: 'Tickets' },
})
@Options([
	TicketSetupPanelCommand,
	TicketRenameCommand,
	TicketCreateCategoryCommand,
	TicketDeleteCategoryCommand,
	TicketListCategoryCommand,
	TicketAlertCommand,
])
export default class TicketCommand extends Command {}
