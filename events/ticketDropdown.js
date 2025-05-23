const {
    ButtonBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits,
    ChannelType
} = require("discord.js");
const client = require('../index.js');
const ticketSchema = require("../data/models/ticketDB");
const getNumber = require("../functions/numberTicket");
const blacklistdb = require("../data/models/blacklist");
const newTicket = require("../functions/openTickets");

client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu()) {

        if (interaction.customId !== "ticketDropdown") return;

        const guildData = await ticketSchema.findOne({ guildID: interaction.guild.id });
        if (!guildData) return interaction.reply({ content: "No data found", ephemeral: true });

        const Data = guildData.tickets.find(x => x.customID === interaction.values[0]);
        if (!Data) return interaction.reply({ content: `No ticket panel found.`, ephemeral: true });

        const data = await blacklistdb.findOne({ guildID: interaction.guild.id, userID: interaction.member.user.id });
        if (data) {

            const ticketOptions = guildData.tickets.map(x => {
                return {
                    label: x.ticketName,
                    value: x.customID,
                    description: x.ticketDescription,
                    emoji: x.ticketEmoji,
                    name: x.ticketName,
                }
            });

            if (ticketOptions.length === 0) {
                return interaction.reply({ content: "There are no tickets set up for this server.", ephemeral: true });
            }

            const selectMenuUpdate = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("ticketDropdown")
                    .setMaxValues(1)
                    .addOptions(ticketOptions)
            )

            try {
                await interaction.message.edit({ components: [selectMenuUpdate] });
            } catch (error) {
                console.error('Error updating the select menu:', error);
            }

            return interaction.reply({ content: "You are blacklisted from the tickets", ephemeral: true })
        }

        if (client.config.TICKET.TICKET_LIMIT) {
            const canales = interaction.guild.channels.cache.filter(c => c.topic === interaction.user.id);
            if (canales.size > 0) {
                return interaction.reply({ content: client.language.Tickets.AlreadyOpen, ephemeral: true });
            }
        }

        const Modal = new ModalBuilder()
            .setTitle('Ticket Reason')
            .setCustomId(`ticketReasonModal-${interaction.values[0]}`);

        const reasonInput = new TextInputBuilder()
            .setCustomId('ticketreason')
            .setLabel(client.language.TicketReason.Label)
            .setPlaceholder(client.language.TicketReason.Placeholder)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(reasonInput);

        Modal.addComponents(row);

        await interaction.showModal(Modal);
    }

    if (interaction.isModalSubmit()) {

        if (!interaction.customId.startsWith('ticketReasonModal-')) return;
        const customID = interaction.customId.replace('ticketReasonModal-', '');

        const guildData = await ticketSchema.findOne({ guildID: interaction.guild.id });
        if (!guildData) return;

        const Data = guildData.tickets.find(x => x.customID === customID);
        if (!Data) return;

        const ticketreason = interaction.fields.getTextInputValue('ticketreason');
        const ticketRoles = Data.ticketRoles.map(x => {
            return {
                id: x,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.AddReactions,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.EmbedLinks,
                    PermissionFlagsBits.ManageMessages,
                    PermissionFlagsBits.ManageChannels
                ]
            };
        });

        const tagRoles = Data.ticketRoles.map(x => `<@&${x}>`);
        let memberID = interaction.member.user.id;

        await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.BOT_CONFIG.EMBED_COLOR).setDescription(client.language.Tickets.TicketCreating)], ephemeral: true });

        let numberTicket = await getNumber(guildData.ticketCounter, ticketSchema, interaction.guild.id);

        interaction.guild.channels.create({
            name: `ticket-${numberTicket}`,
            type: ChannelType.GuildText,
            topic: `${memberID}`,
            parent: Data.ticketCategory,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: memberID,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AddReactions,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.EmbedLinks
                    ]
                },
                ...ticketRoles
            ]
        }).then(async channel => {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setStyle(client.buttons.TICKETS_GENERAL_BUTTONS.Close.Style)
                    .setLabel(client.buttons.TICKETS_GENERAL_BUTTONS.Close.Label)
                    .setEmoji(client.buttons.TICKETS_GENERAL_BUTTONS.Close.Emoji)
                    .setCustomId("Ticket-Open-Close"),
                new ButtonBuilder()
                    .setStyle(client.buttons.TICKETS_GENERAL_BUTTONS.Claim.Style)
                    .setLabel(client.buttons.TICKETS_GENERAL_BUTTONS.Claim.Label)
                    .setEmoji(client.buttons.TICKETS_GENERAL_BUTTONS.Claim.Emoji)
                    .setCustomId("Ticket-Claimed")
            );

            const welcome = new EmbedBuilder()
                .setTitle(client.embeds.Tickets.TICKET_OPEN_REASON_ENABLED.Title.replace('<botName>', client.config.BOT_CONFIG.NAME))
                .setDescription(client.embeds.Tickets.TICKET_OPEN_REASON_ENABLED.Description.replace('<ticketReason>', ticketreason).replace('<creationDate>', `<t:${Math.round(channel.createdTimestamp / 1000)}:R>`))
                .setFooter({ text: client.embeds.Tickets.TICKET_OPEN_REASON_ENABLED.Footer.replace('<botName>', client.config.BOT_CONFIG.NAME) })
                .setTimestamp()
                .setColor(client.config.BOT_CONFIG.EMBED_COLOR);

            await channel.send({ content: `<@!${memberID}> | ${tagRoles.join(", ")}`, embeds: [welcome], components: [row] });

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
                        .setDescription(client.language.Tickets.TicketCreated.replace('<channel>', `<#${channel.id}>`))
                ],
                ephemeral: true
            });

            const ticketOptions = guildData.tickets.map(x => {
                return {
                    label: x.ticketName,
                    value: x.customID,
                    description: x.ticketDescription,
                    emoji: x.ticketEmoji,
                    name: x.ticketName,
                }
            });

            if (ticketOptions.length === 0) {
                return interaction.reply({ content: "There are no tickets set up for this server.", ephemeral: true });
            }

            const selectMenuUpdate = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("ticketDropdown")
                    .setMaxValues(1)
                    .addOptions(ticketOptions)
            )

            try {
                await interaction.message.edit({ components: [selectMenuUpdate] });
            } catch (error) {
                console.error('Error updating the select menu:', error);
            }

        }).catch(console.error);
    }
});
