import { createEvent } from 'seyfert';
import { handleInviteLeave } from '../../functions/inviteTracker';

/**
 * `guildMemberRemove` — rolls back the invite counter of the inviter.
 */
export default createEvent({
	data: { name: 'guildMemberRemove' },
	async run(member) {
		await handleInviteLeave(member.user.id);
	},
});
