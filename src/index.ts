import './polyfills';
import mongoose from 'mongoose';
import client, { intents } from './core/client';
import { config } from './core/config';
import { logger, printBanner, bannerSuccess, bannerError, bannerEnd } from './core/logger';
import { startTempRoleWatcher } from './functions/checkTempRoles';
import { startMusic } from './music';

process.on('unhandledRejection', (error) => logger.error(error));
process.on('uncaughtException', (error) => logger.error(error));

async function main(): Promise<void> {
	printBanner();

	await client.start({
		connection: { intents: [...intents] },
	});

	bannerSuccess(`Client - Logged in as ${client.me.username}`);

	try {
		await mongoose.connect(config.BOT_CONFIG.MONGO_URI);
		bannerSuccess('Database - Mongoose connected');
	} catch (error) {
		bannerError('Database - Connection failed:', error);
	}

	startTempRoleWatcher(client);
	startMusic(client);

	await client.uploadCommands({ cachePath: './commands.json' });

	bannerEnd();
}

void main().catch((error) => {
	logger.error(error);
	process.exit(1);
});
