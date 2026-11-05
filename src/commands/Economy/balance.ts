import { Command, Declare, Embed, type CommandContext } from 'seyfert';
import Economy from '../../data/models/economy';
import { bot } from '../../core/bot';
import { resolveColor } from '../../core/ui';

@Declare({
	name: 'balance',
	description: 'See all the money you got.',
	props: { category: 'Economy', cooldown: '1m' },
})
export default class BalanceCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('balance')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const target = ctx.resolver.get('user')?.user ?? ctx.author;

		if (target.bot) {
			await ctx.write({ content: client.language.Economy.BotsMoney });
			return;
		}

		const data =
			(await Economy.findOne({ userID: target.id }).lean()) ??
			(await Economy.create({ userID: target.id })).toObject();

		const embed = new Embed()
			.setAuthor({ name: target.username, iconUrl: target.avatarURL() })
			.setDescription(
				[
					`Money: ${data.money}`,
					`Bank: ${data.bank}`,
					'',
					'Use `/profile` for more details.',
				].join('\n'),
			)
			.setColor(resolveColor('Aqua'));

		await ctx.write({ embeds: [embed] });
	}
}
