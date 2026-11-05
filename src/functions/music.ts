import type { AllGuildVoiceChannels, CommandContext, GuildCommandContext } from 'seyfert';
import type { Queue } from 'sonaria';
import { getMusic } from '../music';

/**
 * Music helpers shared by every music command.
 *
 * Sonaria works with real `GuildVoiceChannel` objects and a per-guild `Queue`.
 */

export interface VoiceTarget {
	guildId: string;
	channel: AllGuildVoiceChannels;
}

/**
 * Resolves the voice channel the member is connected to.
 *
 * Returns `null` when the user is not in a voice channel; callers use this to
 * early-return with a single check.
 */
export async function resolveVoice(ctx: CommandContext): Promise<VoiceTarget | null> {
	if (!ctx.guildId) return null;

	const voice = await Promise.resolve(ctx.member?.voice('cache'));
	const channelId = voice?.channelId;

	if (!channelId) return null;

	const channel = await Promise.resolve(ctx.client.cache.channels?.get(channelId));

	if (!channel) return null;

	return { guildId: ctx.guildId, channel: channel as AllGuildVoiceChannels };
}

/** Returns the queue for the guild, if a track is loaded. */
export function resolveQueue(guildId: string): Queue | undefined {
	return getMusic()?.getQueue(guildId);
}

/** Ensures the member is in the same voice channel as the bot. */
export async function sameVoiceChannel(ctx: GuildCommandContext): Promise<boolean> {
	const queue = resolveQueue(ctx.guildId);

	if (!queue) return true;

	const memberVoice = await Promise.resolve(ctx.member.voice('cache'));

	return queue.voiceChannel.id === memberVoice?.channelId;
}

/** Formats a duration in milliseconds as `mm:ss` (or `hh:mm:ss`). */
export function formatDuration(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const pad = (value: number) => String(value).padStart(2, '0');

	return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}
