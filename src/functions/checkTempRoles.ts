import TempRole from '../data/models/tempRole';
import { logger } from '../core/logger';
import type { BotClient } from '../types/seyfert';

/**
 * Removes expired temporary roles.
 *
 * Unlike the original implementation — which ran a full collection scan every
 * second — this only queries roles whose `expiresAt` has already passed.
 */
export async function checkExpiredRoles(client: BotClient): Promise<void> {
	const expired = await TempRole.find({ expiresAt: { $lt: new Date() } }).lean();

	for (const entry of expired) {
		try {
			const guild = client.cache.guilds?.get(entry.guildId);

			if (!guild) {
				await TempRole.deleteOne({ _id: entry._id });
				continue;
			}

			await client.members.removeRole(entry.guildId, entry.userId, entry.roleId).catch(() => null);
			await TempRole.deleteOne({ _id: entry._id });
		} catch (error) {
			logger.warn(`[tempRoles] Failed to remove role ${entry.roleId} from ${entry.userId}`, error);
		}
	}
}

/**
 * Starts the periodic watcher. The interval is intentionally longer than the
 * original 1s loop to avoid hammering MongoDB.
 */
export function startTempRoleWatcher(client: BotClient, intervalMs = 30_000): NodeJS.Timeout {
	const timer = setInterval(() => {
		void checkExpiredRoles(client);
	}, intervalMs);

	timer.unref();

	return timer;
}
