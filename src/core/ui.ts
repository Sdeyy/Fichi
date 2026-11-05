import { Embed, EmbedColors } from 'seyfert';

type ColorResolvable = `#${string}` | number | keyof typeof EmbedColors | 'Random' | [number, number, number];

/**
 * Normalises a colour coming from the YAML files.
 *
 * Accepts a named colour (`"Green"`), a hex string (`"#2c2c34"`) or a numeric
 * value, and always returns something Seyfert's `setColor` understands.
 */
export function resolveColor(color: string | number | undefined): ColorResolvable {
	if (color === undefined) return 'Random';
	if (typeof color === 'number') return color;

	const value = color.trim();

	if (value in EmbedColors) return value as keyof typeof EmbedColors;
	if (value.startsWith('#')) return value as `#${string}`;

	const parsed = Number.parseInt(value, 10);
	if (!Number.isNaN(parsed)) return parsed;

	return 'Random';
}

/**
 * Creates an embed with the bot's configured colour.
 */
export function baseEmbed(color: string | number | undefined): Embed {
	return new Embed().setColor(resolveColor(color));
}

/**
 * Replaces the placeholders used across `embeds.yml` / `language.yml`.
 *
 * Templates use three styles (`%role%`, `<user>`, `{volume}`), so a single
 * helper accepts any key and normalises the result.
 */
export function template(text: string, values: Record<string, string | number>): string {
	let output = text;

	for (const [key, value] of Object.entries(values)) {
		output = output.split(`%${key}%`).join(String(value));
		output = output.split(`<${key}>`).join(String(value));
		output = output.split(`{${key}}`).join(String(value));
	}

	return output;
}

/**
 * Serialises a button style coming from `buttons.yml` (`"Primary"`, `"Danger"`,
 * `"3"`, …) into the numeric enum used by the builder.
 */
export function buttonStyle(style: string | number): 1 | 2 | 3 | 4 | 5 {
	if (typeof style === 'number') return clampStyle(style);

	const named: Record<string, 1 | 2 | 3 | 4 | 5> = {
		primary: 1,
		secondary: 2,
		success: 3,
		danger: 4,
		link: 5,
	};

	const fromName = named[style.toLowerCase()];

	if (fromName) return fromName;

	const parsed = Number.parseInt(style, 10);

	if (!Number.isNaN(parsed)) return clampStyle(parsed);

	return 1;
}

function clampStyle(style: number): 1 | 2 | 3 | 4 | 5 {
	if (style >= 1 && style <= 5) return style as 1 | 2 | 3 | 4 | 5;
	return 1;
}

/** Truncates a string to Discord's field limits. */
export function trim(text: string, max: number): string {
	return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}
