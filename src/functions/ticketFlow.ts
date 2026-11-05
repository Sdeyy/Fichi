import {
	ActionRow,
	Button,
	Embed,
	Modal,
	Label,
	TextInput,
	ChannelType,
	PermissionFlagsBits,
	type AllGuildTextableChannels,
	type RESTPostAPIGuildChannelJSONBody,
} from 'seyfert';
import TicketDB, { type TicketItem } from '../data/models/ticketDB';
import Statistics from '../data/models/statistics';
import Blacklist from '../data/models/blacklist';
import { nextTicketNumber } from './tickets';
import { buttonStyle, resolveColor, template } from '../core/ui';
import { config } from '../core/config';
import { logger } from '../core/logger';
import type { BotClient } from '../types/seyfert';

/**
 * Ticket creation pipeline shared by the button panel and the dropdown panel.
 *
 * The original project duplicated this logic three times (buttons, disabled
 * buttons and dropdown) with slightly different behaviour. This module is the
 * single implementation.
 */

const STAFF_PERMISSIONS = [
	PermissionFlagsBits.ViewChannel,
	PermissionFlagsBits.SendMessages,
	PermissionFlagsBits.AddReactions,
	PermissionFlagsBits.AttachFiles,
	PermissionFlagsBits.EmbedLinks,
	PermissionFlagsBits.ManageMessages,
	PermissionFlagsBits.ManageChannels,
] as const;

const USER_PERMISSIONS = [
	PermissionFlagsBits.ViewChannel,
	PermissionFlagsBits.SendMessages,
	PermissionFlagsBits.AddReactions,
	PermissionFlagsBits.AttachFiles,
	PermissionFlagsBits.EmbedLinks,
] as const;

function toBits(permissions: readonly bigint[]): string {
	return permissions.reduce<bigint>((acc, bit) => acc | bit, 0n).toString();
}

/** Modal asking for the ticket reason. */
export function reasonModal(customId: string, label: string, placeholder: string): Modal {
	const input = new TextInput()
		.setCustomId('ticketreason')
		.setStyle(1)
		.setPlaceholder(placeholder)
		.setRequired(true);

	return new Modal()
		.setCustomId(customId)
		.setTitle('Ticket Reason')
		.addComponents(new Label().setLabel(label).setComponent(input));
}

/** Builds the buttons shown inside a freshly created ticket. */
export function ticketControls(client: BotClient): ActionRow<Button> {
	const close = client.buttons.TICKETS_GENERAL_BUTTONS.Close;
	const claim = client.buttons.TICKETS_GENERAL_BUTTONS.Claim;

	const row = new ActionRow<Button>();

	row.addComponents(
		new Button()
			.setCustomId('Ticket-Open-Close')
			.setLabel(close.Label)
			.setEmoji(close.Emoji)
			.setStyle(buttonStyle(close.Style)),
		new Button()
			.setCustomId('Ticket-Claimed')
			.setLabel(claim.Label)
			.setEmoji(claim.Emoji)
			.setStyle(buttonStyle(claim.Style)),
	);

	return row;
}

/** Returns `true` when the user already has an open ticket. */
export async function hasOpenTicket(
	client: BotClient,
	guildId: string,
	userId: string,
): Promise<boolean> {
	if (!config.TICKET.TICKET_LIMIT) return false;

	const channels = client.cache.channels?.values(guildId) ?? [];

	return channels.some((channel) => 'topic' in channel && channel.topic === userId);
}

/** Returns `true` when the user is blacklisted from opening tickets. */
export async function isBlacklisted(guildId: string, userId: string): Promise<boolean> {
	return Boolean(await Blacklist.exists({ guildID: guildId, userID: userId }));
}

export interface CreateTicketOptions {
	client: BotClient;
	guildId: string;
	userId: string;
	category: TicketItem;
	reason?: string;
}

/**
 * Creates the ticket channel, sends the welcome embed and logs the action.
 */
