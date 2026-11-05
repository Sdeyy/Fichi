import { Command, Declare, Embed, type CommandContext } from 'seyfert';
import Economy from '../../data/models/economy';
import { bot } from '../../core/bot';
import { resolveColor } from '../../core/ui';

@Declare({
	name: 'profile',
	description: "View your or another user's economy profile.",
	props: { category: 'Economy', cooldown: '1m' },
})
export default class ProfileCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('profile')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const user = ctx.resolver.get('user')?.user ?? ctx.author;

		if (user.bot) {
			await ctx.write({ content: client.language.Economy.BotsMoney });
			return;
		}

		const data =
			(await Economy.findOne({ userID: user.id }).lean()) ??
			(await Economy.create({ userID: user.id })).toObject();

		const embed = new Embed()
			.setAuthor({ name: `${user.username}'s Profile`, iconUrl: user.avatarURL() })
			.setColor(resolveColor('Green'))
			.addFields(
				{ name: 'Wallet', value: `${data.money} coins`, inline: false },
				{ name: 'Bank', value: `${data.bank} coins`, inline: false },
				{ name: 'Total Earned', value: `${data.totalEarned} coins`, inline: false },
				{ name: 'Total Spent', value: `${data.totalSpent} coins`, inline: false },
				{
					name: 'Inventory',
					value: data.inventory.length > 0 ? `${data.inventory.length} items` : 'Empty',
					inline: false,
				},
			);

		await ctx.write({ embeds: [embed] });
	}
}
