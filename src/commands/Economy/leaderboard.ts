import { Command, Declare, Embed, type CommandContext } from 'seyfert';
import Economy from '../../data/models/economy';
import { bot } from '../../core/bot';
import { resolveColor } from '../../core/ui';

interface LeaderboardRow {
	userID: string;
	total: number;
}

@Declare({
	name: 'leaderboard',
	description: 'View the economy leaderboard.',
	props: { category: 'Economy', cooldown: '1m' },
})
export default class EconomyLeaderboardCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('leaderboard')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const rows = await Economy.aggregate<LeaderboardRow>([
			{ $addFields: { total: { $add: ['$money', '$bank'] } } },
			{ $sort: { total: -1 } },
			{ $limit: 10 },
		]);

		const lines: string[] = [];

		for (const [index, row] of rows.entries()) {
			const user = await client.users.fetch(row.userID).catch(() => null);
			lines.push(`${index + 1}. ${user ? user.username : 'Unknown'} - ${row.total ?? 0} coins`);
		}

		const embed = new Embed()
			.setTitle('Economy Leaderboard')
			.setDescription(lines.join('\n') || 'No users found.')
			.setColor(resolveColor('Gold'));

		await ctx.write({ embeds: [embed] });
	}
}
