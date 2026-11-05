import { Command, Declare, Options, createStringOption, type CommandContext } from 'seyfert';
import Economy from '../../data/models/economy';
import Shop from '../../data/models/shop';
import { bot } from '../../core/bot';
import { template } from '../../core/ui';

const options = {
	itemid: createStringOption({
		description: 'The ID of the item to buy.',
		required: true,
		autocomplete: async (interaction) => {
			const input = interaction.getInput().toLowerCase();
			const items = await Shop.find({}).limit(25).lean();
			const filtered = items.filter((item) => item.itemID.toLowerCase().startsWith(input));

			await interaction.respond(
				filtered.slice(0, 25).map((item) => ({ name: item.name, value: item.itemID })),
			);
		},
	}),
};

@Declare({
	name: 'buy',
	description: 'Buy an item from the shop.',
	props: { category: 'Economy', cooldown: '1m' },
})
@Options(options)
export default class BuyCommand extends Command {
	override async run(ctx: CommandContext<typeof options>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('buy')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const item = await Shop.findOne({ itemID: ctx.options.itemid }).lean();

		if (!item) {
			await ctx.write({ content: 'Item not found!', flags: 64 });
			return;
		}

		const data =
			(await Economy.findOne({ userID: ctx.author.id }).lean()) ??
			(await Economy.create({ userID: ctx.author.id })).toObject();

		if ((data.money ?? 0) < item.price) {
			await ctx.write({ content: client.language.Economy.NotEnoughMoney, flags: 64 });
			return;
		}

		const update =
			item.type === 'role'
				? { $push: { inventory: item.itemID } }
				: { $push: { badges: item.value } };

		await Economy.updateOne(
			{ userID: ctx.author.id },
			{
				$inc: { money: -item.price, totalSpent: item.price },
				...update,
			},
		);

		if (item.type === 'role' && ctx.guildId) {
			await ctx.client.members.addRole(ctx.guildId, ctx.author.id, item.value).catch(() => null);
		}

		await ctx.write({
			content: template(client.language.Economy.ItemBought, {
				itemName: item.name,
				itemPrice: item.price,
			}),
		});
	}
}
