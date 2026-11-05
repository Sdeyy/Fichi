import { ModalCommand, type ModalContext } from 'seyfert';
import TicketDB from '../../data/models/ticketDB';
import { bot } from '../../core/bot';
import { createTicketChannel, isBlacklisted, hasOpenTicket } from '../../functions/ticketFlow';
import { Embed } from 'seyfert';
import { resolveColor, template } from '../../core/ui';

/**
 * Creates the ticket once the reason modal is submitted.
 *
 * The modal's custom id is the ticket category `customID`, which is how the
 * category is resolved again here.
 */
export default class TicketReasonModal extends ModalCommand {
	override customId = /^panelReasonModal-[\w-]+$/;

	override async run(ctx: ModalContext): Promise<void> {
		if (!ctx.guildId) return;

		const client = bot(ctx.client);
		const customID = ctx.customId.replace('panelReasonModal-', '');
		const data = await TicketDB.findOne({ guildID: ctx.guildId }).lean();
		const category = data?.tickets.find((ticket) => ticket.customID === customID);

		if (!category) {
			await ctx.write({ content: 'No ticket panel found.', flags: 64 });
			return;
		}

		if (await isBlacklisted(ctx.guildId, ctx.author.id)) {
			await ctx.write({ content: 'You are blacklisted from the tickets', flags: 64 });
			return;
		}

		if (await hasOpenTicket(client, ctx.guildId, ctx.author.id)) {
			await ctx.write({ content: client.language.Tickets.AlreadyOpen, flags: 64 });
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
