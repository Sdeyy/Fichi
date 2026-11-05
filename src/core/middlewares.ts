import type { CommandContext, MenuCommandContext, MessageCommandInteraction, UserCommandInteraction } from 'seyfert';
import { applyCooldown, formatRemaining, remainingCooldown } from './cooldown';
import type { BotClient } from '../types/seyfert';

/**
 * Cooldown + disabled-command guard.
 *
 * Installed through `commands.defaults.onBeforeMiddlewares`, so it runs before
 * every command body. Commands opt into a cooldown with
 * `props: { cooldown: '1m' }`, mirroring the original `cooldown` property.
 */
export async function commandGuard(
	context:
		| CommandContext
		| MenuCommandContext<MessageCommandInteraction<boolean> | UserCommandInteraction<boolean>, never>,
): Promise<void> {
	if (!context.isChat()) return;

	const client = context.client as unknown as BotClient;
	const command = context.command;
	const props = command.props as { cooldown?: string } | undefined;

	if (client.config.DISABLE_COMMANDS.DISABLED.includes(command.name)) {
		await context.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
		return;
	}

	const cooldown = props?.cooldown;

	if (!cooldown) return;

	const remaining = remainingCooldown(command.name, context.author.id);

	if (remaining > 0) {
		const message = (client.embeds.Cooldown.Message ?? '⏳ Espera %time%').replace(
			'%time%',
			formatRemaining(remaining),
		);

		await context.write({ content: message, flags: 64 });
		return;
	}

	applyCooldown(command.name, context.author.id, cooldown);
}
