const { EmbedBuilder } = require("discord.js");
const client = require("../index");
const ticketSchema = require("../data/models/ticketDB");
let supportRole = client.config.TICKET.SUPPORT_ROLE;


client.on("interactionCreate", async (interaction) => {

    if (interaction.isButton()) {

        const guildData = await ticketSchema.findOne({
            guildID: interaction.guild.id
        });

        const idmiembro = interaction.channel.topic;
        const ticketaccess = client.config.TICKET.TICKET_ACCESS_ROLE;

        if (interaction.customId === "Ticket-Open") {
            interaction.deferUpdate();
            if (!interaction.member.roles.cache.get(ticketaccess)) {
                return;
            }
            setTimeout(() => {
                interaction.message.delete()
            }, 500);



            const openmed = new EmbedBuilder()
                .setDescription(`The ticket was reopen by <@!${interaction.member.user.id}>`)
                .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
            interaction.channel.send({ embeds: [openmed] })
            interaction.channel.permissionOverwrites.edit(idmiembro, { VIEW_CHANNEL: true });
            const guildData = await ticketSchema.findOne({
                guildID: interaction.guild.id,
            })
            if (!guildData) return interaction.reply({ content: 'No server found', ephemeral: true })


            let channelLOG = client.config.TICKET.LOGS_CHANNEL;
            if (client.config.TICKET.LOGS_SYSTEM) {
                const log = new EmbedBuilder()
                    .setAuthor(`${client.config.BOT_CONFIG.NAME} | Ticket ReOpen`)
                    .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
                    .setDescription(`
            **User**: <@!${interaction.member.user.id}>
            **Action**: Re-Open a ticket
            **Ticket Name**: ${interaction.channel.name}
            **Ticket Owner**: <@!${interaction.channel.topic}>`)
                interaction.client.channels.cache.get(channelLOG).send({ embeds: [log] });
            }

        }


        if (interaction.customId === "Ticket-Delete") {
            interaction.deferUpdate();
            const ticketSchema = require("../data/models/ticketDB");

            if (!interaction.member.roles.cache.has(supportRole)) {
                return;
            }

            if (!guildData) return interaction.reply({ content: `No data`, ephemeral: true })

            const delembed = new EmbedBuilder()
                .setDescription(`Eliminando ticket en 5 segundos...`)
                .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
            interaction.channel.send({ embeds: [delembed] })

            setTimeout(async () => {
                await interaction.channel.delete();
            }, 5000);

            const db = require('../data/models/statisticsModel');
            await db.findOneAndUpdate({ guildID: interaction.guild.id }, {
                $inc: {
                    ticketsOpen: -1
                },
            })

            if (!guildData)
                return interaction.reply({ content: `NO data found.`, ephemeral: true });

            let channelLOG = client.config.TICKET.LOGS_CHANNEL;

            const log = new EmbedBuilder()
                .setAuthor({ name: `${client.config.BOT_CONFIG.NAME} | Ticket Closed`})
                .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
                .setDescription(`
                **User**: <@!${interaction.member.user.id}>
                **Action**: Close a ticket
                **Ticket Name**: ${interaction.channel.name}
                **Ticket Owner**: <@!${interaction.channel.topic}>`)

            if (client.config.TICKET.LOGS_SYSTEM) {
                interaction.guild.channels.cache.get(channelLOG).send({ embeds: [log] });
            }
        }

    }
});
