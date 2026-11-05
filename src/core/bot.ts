import type { BotClient } from '../types/seyfert';

/**
 * Typed accessor helpers used across commands/components.
 *
 * Seyfert contexts expose the client as `UsingClient`, which is a union of the
 * base client and the registered client. Casting through this helper keeps the
 * code readable without sprinkling `as` everywhere.
 */
export function bot(client: unknown): BotClient {
	return client as BotClient;
}
