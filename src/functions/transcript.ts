import type { AllGuildTextableChannels, MessageStructure } from 'seyfert';
import { AttachmentBuilder } from 'seyfert';

/**
 * Minimal HTML transcript generator.
 *
 * The original project used `discord-html-transcripts`, which depends on
 * discord.js. Since this project no longer ships discord.js, the transcript is
 * generated here with no external dependencies: it paginates the channel
 * history and renders a self-contained HTML file.
 */

const PAGE_SIZE = 100;

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

async function fetchAllMessages(channel: AllGuildTextableChannels): Promise<MessageStructure[]> {
	const collected: MessageStructure[] = [];
	let before: string | undefined;

	while (true) {
		const batch = await channel.messages.list({ limit: PAGE_SIZE, before });

		if (!batch.length) break;

		collected.push(...batch);
		before = batch.at(-1)?.id;

		if (batch.length < PAGE_SIZE || !before) break;
	}

	return collected.reverse();
}

function renderMessage(message: MessageStructure): string {
	const author = escapeHtml(message.author.username);
	const avatar = message.author.avatarURL();
	const date = new Date(message.timestamp ?? Date.now()).toISOString();
	const body = escapeHtml(message.content || '[sin contenido de texto]');

	const attachments = (message.attachments ?? [])
		.map(
			(file) =>
				`<a class="attachment" href="${escapeHtml(file.url)}" target="_blank" rel="noopener">${escapeHtml(file.filename)}</a>`,
		)
		.join(' ');

	return `
		<article class="message">
			<img class="avatar" src="${escapeHtml(avatar)}" alt="" loading="lazy" />
			<div class="content">
				<header>
					<span class="author">${author}</span>
					<time datetime="${date}">${date}</time>
				</header>
				<p>${body}</p>
				${attachments ? `<div class="attachments">${attachments}</div>` : ''}
			</div>
		</article>`;
}

function renderHtml(channelName: string, guildName: string, messages: MessageStructure[]): string {
	return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Transcript · ${escapeHtml(channelName)}</title>
<style>
	:root { color-scheme: dark; }
	* { box-sizing: border-box; }
	body {
		margin: 0;
		padding: 2rem 1rem;
		background: #1e1f22;
		color: #dbdee1;
		font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
		line-height: 1.5;
	}
	main { max-width: 860px; margin: 0 auto; }
	header.page {
		display: flex; flex-wrap: wrap; gap: .5rem 1rem; align-items: baseline;
		border-bottom: 1px solid #3f4147; padding-bottom: 1rem; margin-bottom: 1.5rem;
	}
	h1 { font-size: 1.35rem; margin: 0; color: #f2f3f5; }
	.meta { color: #949ba4; font-size: .85rem; }
	.message { display: flex; gap: .75rem; padding: .5rem 0; }
	.avatar { width: 40px; height: 40px; border-radius: 50%; background: #313338; flex: 0 0 auto; }
	.content { min-width: 0; }
	.content header { display: flex; gap: .5rem; align-items: baseline; }
	.author { color: #f2f3f5; font-weight: 600; }
	time { color: #949ba4; font-size: .75rem; }
	.content p { margin: .15rem 0 0; white-space: pre-wrap; overflow-wrap: anywhere; }
	.attachments { margin-top: .35rem; display: flex; flex-wrap: wrap; gap: .5rem; }
	.attachment { color: #00a8fc; font-size: .85rem; text-decoration: none; }
	.attachment:hover { text-decoration: underline; }
</style>
</head>
<body>
<main>
	<header class="page">
		<h1>${escapeHtml(channelName)}</h1>
		<span class="meta">${escapeHtml(guildName)} · ${messages.length} mensajes</span>
	</header>
	${messages.map(renderMessage).join('\n')}
</main>
</body>
</html>`;
}

export interface TranscriptResult {
	buffer: Buffer;
	fileName: string;
}

/** Builds an HTML transcript for the given channel. */
export async function createTranscript(
	channel: AllGuildTextableChannels,
	guildName: string,
): Promise<TranscriptResult> {
	const messages = await fetchAllMessages(channel);
	const html = renderHtml(channel.name, guildName, messages);

	return {
		buffer: Buffer.from(html, 'utf8'),
		fileName: `transcript-${channel.name}.html`,
	};
}

/** Wraps the transcript in an attachment ready to be sent. */
export function transcriptAttachment(result: TranscriptResult): AttachmentBuilder {
	return new AttachmentBuilder()
		.setName(result.fileName)
		.setDescription('Ticket transcript')
		.setFile('buffer', result.buffer);
}
