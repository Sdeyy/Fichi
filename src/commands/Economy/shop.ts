import { Command, Declare, Embed, type CommandContext } from 'seyfert';
import Shop from '../../data/models/shop';
import { bot } from '../../core/bot';
import { resolveColor, trim } from '../../core/ui';

@Declare({
	name: 'shop',
	description: 'View available items in the shop.',
	props: { category: 'Economy', cooldown: '1m' },
})
export default class ShopCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('shop')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const items = await Shop.find({}).lean();

		if (!items.length) {
			await ctx.write({ content: 'The shop is empty!' });
			return;
		}

		const embed = new Embed()
			.setTitle('Shop')
			.setColor(resolveColor('Blurple'))
			.setDescription('Use `/buy <itemID>` to purchase an item.');

		for (const item of items) {
			embed.addFields({
				name: trim(`${item.name} (${item.itemID})`, 256),
				value: trim(
					`${item.description}\nPrice: ${item.price} coins\nType: ${item.type}`,
					1024,
				),
				inline: false,
			});
		}

		await ctx.write({ embeds: [embed] });
	}
}
