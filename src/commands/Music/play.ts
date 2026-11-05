import { Command, Declare, Options, createStringOption, type CommandContext } from 'seyfert';
import youtube from 'youtube-sr';
import { getMusic } from '../../music';
import { resolveVoice } from '../../functions/music';
import { bot } from '../../core/bot';

const options = {
	query: createStringOption({
		description: 'Link or name of the song',
		required: true,
		autocomplete: async (interaction) => {
			const input = interaction.getInput().trim();

			if (!input) {
				await interaction.respond([]);
				return;
			}

			const results = await youtube.search(input, { limit: 10, type: 'video' }).catch(() => []);

			const choices: { name: string; value: string }[] = [];

			for (const video of results) {
				const title = video.title;
				const url = video.url;

				if (!title || !url) continue;

				choices.push({
					name: title.length > 100 ? `${title.slice(0, 97)}...` : title,
					value: url,
				});
			}

			await interaction.respond(choices);
		},
	}),
};

@Declare({
	name: 'play',
	description: 'Play a song or playlist from YouTube',
	props: { category: 'Music', cooldown: '5s' },
})
@Options(options)
export default class PlayCommand extends Command {
	override async run(ctx: CommandContext<typeof options>): Promise<void> {
		const client = bot(ctx.client);
		const music = getMusic();

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('play')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!music) {
			await ctx.write({ content: 'The music engine is not ready yet.', flags: 64 });
			return;
		}

		const target = await resolveVoice(ctx);

		if (!target) {
			await ctx.write({ content: client.language.Music.Play.MustBeInVC, flags: 64 });
			return;
		}

		await ctx.deferReply(true);

		try {
			const member = ctx.member;

			await music.play(target.channel, ctx.options.query, {
				member: member as never,
			});

			await ctx.editResponse({ content: client.language.Music.Play.Searching });
		} catch (error) {
			await ctx.editResponse({
				content: `There was an error trying to play that song: ${(error as Error).message}`,
			});
		}
	}
}
