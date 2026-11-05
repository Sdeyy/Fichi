import { createEvent, PresenceUpdateStatus } from 'seyfert';
import { bannerSuccess, logger } from '../core/logger';

/**
 * `botReady` — updates the presence rotation once the bot is connected.
 */
export default createEvent({
	data: { name: 'botReady', once: true },
	run(me, client) {
		const totalUsers = client.cache.users?.count() ?? 0;

		logger.info(`Logged in as ${me.username}`);

		const activities = [
			{ name: `${totalUsers} Users`, type: 3 },
			{ name: '/help', type: 2 },
		];

		let index = 0;

		const timer = setInterval(() => {
			const activity = activities[index % activities.length];

			if (!activity) return;

			void client.gateway
				.send(0, {
					op: 3,
					d: {
						since: null,
						activities: [{ name: activity.name, type: activity.type as 2 | 3 }],
						status: PresenceUpdateStatus.Online,
						afk: false,
					},
				})
				.catch(() => null);

			index += 1;
		}, 15_000);

		timer.unref();

		bannerSuccess(`Client - Logged in as ${me.username}`);
	},
});
