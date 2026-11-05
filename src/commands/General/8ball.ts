import { Command, Declare, Embed, Options, createStringOption, type CommandContext } from 'seyfert';
import { bot } from '../../core/bot';
import { resolveColor } from '../../core/ui';

const options = {
	question: createStringOption({
		description: 'Question',
		required: true,
	}),
};

@Declare({
	name: '8ball',
	description: 'Ask the bot a question..',
	props: { category: 'General' },
})
@Options(options)
export default class EightBallCommand extends Command {
	override async run(ctx: CommandContext<typeof options>): Promise<void> {
		const client = bot(ctx.client);

		if (client.config.DISABLE_COMMANDS.DISABLED.includes('8ball')) {
			await ctx.write({ content: client.language.DISABLED_COMMAND, flags: 64 });
			return;
		}

		const answers = client.config.BALL.CONFIG;
		const answer = answers[Math.floor(Math.random() * answers.length)] ?? 'Maybe';

		const embed = new Embed()
			.setColor(resolveColor(client.config.BOT_CONFIG.EMBED_COLOR))
			.setTitle('**:8ball: 8BALL**')
			.addFields(
				{ name: '**» Question:**', value: ` ${ctx.options.question}`, inline: false },
				{ name: '**» Answer:**', value: ` ${answer}.`, inline: false },
			);

		await ctx.write({ embeds: [embed] });
	}
}
