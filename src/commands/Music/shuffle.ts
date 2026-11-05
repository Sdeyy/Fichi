import { Command, Declare, type CommandContext } from 'seyfert';
import { resolveQueue } from '../../functions/music';
import { bot } from '../../core/bot';

@Declare({
	name: 'shuffle',
	description: 'Shuffle the songs in the queue.',
	props: { category: 'Music' },
})
export default class ShuffleCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('shuffle')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!ctx.guildId) return;

		const queue = resolveQueue(ctx.guildId);

		if (!queue) {
			await ctx.write({ content: client.language.Music.Shuffle.NoMusic, flags: 64 });
			return;
		}

		await queue.shuffle();

		await ctx.write({ content: client.language.Music.Shuffle.Shuffled });
	}
}
