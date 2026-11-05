import { Command, SubCommand, Declare, Options, type CommandContext } from 'seyfert';
import {
	createStringOption,
	createNumberOption,
	createRoleOption,
} from 'seyfert';
import Shop from '../../data/models/shop';
import { bot } from '../../core/bot';
import { requireAdmin } from '../../core/permissions';
import { template } from '../../core/ui';

/* ----------------------------- /shop-manage add --------------------------- */

const addOptions = {
	itemid: createStringOption({ description: 'Unique ID for the item.', required: true }),
	name: createStringOption({ description: 'Name of the item.', required: true }),
	description: createStringOption({ description: 'Description of the item.', required: true }),
	price: createNumberOption({ description: 'Price in coins.', required: true }),
	type: createStringOption({
		description: 'Type: role.',
		required: true,
		choices: [{ name: 'Role', value: 'role' }],
	}),
	value: createRoleOption({ description: 'Role.', required: true }),
};

@Declare({ name: 'add', description: 'Add an item to the shop.' })
@Options(addOptions)
export class ShopManageAddCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof addOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('shop-manage')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!requireAdmin(ctx)) {
			await ctx.write({ content: client.language.NO_PERMSUSER, flags: 64 });
			return;
		}

		const { itemid, name, description, price, type, value } = ctx.options;

		if (await Shop.exists({ itemID: itemid })) {
			await ctx.write({ content: client.language.Economy.ShopItemExists });
			return;
		}

		await Shop.create({
			itemID: itemid,
			name,
			description,
			price,
			type,
			value: value.id,
		});

		await ctx.write({
			content: template(client.language.Economy.ShopItemAdded, { itemName: name }),
		});
	}
}

/* --------------------------- /shop-manage remove -------------------------- */

const removeOptions = {
	itemid: createStringOption({ description: 'ID of the item to remove.', required: true }),
};

@Declare({ name: 'remove', description: 'Remove an item from the shop.' })
@Options(removeOptions)
export class ShopManageRemoveCommand extends SubCommand {
	override async run(ctx: CommandContext<typeof removeOptions>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('shop-manage')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!requireAdmin(ctx)) {
			await ctx.write({ content: client.language.NO_PERMSUSER, flags: 64 });
			return;
		}

		const removed = await Shop.findOneAndDelete({ itemID: ctx.options.itemid }).lean();

		if (!removed) {
			await ctx.write({ content: 'Item not found!' });
			return;
		}

		await ctx.write({
			content: template(client.language.Economy.ShopItemRemoved, { itemName: removed.name }),
		});
	}
}

/* ------------------------------ /shop-manage ------------------------------ */

@Declare({
	name: 'shop-manage',
	description: 'Manage shop items (Admin only).',
	props: { category: 'Economy' },
})
@Options([ShopManageAddCommand, ShopManageRemoveCommand])
export default class ShopManageCommand extends Command {}
