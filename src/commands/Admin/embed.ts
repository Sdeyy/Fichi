import {
	Command,
	Declare,
	Options,
	Embed,
	ActionRow,
	Button,
	Modal,
	Label,
	TextInput,
	StringSelectMenu,
	type CommandContext,
} from 'seyfert';
import { createStringOption } from 'seyfert';
import { bot } from '../../core/bot';
import { baseEmbed, buttonStyle, resolveColor } from '../../core/ui';
import { config } from '../../core/config';
import { logger } from '../../core/logger';

interface EmbedData {
	author?: { name: string; iconUrl?: string };
	title?: string;
	description?: string;
	fields?: { name: string; value: string; inline: boolean }[];
	image?: string;
	thumbnail?: string;
	footer?: { text: string; iconUrl?: string };
	color?: string;
}

/** Builds the live preview embed from the collected data. */
function buildPreview(data: EmbedData): Embed {
	const embed = new Embed().setColor(resolveColor(data.color ?? '#5865F2'));

	if (data.author) embed.setAuthor(data.author);
	if (data.title) embed.setTitle(data.title);
	if (data.description) embed.setDescription(data.description);
	if (data.fields?.length) embed.addFields(...data.fields);
	if (data.image) embed.setImage(data.image);
	if (data.thumbnail) embed.setThumbnail(data.thumbnail);
	if (data.footer) embed.setFooter(data.footer);

	return embed;
}

/** Modal used by every editable option of the embed. */
function buildModal(option: string): Modal {
	const modal = new Modal().setCustomId(`embed-modal-${option}`).setTitle(`Editar ${option}`);

	const input = (id: string, label: string, style: 1 | 2, required: boolean) =>
		new Label().setLabel(label).setComponent(
			new TextInput().setCustomId(id).setStyle(style).setRequired(required),
		);

	switch (option) {
		case 'author':
			modal.addComponents(
				input('author_name', 'Nombre del autor', 1, true),
				input('author_icon', 'URL del icono del autor (opcional)', 1, false),
			);
			break;
		case 'title':
			modal.addComponents(input('title_text', 'Título', 1, true));
			break;
		case 'description':
			modal.addComponents(input('description_text', 'Descripción', 2, true));
			break;
		case 'fields':
			modal.addComponents(
				input('field_name', 'Nombre del campo', 1, true),
				input('field_value', 'Valor del campo', 2, true),
			);
			break;
		case 'image':
			modal.addComponents(input('image_url', 'URL de la imagen', 1, true));
			break;
		case 'thumbnail':
			modal.addComponents(input('thumbnail_url', 'URL de la miniatura', 1, true));
			break;
		case 'footer':
			modal.addComponents(
				input('footer_text', 'Texto del footer', 1, true),
				input('footer_icon', 'URL del icono del footer (opcional)', 1, false),
			);
			break;
		default:
			modal.addComponents(input('color_hex', 'Color hex (#5865F2 por defecto)', 1, false));
	}

	return modal;
}

const OPTIONS = [
	{ label: 'Author', value: 'author', description: 'Establece el nombre e imagen del autor' },
	{ label: 'Title', value: 'title', description: 'Establece el título del embed' },
	{ label: 'Description', value: 'description', description: 'Establece la descripción del embed' },
	{ label: 'Fields', value: 'fields', description: 'Agrega un campo al embed' },
	{ label: 'Image', value: 'image', description: 'Establece la imagen grande del embed' },
	{ label: 'Thumbnail', value: 'thumbnail', description: 'Establece la miniatura (thumbnail) del embed' },
	{ label: 'Footer', value: 'footer', description: 'Establece el pie de página (footer)' },
	{ label: 'Color', value: 'color', description: 'Establece el color del borde del embed' },
];

@Declare({
	name: 'embed',
	description: 'Crea un embed personalizado de forma interactiva',
	props: { category: 'Admin' },
})
@Options({})
export default class EmbedCommand extends Command {
	override async run(ctx: CommandContext): Promise<void> {
		const client = bot(ctx.client);

		if (!client.embeds) {
			await ctx.write({ content: 'Missing embeds configuration.', flags: 64 });
			return;
		}

		if (!(await ctx.member?.roles.permissions())?.has('Administrator')) {
			await ctx.write({ content: client.language.NO_PERMS, flags: 64 });
			return;
		}

		const data: EmbedData = {};

		const menu = new StringSelectMenu()
			.setCustomId('embed_options')
			.setPlaceholder('Selecciona una opción para editar el embed')
			.addOption(OPTIONS);

		const row = new ActionRow().addComponents(menu);

		const send = new Button()
			.setCustomId('send_embed')
			.setLabel('Enviar Embed')
			.setStyle(buttonStyle('success'));

		const cancel = new Button()
			.setCustomId('cancel_embed')
			.setLabel('Cancelar')
			.setStyle(buttonStyle('danger'));

		const buttons = new ActionRow().addComponents(send, cancel);

		const message = await ctx.write(
			{
				content: 'Selecciona una opción para personalizar el embed.',
				components: [row, buttons],
				embeds: [buildPreview(data)],
				flags: 64,
			},
			true,
		);

		const collector = message.createComponentCollector({
			timeout: 300_000,
			filter: (i) => i.user.id === ctx.author.id,
		});

		collector.run('embed_options', async (component) => {
			if (!component.isStringSelectMenu()) return;

			const option = component.values[0];
			if (!option) return;

			const modal = buildModal(option);
			await component.modal(modal);
		});

		collector.run(['send_embed', 'cancel_embed'], async (component) => {
			if (component.customId === 'send_embed') {
				if (!component.channel || !component.channel.isTextable()) {
					collector.stop('invalid channel');
					return;
				}

				await component.channel.messages.write({ embeds: [buildPreview(data)] });
				await component.update({ content: 'Embed enviado.', components: [] });
				collector.stop('sent');
				return;
			}

			await component.update({ content: 'Embed cancelado.', components: [] });
			collector.stop('cancelled');
		});

		logger.debug('[embed] interactive editor opened');
	}
}
