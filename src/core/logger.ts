import { Logger } from 'seyfert';
import chalk from 'chalk';

/** Shared logger instance: Seyfert's own logger, so its internals keep working. */
export const logger = new Logger({
	active: true,
	logLevel: 1,
});

/** Prints a startup banner in the style of the original bot. */
export function printBanner(): void {
	console.log('');
	console.log(chalk.bold('╔═══════════════════════════════════════════════'));
	console.log(chalk.bold('║'));
	console.log(`${chalk.bold('║')}   ${chalk.cyan.bold('Fichi')} ${chalk.gray('· Seyfert 5 · TypeScript')}`);
	console.log(chalk.bold('║'));
}

/** Prints a success line inside the startup banner. */
export function bannerSuccess(message: string): void {
	console.log(`${chalk.bold('║')}   ${chalk.green.bold('✔')} ${message}`);
}

/** Prints a failure line inside the startup banner. */
export function bannerError(message: string, error?: unknown): void {
	console.log(`${chalk.bold('║')}   ${chalk.red.bold('✖')} ${message}`);
	if (error) console.error(error);
}

/** Closes the startup banner. */
export function bannerEnd(): void {
	console.log(chalk.bold('║'));
	console.log(chalk.bold('╚═══════════════════════════════════════════════'));
}
