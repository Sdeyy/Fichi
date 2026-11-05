import { Command, Declare, Embed, type CommandContext } from 'seyfert';
import { resolveQueue, sameVoiceChannel } from '../../functions/music';
import { bot } from '../../core/bot';
import { resolveColor } from '../../core/ui';

@Declare({
	name: 'nowplaying',
	description: 'Shows information about the current playing song',
	props: { category: 'Music', cooldown: '3s' },
})
export default class NowPlayingCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('nowplaying')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		if (!ctx.guildId) return;

		const queue = resolveQueue(ctx.guildId);
		const song = queue?.songs[0];

		if (!song) {
			await ctx.write({ content: 'There is no song currently playing.', flags: 64 });
			return;
		}

		const { NowPlaying } = client.language.Music;

		const embed = new Embed()
			.setColor(resolveColor(NowPlaying.EmbedColor))
			.setTitle(NowPlaying.EmbedTitle)
			.setDescription(
				NowPlaying.EmbedDescription
					.replaceAll('<songName>', song.name ?? 'Unknown')
					.replaceAll('<song.url>', song.url ?? '')
					.replaceAll('<songURL>', song.url ?? ''),
			)
			.addFields(
				{
					name: NowPlaying.FieldOne.Name,
					value: NowPlaying.FieldOne.Value.replaceAll('<songDuration>', song.formattedDuration),
					inline: NowPlaying.FieldOne.inline,
				},
				{
					name: NowPlaying.FieldTwo.Name,
					value: NowPlaying.FieldTwo.Value.replaceAll('<requestBy>', song.user?.username ?? 'Unknown'),
					inline: NowPlaying.FieldTwo.inline,
				},
			);

		if (song.thumbnail) embed.setThumbnail(song.thumbnail);

		embed.setTimestamp();

		void sameVoiceChannel;

		await ctx.write({ embeds: [embed] });
	}
}
