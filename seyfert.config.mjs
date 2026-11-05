import { config } from 'seyfert';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';

/**
 * Seyfert runtime configuration.
 *
 * `base` points to the compiled output, because Seyfert loads commands, events
 * and components from disk after `client.start()`.
 *
 * Intent names are resolved by Seyfert; the same list is declared in
 * `src/core/client.ts` for the programmatic start.
 */
const settings = yaml.load(readFileSync('./data/settings/config.yml', 'utf8'));

export default config.bot({
	token: settings?.BOT_CONFIG?.TOKEN ?? process.env.BOT_TOKEN ?? '',
	intents: [
		'Guilds',
		'GuildMembers',
		'GuildPresences',
		'GuildMessageReactions',
		'DirectMessages',
		'MessageContent',
		'GuildModeration',
		'GuildVoiceStates',
	],
	locations: {
		base: 'dist',
		commands: 'commands',
		events: 'events',
		components: 'components',
	},
});
