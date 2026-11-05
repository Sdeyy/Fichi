import '../polyfills';
import { Client } from 'seyfert';
import { voice } from 'sonaria';
import { config, buttons, embeds, language } from './config';
import { logger } from './logger';
import { commandGuard } from './middlewares';
import type { BotClient } from '../types/seyfert';

/**
 * Intents required by the bot, expressed as Seyfert intent names.
 */
const intents = [
	'Guilds',
	'GuildMembers',
	'GuildPresences',
	'GuildMessageReactions',
	'DirectMessages',
	'MessageContent',
	'GuildModeration',
	'GuildVoiceStates',
] as const;

export const client = new Client({
	plugins: [voice()],
	commands: {
		defaults: {
			onBeforeMiddlewares: commandGuard,
			onRunError: async (context, error) => {
				logger.error(error);
				await context
					.write({ content: 'An error occurred while running this command.', flags: 64 })
					.catch(() => null);
			},
		},
	},
}) as unknown as BotClient;

client.config = config;
client.embeds = embeds;
client.buttons = buttons;
client.language = language;

export { intents };

export default client;
