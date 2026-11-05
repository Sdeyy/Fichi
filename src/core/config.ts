import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { DiscordConfig, Embeds, Buttons, Language } from '../types/config';

/**
 * Resolves a path relative to the project root (process.cwd()).
 * Seyfert is started from the project root, so this keeps behaviour stable
 * regardless of where the compiled file lives.
 */
const rootPath = (...segments: string[]): string => path.join(process.cwd(), ...segments);

function loadYaml<T>(file: string): T {
	const fullPath = rootPath('data', 'settings', file);

	if (!fs.existsSync(fullPath)) {
		throw new Error(`[config] Missing configuration file: ${fullPath}`);
	}

	const parsed = yaml.load(fs.readFileSync(fullPath, 'utf8'));

	if (!parsed || typeof parsed !== 'object') {
		throw new Error(`[config] Configuration file is empty or invalid: ${fullPath}`);
	}

	return parsed as T;
}

export const config: DiscordConfig = loadYaml<DiscordConfig>('config.yml');
export const embeds: Embeds = loadYaml<Embeds>('embeds.yml');
export const buttons: Buttons = loadYaml<Buttons>('buttons.yml');
export const language: Language = loadYaml<Language>('language.yml');

/** Absolute path helper shared across the project. */
export const paths = {
	root: process.cwd(),
	data: rootPath('data'),
	settings: rootPath('data', 'settings'),
};

export default { config, embeds, buttons, language, paths };
