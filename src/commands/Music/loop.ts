import { Command, Declare, Options, Embed, createStringOption, type CommandContext } from 'seyfert';
import { resolveQueue } from '../../functions/music';
import { bot } from '../../core/bot';
import { resolveColor } from '../../core/ui';

const options = {
	mode: createStringOption({
		description: 'Loop mode: off, one, all',
		required: true,
		choices: [
			{ name: 'Off', value: 'off' },
			{ name: 'Repeat One', value: 'one' },
			{ name: 'Queue', value: 'all' },
		],
	}),
};

@Declare({
	name: 'loop',
	description: 'Toggle loop mode: off, repeat current song, or repeat the entire queue',
	props: { category: 'Music', cooldown: '3s' },
})
@Options(options)
export default class LoopCommand extends Command {
	override async run(ctx: CommandContext<typeof options>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('loop')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!ctx.guildId) return;

		const queue = resolveQueue(ctx.guildId);

		if (!queue) {
			await ctx.write({ content: 'There is no song playing right now.', flags: 64 });
			return;
		}

		const mode = ctx.options.mode === 'all' ? 2 : ctx.options.mode === 'one' ? 1 : 0;
		const applied = queue.setRepeatMode(mode as 0 | 1 | 2);

		const { Loop } = client.language.Music;
		const description = applied === 1 ? Loop.RepeatOne : applied === 2 ? Loop.RepeatQueue : Loop.Off;

		const embed = new Embed()
			.setColor(resolveColor('Blue'))
			.setDescription(description);

		await ctx.write({ embeds: [embed] });
	}
}
