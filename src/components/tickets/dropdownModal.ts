import { ModalCommand, type ModalContext } from 'seyfert';
import TicketDB from '../../data/models/ticketDB';
import { bot } from '../../core/bot';
import { createTicketChannel } from '../../functions/ticketFlow';
import { Embed } from 'seyfert';
import { resolveColor, template } from '../../core/ui';

/**
 * Creates the ticket from the dropdown flow.
 *
 * The dropdown opens a modal with the prefix `ticketReasonModal-<customID>`, so
 * the category is resolved from the suffix.
 */
export default class TicketDropdownModal extends ModalCommand {
	override customId = /^ticketReasonModal-[\w-]+$/;

	override async run(ctx: ModalContext): Promise<void> {
		if (!ctx.guildId) return;

		const client = bot(ctx.client);
		const customID = ctx.customId.replace('ticketReasonModal-', '');
		const data = await TicketDB.findOne({ guildID: ctx.guildId }).lean();
		const category = data?.tickets.find((ticket) => ticket.customID === customID);

		if (!category) {
			await ctx.write({ content: 'No ticket panel found.', flags: 64 });
			return;
		}

		const reason = ctx.getInputValue('ticketreason') ?? '';

		await ctx.write({
			embeds: [
				new Embed()
					.setColor(resolveColor(client.config.BOT_CONFIG.EMBED_COLOR))
					.setDescription(client.language.Tickets.TicketCreating),
			],
			flags: 64,
		});

		try {
			const channel = await createTicketChannel({
				client,
				guildId: ctx.guildId,
				userId: ctx.author.id,
				category,
				reason: typeof reason === 'string' ? reason : reason.join(', '),
			});

			await ctx.editResponse({
				embeds: [
					new Embed()
						.setColor(resolveColor(client.config.BOT_CONFIG.EMBED_COLOR))
						.setDescription(
							template(client.language.Tickets.TicketCreated, {
								channel: `<#${channel.id}>`,
							}),
						),
				],
				flags: 64,
			});
		} catch (error) {
			await ctx.editResponse({
				content: `Could not create the ticket: ${(error as Error).message}`,
				flags: 64,
			});
		}
	}
}
