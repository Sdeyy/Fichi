import { ComponentCommand, type ComponentContext } from 'seyfert';
import TicketDB from '../../data/models/ticketDB';
import { bot } from '../../core/bot';
import { isBlacklisted, hasOpenTicket, reasonModal } from '../../functions/ticketFlow';

/**
 * Handles the ticket **dropdown** (`ticketDropdown`).
 */
export default class TicketDropdown extends ComponentCommand {
	componentType = 'StringSelect' as const;

	override customId = 'ticketDropdown';

	override async run(ctx: ComponentContext<'StringSelect'>): Promise<void> {
		if (!ctx.guildId) return;

		const client = bot(ctx.client);
		const [selected] = ctx.interaction.values;

		const data = await TicketDB.findOne({ guildID: ctx.guildId }).lean();
		const category = data?.tickets.find((ticket) => ticket.customID === selected);

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

		await ctx.modal(
			reasonModal(
				`ticketReasonModal-${category.customID}`,
				client.language.TicketReason.Label,
				client.language.TicketReason.Placeholder,
			),
		);
	}
}
