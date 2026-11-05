import { createEvent } from 'seyfert';
import { config } from '../../core/config';
import { takeSnapshot, setSnapshot } from '../../functions/inviteTracker';
import type { BotClient } from '../../types/seyfert';

/**
 * `botReady` — builds the initial invite snapshot for every guild.
 */
export default createEvent({
	data: { name: 'botReady', once: true },
	async run(_me, client) {
		if (!config.INVITES.ENABLED) return;

		const bot = client as unknown as BotClient;

		for (const guild of bot.cache.guilds?.values() ?? []) {
			const snapshot = await takeSnapshot(bot, guild.id);
			if (snapshot) setSnapshot(guild.id, snapshot);
		}
	},
});
