import type { Client } from 'seyfert';
import type { VoiceManager } from 'sonaria';
import type { DiscordConfig, Embeds, Buttons, Language } from './config';

/**
 * Augments the client with the bot's own configuration objects and the voice
 * manager added by Sonaria's `voice()` plugin.
 */
export interface BotData {
	config: DiscordConfig;
	embeds: Embeds;
	buttons: Buttons;
	language: Language;
	voice: VoiceManager;
}

/**
 * The client type used across the project.
 *
 * Seyfert's `Client` is a type alias (not an interface), so it cannot be
 * augmented directly. This intersection is registered in `SeyfertRegistry`, so
 * `ctx.client` is typed correctly everywhere.
 */
export type BotClient = Client<true> & BotData;

declare module 'seyfert' {
	interface SeyfertRegistry {
		client: BotClient;
	}

	interface ExtraProps {
		category?: string;
		disabled?: boolean;
		cooldown?: string;
	}
}

export {};
