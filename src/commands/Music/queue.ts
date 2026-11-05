import { Command, Declare, ActionRow, Button, Embed, type CommandContext } from 'seyfert';
import { resolveQueue, resolveVoice } from '../../functions/music';
import { bot } from '../../core/bot';
import { resolveColor } from '../../core/ui';

const SONGS_PER_PAGE = 30;

@Declare({
	name: 'queue',
	description: 'View the music queue with pagination.',
	props: { category: 'Music' },
})
export default class QueueCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('queue')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const target = await resolveVoice(ctx);

		if (!target) {
			await ctx.write({ content: client.language.Music.Queue.MustBeInVC, flags: 64 });
			return;
		}

		const queue = resolveQueue(target.guildId);

		if (!queue?.songs.length) {
			await ctx.write({ content: client.language.Music.Queue.NoSongPlaying, flags: 64 });
			return;
		}

		const botVoice = queue.voiceChannel.id;

		if (botVoice !== target.channel.id) {
			await ctx.write({ content: client.language.Music.Queue.SameVC, flags: 64 });
			return;
		}

		const pages: string[] = [];

		for (let index = 0; index < queue.songs.length; index += SONGS_PER_PAGE) {
			const chunk = queue.songs.slice(index, index + SONGS_PER_PAGE);

			pages.push(
				chunk
					.map(
						(song, offset) =>
							`**\`${index + offset + 1}\`** - [\`${song.name ?? 'Unknown'}\`](${song.url ?? ''}) - \`${song.formattedDuration}\``,
					)
					.join('\n'),
			);
		}

		const current = queue.songs[0];
		const embeds = pages.map((page, index) =>
			new Embed()
				.setTitle(`Queue - [${queue.songs.length} ${queue.songs.length > 1 ? 'Songs' : 'Song'}]`)
				.setColor(resolveColor('#8400ff'))
				.setDescription(page)
				.addFields({
					name: '💿 Current Song',
					value: `**[\`${current?.name ?? 'Unknown'}\`](${current?.url ?? ''})**`,
				})
				.setFooter({ text: `Page ${index + 1} / ${pages.length}` }),
		);

		let page = 0;

		const previous = new Button()
			.setCustomId('previous')
			.setLabel('Previous')
			.setEmoji('◀️')
			.setStyle(1)
			.setDisabled(true);

		const home = new Button()
			.setCustomId('home')
			.setLabel('Home')
			.setEmoji('🏠')
			.setStyle(4);

		const next = new Button()
			.setCustomId('next')
			.setLabel('Next')
			.setEmoji('▶️')
			.setStyle(1)
			.setDisabled(pages.length <= 1);

		const row = new ActionRow().addComponents(previous, home, next);

		const message = await ctx.write(
			{ embeds: [embeds[page]!], components: [row] },
			true,
		);

		if (pages.length <= 1) return;

		const collector = ctx.client.components.createComponentCollector(
			message.id,
			ctx.channelId,
			ctx.guildId,
			{ timeout: 180_000 },
		);

		collector.run(['previous', 'home', 'next'], async (interaction) => {
			if (interaction.user.id !== ctx.author.id) {
				await interaction.write({
					content: client.language.Music.Queue.OnlyExecutor,
					flags: 64,
				});
				return;
			}

			if (interaction.customId === 'previous') {
				page = page - 1 < 0 ? pages.length - 1 : page - 1;
			} else if (interaction.customId === 'next') {
				page = page + 1 >= pages.length ? 0 : page + 1;
			} else {
				page = 0;
			}

			previous.setDisabled(page === 0);
			next.setDisabled(page === pages.length - 1);

			await interaction.update({
				embeds: [embeds[page]!],
				components: [row],
			});
		});
	}
}
