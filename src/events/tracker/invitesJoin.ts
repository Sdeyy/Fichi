import { createEvent } from 'seyfert';
import { handleInviteJoin } from '../../functions/inviteTracker';
import type { BotClient } from '../../types/seyfert';

/**
 * `guildMemberAdd` — attributes the join to an invite.
 */
export default createEvent({
	data: { name: 'guildMemberAdd' },
	async run(member, client) {
		await handleInviteJoin(client as unknown as BotClient, member.guildId, member.id);
	},
});
