import { ComponentCommand, type ComponentContext } from 'seyfert';
import Statistics from '../../data/models/statistics';
import { bot } from '../../core/bot';
import { config } from '../../core/config';
import { hasRoleId } from '../../core/permissions';
import { sendLog } from '../../functions/ticketFlow';
import { ActionRow, Button, Embed, type PermissionStrings } from 'seyfert';
import { buttonStyle, resolveColor, template } from '../../core/ui';

/**
 * Overwrites applied when a ticket is claimed.
 *
 * `type` 0 is a role overwrite and `type` 1 is a member overwrite.
 */
const denyView: PermissionStrings = ['ViewChannel'];

const memberAllow: PermissionStrings = [
	'ViewChannel',
	'SendMessages',
	'AddReactions',
	'AttachFiles',
	'EmbedLinks',
];

const staffAllow: PermissionStrings = [
	'ViewChannel',
	'SendMessages',
	'AddReactions',
	'AttachFiles',
	'EmbedLinks',
	'ManageMessages',
	'ManageChannels',
];

/**
 * `Ticket-Claimed` — claims a ticket for the staff member who presses it.
 */
export default class TicketClaimButton extends ComponentCommand {
	componentType = 'Button' as const;

	override customId = 'Ticket-Claimed';

	override async run(ctx: ComponentContext<'Button'>): Promise<void> {
		if (!ctx.guildId) return;

		const client = bot(ctx.client);

		if (!hasRoleId(ctx, config.TICKET.SUPPORT_ROLE)) return;

		await ctx.deferUpdate();

		const channel = ctx.interaction.channel;

		if (!channel || !('permissionOverwrites' in channel)) return;

		const ownerId = 'topic' in channel ? channel.topic ?? undefined : undefined;

		await Statistics.findOneAndUpdate(
			{ guildID: ctx.guildId },
			{ $inc: { ticketsClaimed: 1 } },
			{ upsert: true, setDefaultsOnInsert: true },
		);

		await channel.permissionOverwrites.edit(ctx.guildId, { type: 0, deny: denyView });

		if (ownerId) {
			await channel.permissionOverwrites.edit(ownerId, { type: 1, allow: memberAllow });
		}

		await channel.permissionOverwrites.edit(ctx.author.id, { type: 1, allow: staffAllow });
		await channel.permissionOverwrites.edit(config.TICKET.SUPPORT_ROLE, { type: 0, deny: denyView });
		await channel.permissionOverwrites.edit(config.TICKET.ADMIN_ROLE, { type: 0, allow: staffAllow });

		const close = client.buttons.TICKETS_GENERAL_BUTTONS.Close;
		const claim = client.buttons.TICKETS_GENERAL_BUTTONS.Claim;

		await ctx.update({
			components: [
				new ActionRow<Button>().addComponents(
					new Button()
						.setCustomId('Ticket-Open-Close')
						.setLabel(close.Label)
						.setEmoji(close.Emoji)
						.setStyle(buttonStyle(close.Style)),
					new Button()
						.setCustomId('Ticket-Claimed')
						.setLabel(claim.Label)
						.setEmoji(claim.Emoji)
						.setStyle(buttonStyle(claim.Style))
						.setDisabled(true),
				),
			],
		});

		if (channel.isTextable()) {
			await channel.messages.write({
				embeds: [
					new Embed()
						.setDescription(
							template(client.language.Tickets.TicketClaimed, {
								user: ctx.author.username,
							}),
						)
						.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR)),
				],
			});
		}

		await sendLog(client, {
			title: `${config.BOT_CONFIG.NAME} | Ticket Claimed`,
			description: [
				`**User**: <@${ctx.author.id}>`,
				'**Action**: Claimed a ticket',
				`**Ticket Name**: ${'name' in channel ? channel.name : ctx.channelId}`,
				`**Ticket Owner**: <@${ownerId ?? 'unknown'}>`,
			].join('\n'),
		});
	}
}
