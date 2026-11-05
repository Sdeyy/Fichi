import { Command, Declare, Options, createStringOption, type CommandContext } from 'seyfert';
import Economy from '../../data/models/economy';
import { bot } from '../../core/bot';
import { template } from '../../core/ui';

const options = {
	amount: createStringOption({
		description: "Amount to withdraw (or 'all' for everything).",
		required: true,
	}),
};

@Declare({
	name: 'withdraw',
	description: 'Withdraw money from bank to wallet.',
	props: { category: 'Economy', cooldown: '1m' },
})
@Options(options)
export default class WithdrawCommand extends Command {
	override async run(ctx: CommandContext<typeof options>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('withdraw')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const data =
			(await Economy.findOne({ userID: ctx.author.id }).lean()) ??
			(await Economy.create({ userID: ctx.author.id })).toObject();

		const raw = ctx.options.amount.trim();

		let amount: number;

		if (raw.toLowerCase() === 'all') {
			amount = data.bank ?? 0;
		} else {
			amount = Number.parseInt(raw, 10);

			if (Number.isNaN(amount) || amount <= 0) {
				await ctx.write({ content: client.language.Economy.WithdrawInvalidAmount, flags: 64 });
				return;
			}
		}

		if (amount > (data.bank ?? 0)) {
			await ctx.write({ content: client.language.Economy.WithdrawNotEnoughBank, flags: 64 });
			return;
		}

		await Economy.updateOne({ userID: ctx.author.id }, { $inc: { money: amount, bank: -amount } });

		await ctx.write({
			content: template(client.language.Economy.WithdrawSuccess, { amount }),
			flags: 64,
		});
	}
}
