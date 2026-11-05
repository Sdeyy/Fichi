import { Command, Declare, Options, createIntegerOption, createUserOption, type CommandContext } from 'seyfert';
import Economy from '../../data/models/economy';
import { bot } from '../../core/bot';
import { requireAdmin } from '../../core/permissions';
import { template } from '../../core/ui';

const options = {
	user: createUserOption({ description: 'User to add money to.', required: true }),
	amount: createIntegerOption({ description: 'Amount to add.', required: true }),
};

@Declare({
	name: 'add-money',
	description: 'Add money to a user (Admin only).',
	props: { category: 'Economy' },
})
@Options(options)
export default class AddMoneyCommand extends Command {
	override async run(ctx: CommandContext<typeof options>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('add-money')) {
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
			await ctx.write({ content: 'Amount must be positive!', flags: 64 });
			return;
		}

		await Economy.findOneAndUpdate(
			{ userID: user.id },
			{ $inc: { money: amount } },
			{ upsert: true, setDefaultsOnInsert: true },
		);

		await ctx.write({
			content: template(client.language.Economy.MoneyAdded, {
				amount,
				userTag: user.username,
			}),
			flags: 64,
		});
	}
}
