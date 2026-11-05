import { Command, Declare, Options, Embed, createUserOption, type CommandContext } from 'seyfert';
import { bot } from '../../core/bot';
import { resolveColor } from '../../core/ui';
import { hasRoleId } from '../../core/permissions';
import { config } from '../../core/config';
import { sendLog } from '../../functions/ticketFlow';

const options = {
	user: createUserOption({ description: 'user to remove', required: true }),
};

@Declare({
	name: 'remove',
	description: 'remove a user of a ticket',
	props: { category: 'Tickets' },
})
@Options(options)
export default class TicketRemoveCommand extends Command {
	override async run(ctx: CommandContext<typeof options>): Promise<void> {
		const client = bot(ctx.client);

		if (config.DISABLE_COMMANDS.DISABLED.includes('remove')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!ctx.guildId) return;

		if (!hasRoleId(ctx, config.TICKET.SUPPORT_ROLE)) {
			await ctx.write({ content: client.language.NO_PERMSUSER, flags: 64 });
			return;
		}

		const user = ctx.options.user;
		const channelId = ctx.channelId;
		const channel = await ctx.channel();

		await ctx.client.channels.editOverwrite(
			channelId,
			user.id,
			{ type: 1, deny: ['ViewChannel'] },
			{ guildId: ctx.guildId, reason: `Ticket member removed by ${ctx.author.username}` },
		);

		const embed = new Embed()
			.setTitle(`${config.BOT_CONFIG.NAME} | User Removed`)
			.setDescription(`Staff:\n <@${ctx.author.id}>\nMember Removed:\n<@${user.id}>`)
			.setColor(resolveColor('Red'))
			.setTimestamp();

		await ctx.write({ embeds: [embed] });

		await sendLog(client, {
			title: `${config.BOT_CONFIG.NAME} | User Removed`,
			color: 'Red',
			description: [
				`**User**: <@${ctx.author.id}>`,
				'**Action**: Remove a Member',
				`**Member Removed**: <@${user.id}>`,
				`**Ticket Name**: ${'name' in channel ? channel.name : channelId}`,
			].join('\n'),
		});
	}
}
