const {
    Client,
    CommandInteraction,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    InteractionType
} = require("discord.js");

module.exports = {
    name: "embed",
    description: "Crea un embed personalizado de forma interactiva",

    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {

        if (!interaction.member.permissions.has("ADMINISTRATOR")) {
            return interaction.reply({ content: `${client.language.NO_PERMS}`, ephemeral: true })
        }

        let embedData = {};

        const menu = new StringSelectMenuBuilder()
            .setCustomId("embed_options")
            .setPlaceholder("Selecciona una opción para editar el embed")
            .addOptions(
                {
                    label: "Author",
                    value: "author",
                    description: "Establece el nombre e imagen del autor",
                },
                {
                    label: "Title",
                    value: "title",
                    description: "Establece el título del embed",
                },
                {
                    label: "Description",
                    value: "description",
                    description: "Establece la descripción del embed",
                },
                {
                    label: "Fields",
                    value: "fields",
                    description: "Agrega un campo al embed",
                },
                {
                    label: "Image",
                    value: "image",
                    description: "Establece la imagen grande del embed",
                },
                {
                    label: "Thumbnail",
                    value: "thumbnail",
                    description: "Establece la miniatura (thumbnail) del embed",
                },
                {
                    label: "Footer",
                    value: "footer",
                    description: "Establece el pie de página (footer)",
                },
                {
                    label: "Color",
                    value: "color",
                    description: "Establece el color del borde del embed",
                }
            );

        const menuRow = new ActionRowBuilder().addComponents(menu);
        const sendBtn = new ButtonBuilder()
            .setCustomId("send_embed")
            .setLabel("Enviar Embed")
            .setStyle(ButtonStyle.Success);
        const cancelBtn = new ButtonBuilder()
            .setCustomId("cancel_embed")
            .setLabel("Cancelar")
            .setStyle(ButtonStyle.Danger);
        const buttonRow = new ActionRowBuilder().addComponents(sendBtn, cancelBtn);

        const message = await interaction.reply({
            content: "Selecciona una opción para personalizar el embed.",
            components: [menuRow, buttonRow],
            embeds: [generarEmbedPreview(embedData)],
            fetchReply: true,
            ephemeral: true,
        });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 300000,
        });

        collector.on("collect", async (component) => {
            if (component.isStringSelectMenu()) {
                const option = component.values[0];

                const modal = new ModalBuilder()
                    .setCustomId(`modal_${option}`)
                    .setTitle(`Editar ${option.charAt(0).toUpperCase() + option.slice(1)}`);

                switch (option) {
                    case "author":
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("author_name")
                                    .setLabel("Nombre del autor")
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("author_icon")
                                    .setLabel("URL del icono del autor (opcional)")
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(false)
                            )
                        );
                        break;

                    case "title":
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("title_text")
                                    .setLabel("Título")
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            )
                        );
                        break;

                    case "description":
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("description_text")
                                    .setLabel("Descripción")
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setRequired(true)
                            )
                        );
                        break;

                    case "fields":
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("field_name")
                                    .setLabel("Nombre del campo")
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("field_value")
                                    .setLabel("Valor del campo")
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setRequired(true)
                            )
                        );
                        break;

                    case "image":
                    case "thumbnail":
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId(`${option}_url`)
                                    .setLabel(`URL de la imagen (${option})`)
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            )
                        );
                        break;

                    case "footer":
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("footer_text")
                                    .setLabel("Texto del footer")
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("footer_icon")
                                    .setLabel("URL del icono del footer (opcional)")
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(false)
                            )
                        );
                        break;

                    case "color":
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("embed_color")
                                    .setLabel("Color hex (#5865F2 por defecto)")
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(false)
                            )
                        );
                        break;
                }

                await component.showModal(modal);
            } else if (component.customId === "send_embed") {
                const embed = new EmbedBuilder();

                if (embedData.author) embed.setAuthor(embedData.author);
                if (embedData.title) embed.setTitle(embedData.title);
                if (embedData.description) embed.setDescription(embedData.description);
                if (embedData.fields) embed.addFields(embedData.fields);
                if (embedData.image) embed.setImage(embedData.image);
                if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail);
                if (embedData.footer) embed.setFooter(embedData.footer);
                embed.setColor(embedData.color || "#5865F2");

                await interaction.channel.send({ embeds: [embed] });
                collector.stop();
            } else if (component.customId === "cancel_embed") {
                await interaction.editReply({ content: "Embed cancelado.", components: [] });
                collector.stop();
            }
        });

        client.on("interactionCreate", async (modal) => {
            if (modal.user.id !== interaction.user.id || modal.type !== InteractionType.ModalSubmit) return;

            const id = modal.customId;

            if (!id.startsWith("modal_")) return;

            const type = id.split("_")[1];

            switch (type) {
                case "author":
                    embedData.author = {
                        name: modal.fields.getTextInputValue("author_name"),
                    };
                    const authorIcon = modal.fields.getTextInputValue("author_icon");
                    if (authorIcon) embedData.author.iconURL = authorIcon;
                    await interaction.editReply({
                        embeds: [generarEmbedPreview(embedData)],
                    });
                    break;

                case "title":
                    embedData.title = modal.fields.getTextInputValue("title_text");
                    await interaction.editReply({
                        embeds: [generarEmbedPreview(embedData)],
                    });
                    break;

                case "description":
                    embedData.description = modal.fields.getTextInputValue("description_text");
                    await interaction.editReply({
                        embeds: [generarEmbedPreview(embedData)],
                    });
                    break;

                case "fields":
                    if (!embedData.fields) embedData.fields = [];
                    embedData.fields.push({
                        name: modal.fields.getTextInputValue("field_name"),
                        value: modal.fields.getTextInputValue("field_value"),
                        inline: false,
                    });
                    await interaction.editReply({
                        embeds: [generarEmbedPreview(embedData)],
                    });
                    break;

                case "image":
                    embedData.image = modal.fields.getTextInputValue("image_url");
                    await interaction.editReply({
                        embeds: [generarEmbedPreview(embedData)],
                    });
                    break;

                case "thumbnail":
                    embedData.thumbnail = modal.fields.getTextInputValue("thumbnail_url");
                    await interaction.editReply({
                        embeds: [generarEmbedPreview(embedData)],
                    });
                    break;

                case "footer":
                    embedData.footer = {
                        text: modal.fields.getTextInputValue("footer_text"),
                    };
                    const footerIcon = modal.fields.getTextInputValue("footer_icon");
                    if (footerIcon) embedData.footer.iconURL = footerIcon;
                    await interaction.editReply({
                        embeds: [generarEmbedPreview(embedData)],
                    });
                    break;

                case "color":
                    embedData.color = modal.fields.getTextInputValue("embed_color") || "#5865F2";
                    await interaction.editReply({
                        embeds: [generarEmbedPreview(embedData)],
                    });
                    break;
            }

            await modal.reply({
                content: `✅ Opción **${type}** añadida.`,
                ephemeral: true,
            });
        });
    },
};

function generarEmbedPreview(embedData) {
    const embed = new EmbedBuilder();

    embed.setDescription(embedData.description || "Descripción no proporcionada.");

    if (embedData.author) embed.setAuthor(embedData.author);
    if (embedData.title) embed.setTitle(embedData.title);
    if (embedData.fields) embed.addFields(embedData.fields);
    if (embedData.image) embed.setImage(embedData.image);
    if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail);
    if (embedData.footer) embed.setFooter(embedData.footer);
    embed.setColor(embedData.color || "#5865F2");

    return embed;
}
