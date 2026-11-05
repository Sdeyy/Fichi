import { Command, Declare, Options, createIntegerOption, type CommandContext } from 'seyfert';
import { resolveQueue } from '../../functions/music';
import { bot } from '../../core/bot';
import { template } from '../../core/ui';

const options = {
	amount: createIntegerOption({
		description: 'Volume percentage to set',
		required: true,
		min_value: 1,
		max_value: 100,
	}),
};

@Declare({
	name: 'volume',
	description: 'Set the music volume (1-100).',
	props: { category: 'Music' },
})
@Options(options)
export default class VolumeCommand extends Command {
	override async run(ctx: CommandContext<typeof options>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('volume')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!ctx.guildId) return;

		const queue = resolveQueue(ctx.guildId);

		if (!queue) {
			await ctx.write({ content: client.language.Music.Volume.NoQueue, flags: 64 });
			return;
		}

		const volume = ctx.options.amount;
		queue.setVolume(volume);

		await ctx.write({
			content: template(client.language.Music.Volume.SetVolume, { volume }),
		});
	}
}
