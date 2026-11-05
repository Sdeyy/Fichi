import { Command, Declare, Embed, type CommandContext } from 'seyfert';
import { resolveQueue, resolveVoice } from '../../functions/music';
import { bot } from '../../core/bot';
import { resolveColor } from '../../core/ui';

@Declare({
	name: 'resume',
	description: 'Resume the currently paused song',
	props: { category: 'Music', cooldown: '3s' },
})
export default class ResumeCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('resume')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const target = await resolveVoice(ctx);

		if (!target) {
			await ctx.write({ content: client.language.Music.Resume.MustBeInVC, flags: 64 });
			return;
		}

		const queue = resolveQueue(target.guildId);

		if (!queue) {
			await ctx.write({ content: client.language.Music.Resume.NoQueue, flags: 64 });
			return;
		}

		if (!queue.paused) {
			await ctx.write({ content: client.language.Music.Resume.NotPaused, flags: 64 });
			return;
		}

		await queue.resume();

		const embed = new Embed()
			.setColor(resolveColor('Green'))
			.setDescription(client.language.Music.Resume.Resumed);

		await ctx.write({ embeds: [embed] });
	}
}
