import { Command, Declare, Options, createUserOption, type CommandContext } from 'seyfert';
import Economy from '../../data/models/economy';
import { bot } from '../../core/bot';
import { template } from '../../core/ui';

const options = {
	user: createUserOption({ description: 'User to rob.', required: true }),
};

@Declare({
	name: 'rob',
	description: 'Attempt to rob another user.',
	props: { category: 'Economy', cooldown: '5m' },
})
@Options(options)
export default class RobCommand extends Command {
	override async run(ctx: CommandContext<typeof options>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('rob')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const target = ctx.options.user;

		if (target.id === ctx.author.id) {
			await ctx.write({ content: "You can't rob yourself!", flags: 64 });
			return;
		}

		if (target.bot) {
			await ctx.write({ content: "You can't rob bots!", flags: 64 });
			return;
		}

		const robber =
			(await Economy.findOne({ userID: ctx.author.id }).lean()) ??
			(await Economy.create({ userID: ctx.author.id })).toObject();

		const victim =
			(await Economy.findOne({ userID: target.id }).lean()) ??
			(await Economy.create({ userID: target.id })).toObject();

		if ((victim.money ?? 0) < 100) {
			await ctx.write({ content: client.language.Economy.RobberyTargetNotEnoughMoney, flags: 64 });
			return;
		}

		void robber;

		const success = Math.random() > 0.5;
		const amount = Math.floor(Math.random() * Math.min(victim.money ?? 100, 500)) + 1;

		if (success) {
			await Economy.updateOne(
				{ userID: ctx.author.id },
				{ $inc: { money: amount, totalEarned: amount }, $set: { daily: String(Date.now()) } },
			);

			await Economy.updateOne({ userID: target.id }, { $inc: { money: -amount } });

			await ctx.write({
				content: template(client.language.Economy.RobberySuccess, {
					targetTag: target.username,
					amount,
				}),
			});
			return;
		}

		const fine = Math.floor(amount / 2);

		await Economy.updateOne(
			{ userID: ctx.author.id },
			{ $inc: { money: -fine }, $set: { daily: String(Date.now()) } },
		);

		await ctx.write({
			content: template(client.language.Economy.RobberyFailed, {
				targetTag: target.username,
				fine,
			}),
		});
	}
}
