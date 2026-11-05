import { ComponentCommand, type ComponentContext } from 'seyfert';
import { bot } from '../../core/bot';
import { config } from '../../core/config';
import { hasRoleId } from '../../core/permissions';
import { sendLog } from '../../functions/ticketFlow';
import { Embed } from 'seyfert';
import { resolveColor } from '../../core/ui';

/**
 * `Ticket-Delete` — deletes the ticket channel after a short delay.
 */
export default class TicketDeleteButton extends ComponentCommand {
	componentType = 'Button' as const;

	override customId = 'Ticket-Delete';

	override async run(ctx: ComponentContext<'Button'>): Promise<void> {
		if (!ctx.guildId) return;

		const client = bot(ctx.client);

		if (!hasRoleId(ctx, config.TICKET.SUPPORT_ROLE)) return;

		await ctx.deferUpdate();

		const channel = ctx.interaction.channel;

		if (!channel) return;

		if (channel.isTextable()) {
			await channel.messages.write({
				embeds: [
					new Embed()
						.setDescription('Eliminando ticket en 5 segundos...')
						.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR)),
				],
			});
		}

		await sendLog(client, {
			title: `${config.BOT_CONFIG.NAME} | Ticket Closed`,
			description: [
				`**User**: <@${ctx.author.id}>`,
				'**Action**: Close a ticket',
				`**Ticket Name**: ${'name' in channel ? channel.name : ctx.channelId}`,
				`**Ticket Owner**: <@${'topic' in channel ? channel.topic : 'unknown'}>`,
			].join('\n'),
		});

		setTimeout(() => {
			void channel.delete().catch(() => null);
		}, 5000);
	}
}
