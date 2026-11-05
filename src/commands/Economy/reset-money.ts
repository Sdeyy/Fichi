import { Command, Declare, Options, createUserOption, type CommandContext } from 'seyfert';
import Economy from '../../data/models/economy';
import { bot } from '../../core/bot';
import { requireAdmin } from '../../core/permissions';
import { template } from '../../core/ui';

const options = {
	user: createUserOption({ description: 'User to reset money.', required: true }),
};

@Declare({
	name: 'reset-money',
	description: "Reset a user's money to default (Admin only).",
	props: { category: 'Economy' },
})
@Options(options)
export default class ResetMoneyCommand extends Command {
	override async run(ctx: CommandContext<typeof options>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('reset-money')) {
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

		const user = ctx.options.user;

		await Economy.findOneAndUpdate(
			{ userID: user.id },
			{
				$set: {
					money: 500,
					bank: 100,
					daily: null,
					work: null,
					inventory: [],
					badges: [],
					totalEarned: 0,
					totalSpent: 0,
				},
			},
			{ upsert: true, setDefaultsOnInsert: true },
		);

		await ctx.write({
			content: template(client.language.Economy.EconomyResetUser, { userTag: user.username }),
			flags: 64,
		});
	}
}
