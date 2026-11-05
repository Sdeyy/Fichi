import { ComponentCommand, type ComponentContext } from 'seyfert';
import { bot } from '../../core/bot';
import { config } from '../../core/config';
import { hasRoleId } from '../../core/permissions';
import { ActionRow, Button, Embed } from 'seyfert';
import { buttonStyle, resolveColor } from '../../core/ui';

/**
 * `Ticket-Open-Close` — shows the close options (transcript / delete).
 */
export default class TicketCloseButton extends ComponentCommand {
	componentType = 'Button' as const;

	override customId = 'Ticket-Open-Close';

	override async run(ctx: ComponentContext<'Button'>): Promise<void> {
		if (!ctx.guildId) return;

		const client = bot(ctx.client);

		if (!hasRoleId(ctx, config.TICKET.SUPPORT_ROLE)) return;

		const channel = ctx.interaction.channel;

		if (!channel || !('permissionOverwrites' in channel)) return;

		const ownerId = 'topic' in channel ? channel.topic : undefined;

		if (ownerId) {
			await channel.permissionOverwrites.edit(ownerId, {
				type: 1,
				deny: ['ViewChannel'],
			});
		}

		await ctx.deferUpdate();

		const transcript = client.buttons.TICKETS_GENERAL_BUTTONS.Transcript;
		const del = client.buttons.TICKETS_GENERAL_BUTTONS.Delete;

		const row = new ActionRow<Button>().addComponents(
			new Button()
				.setCustomId('Ticket-Transcript')
				.setLabel(transcript.Label)
				.setEmoji(transcript.Emoji)
				.setStyle(buttonStyle(transcript.Style)),
			new Button()
				.setCustomId('Ticket-Delete')
				.setLabel(del.Label)
				.setEmoji(del.Emoji)
				.setStyle(buttonStyle(del.Style)),
		);

		const embed = new Embed()
			.setDescription(client.language.Tickets.WhatDoYouWant)
			.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR));

		if (channel.isTextable()) {
			await channel.messages.write({ embeds: [embed], components: [row] });
		}
	}
}
