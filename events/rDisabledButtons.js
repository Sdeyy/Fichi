const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const client = require('../index')
const ticketSchema = require("../data/models/ticketDB");
const getNumber = require("../functions/numberTicket");
const blacklistdb = require("../data/models/blacklist");

client.on("interactionCreate", async (interaction) => {

    if (interaction.isButton()) {

        if (!client.config.TICKET.REASON_ENABLED) {
            const ticketaccess = client.config.TICKET.TICKET_ACCESS_ROLE;
            const supportrole = client.config.TICKET.SUPPORT_ROLE;

            const guildData = await ticketSchema.findOne({ guildID: interaction.guild.id, })
            let mapCustomID = guildData.tickets.map(x => x.customID);

            if (!mapCustomID.includes(interaction.customId)) return;

            const data = await blacklistdb.findOne({ guildID: interaction.guild.id, userID: interaction.member.user.id })
            if (data) return interaction.reply({ content: "You are blacklisted from the tickets", ephemeral: true })

            const Data = guildData.tickets.find(x => x.customID === interaction.customId);
            let memberID = interaction.member.user.id;
            const ticketRoles = await Data.ticketRoles.map(x => { return { id: x, allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ADD_REACTIONS", "ATTACH_FILES", "EMBED_LINKS", "MANAGE_MESSAGES", "MANAGE_CHANNELS"] } });
            const tagRoles = await Data.ticketRoles.map(x => {
                return `<@&${x}>`
            })


            await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.BOT_CONFIG.EMBED_COLOR).setDescription(client.language.Tickets.TicketCreating)], ephemeral: true })
            let numberTicket = await getNumber(guildData.ticketCounter, ticketSchema, interaction.guild.id);


            interaction.guild.channels.create(`ticket-${numberTicket}`, {
                type: "text",
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
                        ...ticketRoles]
            }).then(async channel => {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setStyle(client.buttons.TICKETS_GENERAL_BUTTONS.Close.Style).setLabel(client.buttons.TICKETS_GENERAL_BUTTONS.Close.Label).setEmoji(client.buttons.TICKETS_GENERAL_BUTTONS.Close.Emoji).setCustomId("Ticket-Open-Close"),
                    new ButtonBuilder().setStyle(client.buttons.TICKETS_GENERAL_BUTTONS.Claim.Style).setLabel(client.buttons.TICKETS_GENERAL_BUTTONS.Claim.Label).setEmoji(client.buttons.TICKETS_GENERAL_BUTTONS.Claim.Emoji).setCustomId("Ticket-Claimed"))
                const welcome = new EmbedBuilder()
                    .setTitle(`${client.embeds.Tickets.TICKET_OPEN_REASON_DISABLED.Title}`.replace('<botName>', client.config.BOT_CONFIG.NAME))
                    .setDescription(`${client.embeds.Tickets.TICKET_OPEN_REASON_DISABLED.Description}`.replace('<creationDate>', `<t:${Math.round(channel.createdTimestamp / 1000)}:R>`))
                    .setFooter({ text: `${client.embeds.Tickets.TICKET_OPEN_REASON_DISABLED.Footer}`.replace('<botName>', client.config.BOT_CONFIG.NAME) })
                    .setTimestamp()
                    .setColor(`${client.config.BOT_CONFIG.EMBED_COLOR}`)

                const db = require('../data/models/statisticsModel');
                await db.findOneAndUpdate({ guildID: interaction.guild.id }, {
                    $inc: {
                        ticketsOpen: 1
                    },
                })

                channel.send({ content: `<@!${memberID}> | ${tagRoles}`, embeds: [welcome], components: [row] })

                await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.config.BOT_CONFIG.EMBED_COLOR).setDescription(`${client.language.Tickets.TicketCreated}`.replace('<channel>', `<#${channel.id}>`))], ephemeral: true })



                let channelLOG = client.config.TICKET.LOGS_CHANNEL;
                if (!channelLOG) return;
                const log = new EmbedBuilder()
                    .setTitle(`${client.config.BOT_CONFIG.NAME} | Ticket Created`)
                    .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
                    .setDescription(`**User**: <@!${memberID}>\n**Action**: Created a ticket\n**Panel**: ${Data.ticketName}\n**Ticket Name**: ${channel.name}`)

                interaction.client.channels.cache.get(channelLOG).send({ embeds: [log] });
            })
        }

    }
})