const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits } = require("discord.js");
const client = require("../index");

client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === "Ticket-Open-Close") {

            let supportRole = client.config.TICKET.SUPPORT_ROLE;

            if (!interaction.member.roles.cache.has(supportRole)) return;

            const idmiembro = interaction.channel.topic;
            let user = client.users.cache.get(idmiembro)

            interaction.channel.permissionOverwrites.edit(user, {
                [PermissionFlagsBits.ViewChannel]: false,
                [PermissionFlagsBits.SendMessages]: true,
                [PermissionFlagsBits.AddReactions]: true,
                [PermissionFlagsBits.AttachFiles]: true,
                [PermissionFlagsBits.EmbedLinks]: true,
                [PermissionFlagsBits.ManageMessages]: true,
                [PermissionFlagsBits.ManageChannels]: true
            }).catch(error =>
                console.log(error))

            interaction.deferUpdate();

            const embed = new EmbedBuilder()
                .setDescription(client.language.Tickets.WhatDoYouWant)
                .setColor(client.config.BOT_CONFIG.EMBED_COLOR)


            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel(client.buttons.TICKETS_GENERAL_BUTTONS.Transcript.Label)
                    .setStyle(client.buttons.TICKETS_GENERAL_BUTTONS.Transcript.Style)
                    .setEmoji(client.buttons.TICKETS_GENERAL_BUTTONS.Transcript.Emoji)
                    .setCustomId("Ticket-Transcript"),
                new ButtonBuilder()
                    .setLabel(client.buttons.TICKETS_GENERAL_BUTTONS.Delete.Label)
                    .setStyle(client.buttons.TICKETS_GENERAL_BUTTONS.Delete.Style)
                    .setEmoji(client.buttons.TICKETS_GENERAL_BUTTONS.Delete.Emoji)
                    .setCustomId("Ticket-Delete")
            )

            interaction.channel.send({
                embeds: [embed],
                components: [row]
            })
        }
    }
});