export async function createTicketChannel({
	client,
	guildId,
	userId,
	category,
	reason,
}: CreateTicketOptions): Promise<AllGuildTextableChannels> {
	const guild = await client.guilds.fetch(guildId);
	const number = await nextTicketNumber(guildId);

	const body: RESTPostAPIGuildChannelJSONBody & { type: ChannelType.GuildText } = {
		name: `ticket-${number}`,
		type: ChannelType.GuildText,
		topic: userId,
		parent_id: category.ticketCategory,
		permission_overwrites: [
			{ id: guildId, type: 0, deny: toBits([PermissionFlagsBits.ViewChannel]) },
			{ id: userId, type: 1, allow: toBits(USER_PERMISSIONS) },
			...category.ticketRoles.map((roleId) => ({
				id: roleId,
				type: 0 as const,
				allow: toBits(STAFF_PERMISSIONS),
			})),
		],
	};

	const channel = await guild.channels.create(body);

	if (!channel.isTextable()) {
		throw new Error('The created channel is not text based');
	}

	const templateConfig = config.TICKET.REASON_ENABLED
		? client.embeds.Tickets.TICKET_OPEN_REASON_ENABLED
		: client.embeds.Tickets.TICKET_OPEN_REASON_DISABLED;

	const embed = new Embed()
		.setTitle(template(templateConfig.Title, { botName: config.BOT_CONFIG.NAME }))
		.setDescription(
			template(templateConfig.Description, {
				ticketReason: reason ?? '',
				creationDate: `<t:${Math.round(Date.now() / 1000)}:R>`,
			}),
		)
		.setFooter({ text: template(templateConfig.Footer, { botName: config.BOT_CONFIG.NAME }) })
		.setTimestamp()
		.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR));

	if (config.TICKET.REASON_ENABLED) {
		const icon = guild.iconURL();

		if (icon) embed.setThumbnail(icon);
	}

	const mentions = category.ticketRoles.map((roleId) => `<@&${roleId}>`).join(', ');

	await channel.messages.write({
		content: `<@${userId}>${mentions ? ` | ${mentions}` : ''}`,
		embeds: [embed],
		components: [ticketControls(client)],
	});

	await Statistics.findOneAndUpdate(
		{ guildID: guildId },
		{ $inc: { ticketsOpen: 1 } },
		{ upsert: true, setDefaultsOnInsert: true },
	);

	if (config.TICKET.LOGS_SYSTEM && config.TICKET.LOGS_CHANNEL) {
		await sendLog(client, {
			title: `${config.BOT_CONFIG.NAME} | Ticket Created`,
			description: [
				`**User**: <@${userId}>`,
				'**Action**: Created a ticket',
				`**Panel**: ${category.ticketName}`,
				`**Ticket Name**: ${channel.name}`,
			].join('\n'),
		});
	}

	return channel;
}

/** Sends an embed to the configured log channel. */
export async function sendLog(
	client: BotClient,
	{ title, description, color }: { title: string; description: string; color?: string },
): Promise<void> {
	const channel = config.TICKET.LOGS_CHANNEL
		? client.cache.channels?.get(config.TICKET.LOGS_CHANNEL)
		: undefined;

	if (!channel?.isTextable()) return;

	const embed = new Embed()
		.setTitle(title)
		.setDescription(description)
		.setColor(resolveColor(color ?? config.BOT_CONFIG.EMBED_COLOR));

	await channel.messages.write({ embeds: [embed] }).catch((error: unknown) => logger.error(error));
}

/** Finds the ticket panel configuration of the category a channel belongs to. */
export async function categoryOfChannel(
	guildId: string,
	parentId: string | undefined,
): Promise<TicketItem | undefined> {
	if (!parentId) return undefined;

	const data = await TicketDB.findOne({ guildID: guildId }).lean();

	return data?.tickets.find((ticket) => ticket.ticketCategory === parentId);
}
