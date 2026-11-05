import { Command, Declare, type CommandContext } from 'seyfert';
import Economy from '../../data/models/economy';
import { bot } from '../../core/bot';
import { template } from '../../core/ui';

@Declare({
	name: 'work',
	description: 'Work and get money.',
	props: { category: 'Economy', cooldown: '3m' },
})
export default class WorkCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('work')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const works = client.config.ECONOMY.WORKS;
		const money = Math.floor(Math.random() * 800) + 200;
		const work = works[Math.floor(Math.random() * works.length)] ?? 'Freelancer';

		await Economy.findOneAndUpdate(
			{ userID: ctx.author.id },
			{
				$inc: { money, totalEarned: money },
				$set: { work: String(Date.now()) },
			},
			{ upsert: true, setDefaultsOnInsert: true },
		);

		await ctx.write({
			content: template(client.language.Economy.WorkSuccess, { work, money }),
		});
	}
}
