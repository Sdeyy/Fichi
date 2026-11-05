import { ComponentCommand, type ComponentContext } from 'seyfert';
import { bot } from '../../core/bot';
import { config } from '../../core/config';
import { hasRoleId } from '../../core/permissions';
import { sendLog } from '../../functions/ticketFlow';
import { Embed } from 'seyfert';
import { resolveColor } from '../../core/ui';

/**
 * `Ticket-Open` — reopens a closed ticket (restores access to the owner).
 */
export default class TicketOpenButton extends ComponentCommand {
	componentType = 'Button' as const;

	override customId = 'Ticket-Open';

	override async run(ctx: ComponentContext<'Button'>): Promise<void> {
		if (!ctx.guildId) return;

		const client = bot(ctx.client);

		if (!hasRoleId(ctx, config.TICKET.SUPPORT_ROLE)) return;

		const channel = ctx.interaction.channel;

		if (!channel || !('permissionOverwrites' in channel)) return;

		const ownerId = 'topic' in channel ? channel.topic : undefined;

		if (ownerId) {
			await channel.permissionOverwrites.edit(ownerId, { type: 1, allow: ['ViewChannel'] });
		}

		await ctx.deferUpdate();

		if (channel.isTextable()) {
			await channel.messages.write({
				embeds: [
					new Embed()
						.setDescription(`The ticket was reopened by <@${ctx.author.id}>`)
						.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR)),
				],
			});
		}

		await ctx.message.delete().catch(() => null);

		await sendLog(client, {
			title: `${config.BOT_CONFIG.NAME} | Ticket ReOpen`,
			description: [
				`**User**: <@${ctx.author.id}>`,
				'**Action**: Re-Open a ticket',
				`**Ticket Name**: ${'name' in channel ? channel.name : ctx.channelId}`,
				`**Ticket Owner**: <@${ownerId ?? 'unknown'}>`,
			].join('\n'),
		});
	}
}
