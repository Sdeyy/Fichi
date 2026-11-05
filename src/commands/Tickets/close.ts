import { Command, Declare, Embed, type CommandContext } from 'seyfert';
import { bot } from '../../core/bot';
import { resolveColor, template } from '../../core/ui';
import { hasRoleId } from '../../core/permissions';
import { config } from '../../core/config';
import { sendLog } from '../../functions/ticketFlow';
import Statistics from '../../data/models/statistics';

@Declare({
	name: 'close',
	description: 'Close ticket.',
	props: { category: 'Tickets' },
})
export default class TicketCloseCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (config.DISABLE_COMMANDS.DISABLED.includes('close')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (config.TICKET.CLOSE_ONLY_SUPPORT && !hasRoleId(ctx, config.TICKET.SUPPORT_ROLE)) {
			await ctx.write({ content: 'Only the Staff Team can close the tickets.' });
			return;
		}

		const channel = await ctx.channel();

		if (!channel.isGuild() || !('topic' in channel) || !channel.topic) {
			const embed = new Embed()
				.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR))
				.setDescription(template(client.language.Tickets.NoTicket, { user: `<@${ctx.author.id}>` }));

			await ctx.write({ embeds: [embed], flags: 64 });
			return;
		}

		const embed = new Embed()
			.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR))
			.setDescription(template(client.language.Tickets.TicketDeleted, { user: `<@${ctx.author.id}>` }));

		await ctx.write({ embeds: [embed] });

		await sendLog(client, {
			title: `${config.BOT_CONFIG.NAME} | Ticket Closed`,
			description: [
				`**User**: <@${ctx.author.id}>`,
				'**Action**: Closed a ticket',
				`**Ticket Name**: ${'name' in channel ? channel.name : ctx.channelId}`,
				`**Ticket Owner**: <@${channel.topic}>`,
			].join('\n'),
		});

		if (ctx.guildId) {
			await Statistics.findOneAndUpdate(
				{ guildID: ctx.guildId },
				{ $inc: { ticketsOpen: -1 } },
				{ upsert: true, setDefaultsOnInsert: true },
			);
		}

		setTimeout(() => {
			void channel.delete().catch(() => null);
		}, 5000);
	}
}
