import { Command, Declare, type CommandContext } from 'seyfert';
import { resolveQueue, resolveVoice } from '../../functions/music';
import { bot } from '../../core/bot';

@Declare({
	name: 'stop',
	description: 'Stop the music and clear the queue',
	props: { category: 'Music', cooldown: '5s' },
})
export default class StopCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('stop')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const target = await resolveVoice(ctx);

		if (!target) {
			await ctx.write({ content: client.language.Music.Stop.NoVoiceChannel, flags: 64 });
			return;
		}

		const queue = resolveQueue(target.guildId);

		if (!queue) {
			await ctx.write({ content: client.language.Music.Stop.NoQueue, flags: 64 });
			return;
		}

		await queue.stop();
		await ctx.write({ content: client.language.Music.Stop.Stopped });
	}
}
