import { Command, Declare, Embed, type CommandContext } from 'seyfert';
import { resolveQueue, resolveVoice } from '../../functions/music';
import { bot } from '../../core/bot';
import { resolveColor } from '../../core/ui';

@Declare({
	name: 'pause',
	description: 'Pause the currently playing song',
	props: { category: 'Music', cooldown: '3s' },
})
export default class PauseCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('pause')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const target = await resolveVoice(ctx);

		if (!target) {
			await ctx.write({ content: client.language.Music.Pause.MustBeInVC, flags: 64 });
			return;
		}

		const queue = resolveQueue(target.guildId);

		if (!queue) {
			await ctx.write({ content: client.language.Music.Pause.Nothing, flags: 64 });
			return;
		}

		if (queue.paused) {
			await ctx.write({ content: client.language.Music.Pause.AlreadyPaused, flags: 64 });
			return;
		}

		await queue.pause();

		const embed = new Embed()
			.setColor(resolveColor('Yellow'))
			.setDescription(client.language.Music.Pause.Paused);

		await ctx.write({ embeds: [embed] });
	}
}
