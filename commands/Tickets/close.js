const { Client, CommandInteraction, EmbedBuilder } = require("discord.js");
const Discord = require('discord.js')

module.exports = {
    name: "close",
    description: "Close ticket.",
    type: 1,

    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {

        if (client.config.DISABLE_COMMANDS.DISABLED.includes("close")) return interaction.reply({
            content: `${client.language.DISABLED_COMMAND}`,
            ephemeral: true
        })

        if (client.config.TICKET.CLOSE_ONLY_SUPPORT && !interaction.member.roles.cache.has(client.config.TICKET.SUPPORT_ROLE)) return interaction.reply("Only the Staff Team can close the tickets.");
        const topic = interaction.channel.topic;

        const userCheck = interaction.guild.members.cache.get(topic);

        if (!userCheck) {
            const noTicket = new EmbedBuilder()
                .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
                .setDescription(`${client.language.Tickets.NoTicket}`.replace('<user>', `${interaction.user}`))

            return interaction.reply({ embeds: [noTicket], ephemeral: true })
        }

        const deleting = new EmbedBuilder()
            .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
            .setDescription(`${client.language.Tickets.TicketDeleted}`.replace('<user>', `${interaction.user}`))

        interaction.reply({ embeds: [deleting] })

        setTimeout(() => {
            interaction.channel.delete()
        }, 5000)

    },
};