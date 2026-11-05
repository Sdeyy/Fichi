import { ComponentCommand, type ComponentContext } from 'seyfert';
import { bot } from '../../core/bot';
import { config } from '../../core/config';
import { hasRoleId } from '../../core/permissions';
import { createTranscript, transcriptAttachment } from '../../functions/transcript';
import { Embed } from 'seyfert';
import { resolveColor } from '../../core/ui';
import { logger } from '../../core/logger';

/**
 * `TR-YES` / `TR-NO` / `TR-CN` — transcript confirmation buttons.
 *
 * `TR-YES` also sends the transcript to the ticket owner by DM; `TR-NO` only
 * archives it in the transcript channel; `TR-CN` cancels.
 */
export default class TranscriptConfirmButton extends ComponentCommand {
	componentType = 'Button' as const;

	override customId = /^TR-(YES|NO|CN)$/;

	override async run(ctx: ComponentContext<'Button'>): Promise<void> {
		if (!ctx.guildId) return;

		const client = bot(ctx.client);
		const action = ctx.customId;

		if (!hasRoleId(ctx, config.TICKET.SUPPORT_ROLE)) {
			await ctx.write({ content: 'Only the Staff Team can use this.', flags: 64 });
			return;
		}

		const channel = ctx.interaction.channel;

		if (!channel?.isGuildTextable()) return;

		await ctx.deferUpdate();
		await ctx.message.delete().catch(() => null);

		if (action === 'TR-CN') return;

		const guild = await client.guilds.fetch(ctx.guildId);
		const transcript = await createTranscript(channel, guild.name);
		const attachment = transcriptAttachment(transcript);

		const ownerId = 'topic' in channel ? channel.topic : undefined;

		const saving = await channel.messages.write({
			embeds: [
				new Embed()
					.setDescription('Saving transcript...')
					.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR)),
			],
		});

		const summary = new Embed()
			.addFields(
				{ name: 'Ticket Owner', value: ownerId ? `<@${ownerId}>` : 'Unknown', inline: true },
				{ name: 'Ticket Name', value: channel.name ?? ctx.channelId, inline: true },
			)
			.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR));

		const transcriptChannel = config.TICKET.TRANSCRIPT_CHANNEL
			? client.cache.channels?.get(config.TICKET.TRANSCRIPT_CHANNEL)
			: undefined;

		if (transcriptChannel?.isTextable()) {
			await transcriptChannel.messages.write({
				embeds: [summary],
				files: [attachment],
			});
		}

		if (action === 'TR-YES' && ownerId) {
			const owner = await client.users.fetch(ownerId).catch(() => null);

			if (owner) {
				await owner
					.write({ embeds: [summary], files: [attachment] })
					.catch(() => logger.warn(`[transcript] Could not DM ${ownerId}`));
			}
		}

		await saving
			.edit({
				embeds: [
					new Embed()
						.setDescription(
							action === 'TR-YES'
								? `Transcript saved to <#${config.TICKET.TRANSCRIPT_CHANNEL}> and sent to the user.`
								: `Transcript saved to <#${config.TICKET.TRANSCRIPT_CHANNEL}>.`,
						)
						.setColor(resolveColor(config.BOT_CONFIG.EMBED_COLOR)),
				],
			})
			.catch(() => null);
	}
}
