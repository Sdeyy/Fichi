import { ComponentCommand, type ComponentContext } from 'seyfert';
import { bot } from '../../core/bot';
import { config } from '../../core/config';
import { hasRoleId } from '../../core/permissions';
import { ActionRow, Button, Embed } from 'seyfert';
import { buttonStyle, resolveColor } from '../../core/ui';

/**
 * `Ticket-Transcript` — asks whether the transcript should be sent to the owner.
 */
export default class TicketTranscriptButton extends ComponentCommand {
	componentType = 'Button' as const;

	override customId = 'Ticket-Transcript';

	override async run(ctx: ComponentContext<'Button'>): Promise<void> {
		if (!ctx.guildId) return;

		const client = bot(ctx.client);

		if (!hasRoleId(ctx, config.TICKET.SUPPORT_ROLE)) return;

		const channel = ctx.interaction.channel;

		if (!channel?.isTextable()) return;

		await ctx.deferUpdate();

		const yes = new Button()
			.setCustomId('TR-YES')
			.setLabel('Yes')
			.setStyle(buttonStyle('success'));

		const cancel = new Button()
			.setCustomId('TR-CN')
			.setLabel('Cancel')
			.setStyle(buttonStyle('secondary'));

		const no = new Button()
			.setCustomId('TR-NO')
			.setLabel('No')
			.setStyle(buttonStyle('danger'));

		await channel.messages.write({
			embeds: [
				new Embed()
					.setDescription('Do you want to send the ticket to the user?')
					.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR)),
			],
			components: [new ActionRow<Button>().addComponents(yes, cancel, no)],
		});
	}
}
