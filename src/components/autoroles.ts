import { ComponentCommand, type ComponentContext } from 'seyfert';
import ReactionRoles from '../data/models/reactionRoles';
import { bot } from '../core/bot';
import { ActionRow, StringSelectMenu, Embed } from 'seyfert';
import { resolveColor } from '../core/ui';

/**
 * `autoroles` — toggles a self-assignable role from the reaction-roles panel.
 */
export default class AutorolesSelect extends ComponentCommand {
	componentType = 'StringSelect' as const;

	override customId = 'autoroles';

	override async run(ctx: ComponentContext<'StringSelect'>): Promise<void> {
		if (!ctx.guildId) return;

		const client = bot(ctx.client);

		if (!client.config.REACTION_ROLES.ENABLED) return;

		const roleId = ctx.interaction.values[0];

		if (!roleId) return;

		const member = ctx.member;

		if (!member) return;

		const hasRole = member.roles.keys.includes(roleId);

		await ctx.deferUpdate();

		if (hasRole) {
			await ctx.client.members.removeRole(ctx.guildId, ctx.author.id, roleId);
		} else {
			await ctx.client.members.addRole(ctx.guildId, ctx.author.id, roleId);
		}

		const config = hasRole
			? client.embeds.ReactionRoles.Removed
			: client.embeds.ReactionRoles.Added;

		await ctx.followup({
			embeds: [
				new Embed()
					.setTitle(config.Title)
					.setDescription(config.Description.replace('<role>', `<@&${roleId}>`))
					.setColor(resolveColor(config.Color)),
			],
			flags: 64,
		});

		const guildData = await ReactionRoles.findOne({ guildID: ctx.guildId }).lean();

		if (!guildData?.roles.length) return;

		const guild = await ctx.guild();
		const roles = (await guild?.roles.list()) ?? [];

		const options = guildData.roles
			.map((entry) => {
				const role = roles.find((candidate) => candidate.id === entry.roleId);

				if (!role) return null;

				return {
					label: role.name,
					value: role.id,
					...(entry.roleDescription ? { description: entry.roleDescription } : {}),
					...(entry.roleEmoji ? { emoji: { name: entry.roleEmoji } } : {}),
				};
			})
			.filter((entry) => entry !== null);

		if (!options.length) return;

		const menu = new StringSelectMenu()
			.setCustomId('autoroles')
			.setValuesLength({ max: 1 })
			.addOption(options);

		await ctx.message
			.edit({ components: [new ActionRow().addComponents(menu)] })
			.catch(() => null);
	}
}
