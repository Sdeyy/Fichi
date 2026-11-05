import { Command, Declare, Options, Embed, createUserOption, type CommandContext } from 'seyfert';
import TicketDB from '../../data/models/ticketDB';
import { bot } from '../../core/bot';
import { resolveColor } from '../../core/ui';
import { hasRoleId } from '../../core/permissions';
import { config } from '../../core/config';
import { sendLog } from '../../functions/ticketFlow';

const options = {
	user: createUserOption({ description: 'user to add', required: true }),
};

@Declare({
	name: 'add',
	description: 'add a member to a ticket',
	props: { category: 'Tickets' },
})
@Options(options)
export default class TicketAddCommand extends Command {
	override async run(ctx: CommandContext<typeof options>): Promise<void> {
		const client = bot(ctx.client);

		if (config.DISABLE_COMMANDS.DISABLED.includes('add')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!ctx.guildId) return;

		if (!hasRoleId(ctx, config.TICKET.SUPPORT_ROLE)) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		const data = await TicketDB.findOne({ guildID: ctx.guildId }).lean();

		if (!data?.tickets.length) {
			await ctx.write({ content: 'You can only use this command on a ticket!', flags: 64 });
			return;
		}

		const channelId = ctx.channelId;
		const user = ctx.options.user;
		const channel = await ctx.channel();

		await ctx.client.channels.editOverwrite(
			channelId,
			user.id,
			{
				type: 1,
				allow: ['AttachFiles', 'ReadMessageHistory', 'SendMessages', 'ViewChannel'],
			},
			{ guildId: ctx.guildId, reason: `Ticket member added by ${ctx.author.username}` },
		);

		const embed = new Embed()
			.setTitle(`${config.BOT_CONFIG.NAME} | User Added`)
			.setDescription(`Staff:\n <@${ctx.author.id}>\n Member Added:\n<@${user.id}>`)
			.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR))
			.setTimestamp();

		await ctx.write({ embeds: [embed] });

		await sendLog(client, {
			title: `${config.BOT_CONFIG.NAME} | Member Added`,
			color: 'Green',
			description: [
				`**User**: <@${ctx.author.id}>`,
				'**Action**: Add a member',
				`**Member Add**: <@${user.id}>`,
				`**Ticket Name**: ${'name' in channel ? channel.name : channelId}`,
			].join('\n'),
		});
	}
}
