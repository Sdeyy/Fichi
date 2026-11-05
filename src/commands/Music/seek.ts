import { Command, Declare, Options, createIntegerOption, type CommandContext } from 'seyfert';
import { resolveQueue } from '../../functions/music';
import { bot } from '../../core/bot';
import { template } from '../../core/ui';

const options = {
	time: createIntegerOption({
		description: 'Time in seconds to seek to',
		required: true,
		min_value: 0,
	}),
};

@Declare({
	name: 'seek',
	description: 'Seek to a specific time in the current song.',
	props: { category: 'Music' },
})
@Options(options)
export default class SeekCommand extends Command {
	override async run(ctx: CommandContext<typeof options>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('seek')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!ctx.guildId) return;

		const queue = resolveQueue(ctx.guildId);
		const song = queue?.songs[0];

		if (!queue || !song) {
			await ctx.write({ content: client.language.Music.Seek.NoMusic, flags: 64 });
			return;
		}

		const time = ctx.options.time;

		if (time < 0 || time * 1000 > song.duration) {
			await ctx.write({
				content: template(client.language.Music.Seek.InvalidTime, {
					duration: song.formattedDuration,
				}),
				flags: 64,
			});
			return;
		}

		await queue.seek(time);

		await ctx.write({
			content: template(client.language.Music.Seek.SeekedTo, {
				time: new Date(time * 1000).toISOString().slice(14, 19),
			}),
		});
	}
}
