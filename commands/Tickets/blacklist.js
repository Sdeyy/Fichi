const { Client, CommandInteraction, EmbedBuilder } = require("discord.js");
const db = require('../../data/models/blacklist')
const client = require("../../index")

module.exports = {
    name: "blacklist",
    description: "add or remove blacklist a user from the tickets.",
    options: [
        {
            name: "add",
            description: "Add a user to the blacklist of the tickets",
            type: 1,
            options: [
                {
                    name: 'user',
                    description: 'User to add to the tickets blacklist',
                    type: 6,
                    required: true
                },

                {
                    name: 'reason',
                    description: 'The reason why the user will be added to the ticket blacklist.',
                    type: 3,
                    required: false
                },
            ],
        },

        {
            name: "remove",
            description: "Remove a user from the blacklist",
            type: 1,
            options: [
                {
                    name: 'user',
                    description: 'User to remove from the blacklist of the tickets',
                    type: 6,
                    required: true
                },

                {
                    name: 'reason',
                    description: 'The reason why the user will be removed from the ticket blacklist.',
                    type: 3,
                    required: false
                },
            ],
        },
        {
            name: "check",
            description: "Check the reason of a blacklist",
            type: 1,
            options: [
                {
                    name: "user",
                    description: "User to check the blacklist",
                    type: 6,
                    required: true
                }
            ],
        },
    ],

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     */
    run: async (client, interaction, args) => {

        if (client.config.DISABLE_COMMANDS.DISABLED.includes("blacklist")) return interaction.reply({
            content: `${client.language.DISABLED_COMMAND}`,
            ephemeral: true
        })

        if (!interaction.member.roles.cache.has(client.config.TICKET.SUPPORT_ROLE)) {
            return interaction.reply("Only the Staff Team can use this command.");
        }

        const { options } = interaction;

        const Sub = options.getSubcommand(["add", "remove", "check"])

        if (Sub === "add") {

            const usuario = interaction.options.getUser('user');
            const razon = interaction.options.getString('reason') || "No reason provided";

            const isblacklisted = new EmbedBuilder()
                .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
                .setTitle(`${client.embeds.BLACKLIST.USERBLACKLISTED.Title}`)
                .setDescription(`${client.embeds.BLACKLIST.USERBLACKLISTED.Description}`.replace("<user>", `${usuario}`))

            const checking = await db.findOne({ guildID: interaction.guild.id, userID: usuario.id });
            if (checking) return interaction.reply({
                embeds: [isblacklisted],
                ephemeral: client.embeds.BLACKLIST.USERBLACKLISTED.Ephemeral
            });

            const blacklistdb = new db({
                guildID: interaction.guild.id,
                userID: usuario.id,
                reason: razon
            });

            await blacklistdb.save();

            const blacklisted = new EmbedBuilder()
                .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
                .setTitle(client.embeds.BLACKLIST.BLACKLISTED.Title)
                .setDescription(`${client.embeds.BLACKLIST.BLACKLISTED.Description}`.replace("<user>", `${usuario}`).replace("<reason>", `${razon}`))
            interaction.reply({
                embeds: [blacklisted],
                ephemeral: client.embeds.BLACKLIST.BLACKLISTED.Ephemeral
            })

        } else if (Sub === "remove") {

            const usuario = interaction.options.getUser('user');
            const razon = interaction.options.getString('reason') || "No reason provided";

            const data = await db.findOne({ guildID: interaction.guild.id })

            const alreadyUnblacklisted = new EmbedBuilder()
                .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
                .setTitle(`${client.embeds.BLACKLIST.UNBLACKLIST.USERUNBLACKLISTED.Title}`)
                .setDescription(`${client.embeds.BLACKLIST.UNBLACKLIST.USERUNBLACKLISTED.Description}`.replace("<user>", `${usuario}`))

            const checking = await db.findOne({ guildID: interaction.guild.id, userID: usuario.id });
            if (!checking) return interaction.reply({
                embeds: [alreadyUnblacklisted],
                ephemeral: client.embeds.BLACKLIST.UNBLACKLIST.USERUNBLACKLISTED.Ephemeral
            });

            await db.findOneAndDelete({ guildID: interaction.guild.id, userID: usuario.id });

            const unblacklisted = new EmbedBuilder()
                .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
                .setTitle(`${client.embeds.BLACKLIST.UNBLACKLIST.UNBLACKLISTED.Title}`)
                .setDescription(`${client.embeds.BLACKLIST.UNBLACKLIST.UNBLACKLISTED.Description}`.replace("<user>", `${usuario}`).replace("<reason>", `${razon}`))

            interaction.reply({
                embeds: [unblacklisted]
            })

        } else if (Sub === "check") {

            const usuario = interaction.options.getUser("user");

            const data = await db.findOne({ guildID: interaction.guild.id, userID: usuario.id })

            const noblacklisted = new EmbedBuilder()
                .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
                .setTitle(`${client.embeds.BLACKLIST.CHECKBLACKLIST.NOBLACKLISTED.Title}`)
                .setDescription(`${client.embeds.BLACKLIST.CHECKBLACKLIST.NOBLACKLISTED.Description}`.replace("<user>", `${usuario}`))

            if (!data) return interaction.reply({ embeds: [noblacklisted], ephemeral: client.embeds.BLACKLIST.CHECKBLACKLIST.BLACKLISTED.Ephemeral })

            const blacklisted = new EmbedBuilder()
                .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
                .setTitle(client.embeds.BLACKLIST.CHECKBLACKLIST.BLACKLISTED.Title)
                .setDescription(`${client.embeds.BLACKLIST.CHECKBLACKLIST.BLACKLISTED.Description}`.replace("<user>", `${usuario}`).replace("<reason>", `${data.reason}`))
            interaction.reply({ embeds: [blacklisted], ephemeral: client.embeds.BLACKLIST.CHECKBLACKLIST.BLACKLISTED.Ephemeral })


        }
    }
}