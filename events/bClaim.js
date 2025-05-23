const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits } = require("discord.js");
const client = require('../index')
const ticketSchema = require("../data/models/ticketDB");

client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId == "Ticket-Claimed") {
            interaction.deferUpdate();

            const adminRole = client.config.TICKET.ADMIN_ROLE;
            let supportRole = client.config.TICKET.SUPPORT_ROLE;
            if (!interaction.member.roles.cache.has(supportRole)) {
                return;
            }

            const db = require('../data/models/statisticsModel');
            await db.findOneAndUpdate({ guildID: interaction.guild.id }, {
                $inc: {
                    ticketsClaimed: 1
                },
            })
            let idmiembro = interaction.channel.topic;
            interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
                [PermissionFlagsBits.ViewChannel]: false
            }).catch(error =>
                console.log(error))

            interaction.channel.permissionOverwrites.edit(idmiembro, {
                [PermissionFlagsBits.ViewChannel]: true,
                [PermissionFlagsBits.SendMessages]: true,
                [PermissionFlagsBits.AddReactions]: true,
                [PermissionFlagsBits.AttachFiles]: true,
                [PermissionFlagsBits.EmbedLinks]: true
            }).catch(error =>
                console.log(error))

            interaction.channel.permissionOverwrites.edit(interaction.member.id, {
                [PermissionFlagsBits.ViewChannel]: true,
                [PermissionFlagsBits.SendMessages]: true,
                [PermissionFlagsBits.AddReactions]: true,
                [PermissionFlagsBits.AttachFiles]: true,
                [PermissionFlagsBits.EmbedLinks]: true,
                [PermissionFlagsBits.ManageMessages]: true,
                [PermissionFlagsBits.ManageChannels]: true
            }).catch(error =>
                console.log(error))

            interaction.channel.permissionOverwrites.edit(supportRole, {
                [PermissionFlagsBits.ViewChannel]: false
            }).catch(error =>
                console.log(error))

            interaction.channel.permissionOverwrites.edit(adminRole, {
                [PermissionFlagsBits.ViewChannel]: true,
                [PermissionFlagsBits.SendMessages]: true,
                [PermissionFlagsBits.AddReactions]: true,
                [PermissionFlagsBits.AttachFiles]: true,
                [PermissionFlagsBits.EmbedLinks]: true,
                [PermissionFlagsBits.ManageMessages]: true,
                [PermissionFlagsBits.ManageChannels]: true
            }).catch(error =>
                console.log(error))
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setStyle(client.buttons.TICKETS_GENERAL_BUTTONS.Close.Style).setLabel(client.buttons.TICKETS_GENERAL_BUTTONS.Close.Label).setEmoji(client.buttons.TICKETS_GENERAL_BUTTONS.Close.Emoji).setCustomId("Ticket-Open-Close"),
                new ButtonBuilder().setStyle(client.buttons.TICKETS_GENERAL_BUTTONS.Claim.Style).setLabel(client.buttons.TICKETS_GENERAL_BUTTONS.Claim.Label).setEmoji(client.buttons.TICKETS_GENERAL_BUTTONS.Claim.Emoji).setCustomId("Ticket-Claimed").setDisabled(true))
            interaction.message.edit({
                components: [row]
            })
            const embed = new EmbedBuilder()
                .setDescription(`${client.language.Tickets.TicketClaimed}`.replace("<user>", `${interaction.member.user.tag}`))
                .setColor(client.config.BOT_CONFIG.EMBED_COLOR);

            interaction.message.channel.send({ embeds: [embed] })

            if (client.config.TICKET.LOGS_SYSTEM) {
                let channelLOG = client.config.TICKET.LOGS_CHANNEL;
                interaction.guild.channels.cache.get(channelLOG).send({
                    embeds: [new EmbedBuilder()
                        .setTitle("" + `${client.config.BOT_CONFIG.NAME}` + " | Ticket Claimed")
                        .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
                        .setDescription(`
                        **User**: <@!${interaction.member.user.id}>
                        **Action**: Claimed a ticket
                        **Ticket Name**: ${interaction.channel.name}
                        **Ticket Owner**: <@!${interaction.channel.topic}>`)
                    ]
                }

                )
            }


        }
    }
})