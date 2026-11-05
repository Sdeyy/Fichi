import { Events, Sonaria, Song, Playlist, ExtractorPlugin, type ResolveOptions } from 'sonaria';
import ytdl from '@distube/ytdl-core';
import youtube from 'youtube-sr';
import { Embed } from 'seyfert';
import type { BotClient } from './types/seyfert';
import { logger } from './core/logger';
import { resolveColor, template } from './core/ui';

/**
 * YouTube extractor for Sonaria.
 *
 * Sonaria ships no sources on purpose; this plugin implements search, metadata
 * resolution and stream URL extraction using `youtube-sr` + `@distube/ytdl-core`.
 */
export class YouTubePlugin extends ExtractorPlugin {
	private static readonly URL_PATTERN =
		/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{11}/i;

	private static readonly VIDEO_ID = /(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/;

	override validate(url: string): boolean {
		return YouTubePlugin.URL_PATTERN.test(url) || YouTubePlugin.VIDEO_ID.test(url);
	}

	private videoId(url: string): string | null {
		const match = url.match(YouTubePlugin.VIDEO_ID);
		return match?.[1] ?? null;
	}

	override async resolve<T>(url: string, options: ResolveOptions<T>): Promise<Song<T>> {
		const info = await ytdl.getBasicInfo(url);

		return this.toSong<T>(url, {
			id: info.videoDetails.videoId,
			name: info.videoDetails.title,
			duration: Number.parseInt(info.videoDetails.lengthSeconds, 10) * 1000,
			thumbnail: info.videoDetails.thumbnails.at(-1)?.url,
			uploader: info.videoDetails.author?.name,
			isLive: info.videoDetails.isLive,
		}, options);
	}

	override async searchSong<T>(query: string, options: ResolveOptions<T>): Promise<Song<T> | null> {
		const result = await youtube.searchOne(query, 'video').catch(() => null);

		if (!result?.url) return null;

		return this.toSong<T>(result.url, {
			id: result.id ?? this.videoId(result.url) ?? result.url,
			name: result.title ?? 'Unknown',
			duration: (result.duration ?? 0) * 1000,
			thumbnail: result.thumbnail?.url,
			uploader: result.channel?.name,
		}, options);
	}

	override async getStreamURL<T>(song: Song<T>): Promise<string> {
		if (!song.url) throw new Error('Song has no URL to stream from');

		const info = await ytdl.getInfo(song.url);
		const format = ytdl.chooseFormat(info.formats, {
			quality: 'highestaudio',
			filter: 'audioonly',
		});

		if (!format?.url) throw new Error(`No audio format available for ${song.url}`);

		return format.url;
	}

	override getRelatedSongs<T>(song: Song<T>): Promise<Song<T>[]> {
		// Related songs are resolved lazily by Sonaria's autoplay feature.
		return Promise.resolve([]);
	}

	private toSong<T>(url: string, data: {
		id: string;
		name: string;
		duration: number;
		thumbnail?: string;
		uploader?: string;
		isLive?: boolean;
	}, options: ResolveOptions<T>): Song<T> {
		return new Song<T>({
			source: 'youtube',
			id: data.id,
			name: data.name,
			duration: data.duration,
			url,
			thumbnail: data.thumbnail,
			uploader: { name: data.uploader },
			isLive: data.isLive ?? false,
			playFromSource: true,
			plugin: this,
		}, options);
	}
}

/** Shared Sonaria instance, created once the client is ready. */
let sonaria: Sonaria | null = null;

export function getMusic(): Sonaria | null {
	return sonaria;
}

/**
 * Wires Sonaria into the client.
 *
 * Playlists are supported through `Sonaria#play`, which accepts a URL, a search
 * query, a `Song` or a `Playlist`.
 */
export function startMusic(client: BotClient): Sonaria {
	const instance = new Sonaria(client, {
		emitNewSongOnly: true,
		plugins: [new YouTubePlugin()],
	});

	sonaria = instance;

	instance
		.on(Events.PlaySong, (queue, song) => {
			const channel = queue.textChannel;
			if (!channel) return;

			const embed = new Embed()
				.setColor(resolveColor(client.config.BOT_CONFIG.EMBED_COLOR))
				.setDescription(
					template(client.language.Music.PlaySong, {
						songName: song.name ?? 'Unknown',
						songURL: song.url ?? '',
					}),
				);

			void channel.messages.write({ embeds: [embed] }).catch((error) => logger.error(error));
		})
		.on(Events.AddSong, (queue, song) => {
			const channel = queue.textChannel;
			if (!channel) return;

			const embed = new Embed()
				.setColor(resolveColor(client.config.BOT_CONFIG.EMBED_COLOR))
				.setDescription(
					template(client.language.Music.AddSong, {
						songName: song.name ?? 'Unknown',
						songURL: song.url ?? '',
					}),
				);

			void channel.messages.write({ embeds: [embed] }).catch((error) => logger.error(error));
		})
		.on(Events.AddList, (queue, playlist) => {
			const channel = queue.textChannel;
			if (!channel) return;

			const embed = new Embed()
				.setColor(resolveColor(client.config.BOT_CONFIG.EMBED_COLOR))
				.setDescription(
					template(client.language.Music.AddList, {
						playlistName: playlist.name ?? 'Unknown',
						playlistSongsLength: playlist.songs.length,
					}),
				);

			void channel.messages.write({ embeds: [embed] }).catch((error) => logger.error(error));
		})
		.on(Events.Error, (error) => {
			logger.error('[music]', error.message);
		});

	return instance;
}

export { Song, Playlist };
