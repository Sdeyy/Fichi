import { Command, Declare, type CommandContext } from 'seyfert';
import Economy from '../../data/models/economy';
import { bot } from '../../core/bot';
import { requireAdmin } from '../../core/permissions';

@Declare({
	name: 'reset-economy',
	description: 'Reset the entire economy database (Admin only).',
	props: { category: 'Economy' },
})
export default class ResetEconomyCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('reset-economy')) {
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

		await Economy.deleteMany({});

		await ctx.write({ content: client.language.Economy.EconomyReset });
	}
}
