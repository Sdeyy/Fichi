import { Command, Declare, type CommandContext } from 'seyfert';
import Economy from '../../data/models/economy';
import { bot } from '../../core/bot';
import { template } from '../../core/ui';

@Declare({
	name: 'daily',
	description: 'Claim a daily reward.',
	props: { category: 'Economy', cooldown: '24h' },
})
export default class DailyCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('daily')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const reward = 350;

		await Economy.findOneAndUpdate(
			{ userID: ctx.author.id },
			{
				$inc: { money: reward, totalEarned: reward },
				$set: { daily: String(Date.now()) },
			},
			{ upsert: true, setDefaultsOnInsert: true },
		);

		await ctx.write({
			content: template(client.language.Economy.DailyAlreadyClaimed, {}),
			flags: 64,
		});
	}
}
