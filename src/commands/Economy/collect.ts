import { Command, Declare, type CommandContext } from 'seyfert';
import Economy from '../../data/models/economy';
import { bot } from '../../core/bot';

@Declare({
	name: 'collect',
	description: 'Collect money based on your roles.',
	props: { category: 'Economy', cooldown: '24h' },
})
export default class CollectCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('collect')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		await Economy.findOneAndUpdate(
			{ userID: ctx.author.id },
			{ $setOnInsert: { userID: ctx.author.id } },
			{ upsert: true, setDefaultsOnInsert: true },
		);

		const collectRoles = client.config.ECONOMY.COLLECT_ROLES ?? {};
		const memberRoles = ctx.member?.roles.keys ?? [];

		let total = 0;
		const lines: string[] = [];

		for (const roleId of memberRoles) {
			const amount = collectRoles[roleId];

			if (typeof amount === 'number') {
				total += amount;
				lines.push(`<@&${roleId}>: ${amount} coins`);
			}
		}

		if (total === 0) {
			await ctx.write({ content: client.language.Economy.NoCollectRoles, flags: 64 });
			return;
		}

		lines.push(`**Total:** ${total} coins`);

		await ctx.write({
			content: lines.join('\n'),
			allowed_mentions: { parse: [] },
			flags: 64,
		});
	}
}
