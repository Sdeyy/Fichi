import { Command, Declare, Embed, type CommandContext } from 'seyfert';
import { resolveQueue, resolveVoice } from '../../functions/music';
import { bot } from '../../core/bot';
import { resolveColor } from '../../core/ui';

@Declare({
	name: 'skip',
	description: 'Skip the currently playing song',
	props: { category: 'Music', cooldown: '3s' },
})
export default class SkipCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('skip')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const target = await resolveVoice(ctx);

		if (!target) {
			await ctx.write({ content: client.language.Music.Skip.NoVoiceChannel, flags: 64 });
			return;
		}

		const queue = resolveQueue(target.guildId);

		if (!queue) {
			await ctx.write({ content: client.language.Music.Skip.NoQueue, flags: 64 });
			return;
		}

		try {
			await queue.skip();

			const embed = new Embed()
				.setColor(resolveColor('Green'))
				.setDescription(client.language.Music.Skip.Skipped);

			await ctx.write({ embeds: [embed] });
		} catch (error) {
			await ctx.write({
				content: `There was an error trying to skip the song: ${(error as Error).message}`,
				flags: 64,
			});
		}
	}
}
