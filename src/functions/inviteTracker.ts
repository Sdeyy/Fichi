import type { BotClient } from '../types/seyfert';
import Invite from '../data/models/invites';
import UserInvites from '../data/models/userInvites';
import { config } from '../core/config';
import { logger } from '../core/logger';

/**
 * Invite tracking state.
 *
 * Seyfert requires one event per file (default export), so the shared state and
 * helpers live here and each event file imports them.
 */

export interface InviteSnapshot {
	uses: Map<string, number>;
	inviters: Map<string, string>;
}

const snapshots = new Map<string, InviteSnapshot>();

export async function takeSnapshot(
	client: BotClient,
	guildId: string,
): Promise<InviteSnapshot | null> {
	const guild = client.cache.guilds?.get(guildId);

	if (!guild) return null;

	try {
		const invites = await guild.invites.list();
		const snapshot: InviteSnapshot = { uses: new Map(), inviters: new Map() };

		for (const invite of invites) {
			snapshot.uses.set(invite.code, invite.uses);

			if (invite.inviter?.id) {
				snapshot.inviters.set(invite.code, invite.inviter.id);
			}
		}

		return snapshot;
	} catch (error) {
		logger.warn(`[invites] Could not list invites for ${guildId}`, error);
		return null;
	}
}

export function getSnapshot(guildId: string): InviteSnapshot | undefined {
	return snapshots.get(guildId);
}

export function setSnapshot(guildId: string, snapshot: InviteSnapshot): void {
	snapshots.set(guildId, snapshot);
}

/**
 * Detects which invite was used when a member joins and updates the counters.
 */
export async function handleInviteJoin(client: BotClient, guildId: string, userId: string): Promise<void> {
	if (!config.INVITES.ENABLED) return;

	const previous = getSnapshot(guildId);
	const current = await takeSnapshot(client, guildId);

	if (!current) return;

	setSnapshot(guildId, current);

	if (!previous) return;

	let usedCode: string | null = null;

	for (const [code, uses] of current.uses) {
		const before = previous.uses.get(code) ?? 0;

		if (uses > before) {
			usedCode = code;
			break;
		}
	}

	if (!usedCode) return;

	const inviterId = current.inviters.get(usedCode) ?? previous.inviters.get(usedCode);

	if (!inviterId) return;

	await Invite.create({ inviterId, inviteeId: userId, inviteCode: usedCode });

	const updated = await UserInvites.findOneAndUpdate(
		{ userId: inviterId },
		{ $inc: { invites: 1 } },
		{ new: true, upsert: true, setDefaultsOnInsert: true },
	).lean();

	const channelId = config.INVITES.CHANNEL;
	const channel: unknown = channelId ? client.cache.channels?.get(channelId) : undefined;

	if (!channel || typeof channel !== 'object') return;

	const textable = channel as { isTextable?: () => boolean; messages?: { write: (body: { content: string }) => Promise<unknown> } };

	if (typeof textable.isTextable !== 'function' || !textable.isTextable()) return;
	if (!textable.messages) return;

	const content = config.INVITES.MESSAGE
		.replace('%user%', `<@${userId}>`)
		.replace('%inviter%', `<@${inviterId}>`)
		.replace('%inviteCode%', usedCode)
		.replace('%invitesCount%', String(updated?.invites ?? 1));

	await textable.messages.write({ content }).catch((error: unknown) => logger.error(error));
}

/** Decrements the counter of the inviter when an invited member leaves. */
export async function handleInviteLeave(userId: string): Promise<void> {
	if (!config.INVITES.ENABLED) return;

	const record = await Invite.findOne({ inviteeId: userId }).lean();

	if (!record?.inviterId) return;

	await UserInvites.updateOne({ userId: record.inviterId }, { $inc: { invites: -1 } });
	await Invite.deleteOne({ inviteeId: userId });
}
