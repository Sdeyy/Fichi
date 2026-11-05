import { ComponentCommand, type ComponentContext } from 'seyfert';
import TicketDB from '../../data/models/ticketDB';
import { bot } from '../../core/bot';
import { isBlacklisted, hasOpenTicket, reasonModal } from '../../functions/ticketFlow';

/**
 * Handles the ticket **buttons** of the panel.
 *
 * The custom id of each panel button is the `customID` of its ticket category,
 * so this component only reacts when a category with that id exists.
 */
export default class TicketPanelButton extends ComponentCommand {
	componentType = 'Button' as const;

	override async filter(ctx: ComponentContext<'Button'>): Promise<boolean> {
		// Internal ticket buttons and transcripts have their own handlers.
		if (ctx.customId.startsWith('Ticket-') || ctx.customId.startsWith('TR-')) {
			return false;
		}

		if (!ctx.guildId) return false;

		const data = await TicketDB.findOne({ guildID: ctx.guildId }).lean();

		return Boolean(data?.tickets.some((ticket) => ticket.customID === ctx.customId));
	}

	override async run(ctx: ComponentContext<'Button'>): Promise<void> {
		if (!ctx.guildId) return;

		const client = bot(ctx.client);
		const data = await TicketDB.findOne({ guildID: ctx.guildId }).lean();
		const category = data?.tickets.find((ticket) => ticket.customID === ctx.customId);

		if (!category) return;

		if (await isBlacklisted(ctx.guildId, ctx.author.id)) {
			await ctx.write({ content: 'You are blacklisted from the tickets', flags: 64 });
			return;
		}

		if (await hasOpenTicket(client, ctx.guildId, ctx.author.id)) {
			await ctx.write({ content: client.language.Tickets.AlreadyOpen, flags: 64 });
			return;
		}

		await ctx.modal(
			reasonModal(
				`panelReasonModal-${category.customID}`,
				client.language.TicketReason.Label,
				client.language.TicketReason.Placeholder,
			),
		);
	}
}
