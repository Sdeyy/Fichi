import ms from 'ms';

/**
 * In-memory cooldown registry.
 *
 * Mirrors the behaviour of the original `interactionCreate` event: the key is
 * `<command>-<userId>` and the value is the moment the cooldown expires.
 */
const cooldowns = new Map<string, number>();

export function cooldownKey(commandName: string, userId: string): string {
	return `${commandName}-${userId}`;
}

/**
 * Returns the remaining time in milliseconds, or `0` when the user can run the
 * command again.
 */
export function remainingCooldown(commandName: string, userId: string): number {
	const key = cooldownKey(commandName, userId);
	const expiresAt = cooldowns.get(key);

	if (expiresAt === undefined) return 0;

	const remaining = expiresAt - Date.now();

	if (remaining <= 0) {
		cooldowns.delete(key);
		return 0;
	}

	return remaining;
}

export function applyCooldown(commandName: string, userId: string, duration: string): number {
	const parsed = ms(duration);

	if (typeof parsed !== 'number' || parsed <= 0) return 0;

	const expiresAt = Date.now() + parsed;
	cooldowns.set(cooldownKey(commandName, userId), expiresAt);

	const timer = setTimeout(() => cooldowns.delete(cooldownKey(commandName, userId)), parsed);
	timer.unref();

	return parsed;
}

/** Formats a remaining duration the same way the original bot did. */
export function formatRemaining(remaining: number): string {
	const formatted = ms(remaining, { long: true });
	return typeof formatted === 'string' ? formatted : `${Math.ceil(remaining / 1000)}s`;
}

export function clearCooldowns(): void {
	cooldowns.clear();
}
