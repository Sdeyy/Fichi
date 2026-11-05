import { Command, Declare, Options, createIntegerOption, createUserOption, type CommandContext } from 'seyfert';
import Economy from '../../data/models/economy';
import { bot } from '../../core/bot';
import { requireAdmin } from '../../core/permissions';
import { template } from '../../core/ui';

const options = {
	user: createUserOption({ description: 'User to remove money from.', required: true }),
	amount: createIntegerOption({ description: 'Amount to remove.', required: true }),
};

@Declare({
	name: 'remove-money',
	description: 'Remove money from a user (Admin only).',
	props: { category: 'Economy' },
})
@Options(options)
export default class RemoveMoneyCommand extends Command {
	override async run(ctx: CommandContext<typeof options>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('remove-money')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!requireAdmin(ctx)) {
			await ctx.write({
				content: 'You need Administrator permission to use this command!',
				flags: 64,
			});
			return;
		}

		const { user, amount } = ctx.options;

		if (amount <= 0) {
			await ctx.write({ content: client.language.Economy.AmountMustBePositive, flags: 64 });
			return;
		}

		const data =
			(await Economy.findOne({ userID: user.id }).lean()) ??
			(await Economy.create({ userID: user.id })).toObject();

		if ((data.money ?? 0) < amount) {
			await ctx.write({ content: client.language.Economy.UserNotEnoughMoney, flags: 64 });
			return;
		}

		await Economy.updateOne({ userID: user.id }, { $inc: { money: -amount } });

		await ctx.write({
			content: template(client.language.Economy.RemoveMoneySuccess, {
				amount,
				userTag: user.username,
			}),
			flags: 64,
		});
	}
}
