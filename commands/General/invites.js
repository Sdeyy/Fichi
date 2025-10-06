const { Client, CommandInteraction } = require("discord.js");
const Discord = require('discord.js')
const UserInvite = require("../../data/models/userInvites")
const duration = require('humanize-duration');
const cooldowns = new Map();

module.exports = {
    name: "invites",
    description: "Invites command.",
    options: [
        {
            name: "check",
            description: "Ver las invitaciones de un usuario",
            type: 1,
            options: [
                {
                    name: 'user',
                    description: 'Usuario del que quieres ver las invites',
                    type: 6,
                    required: false
                },
            ],
        },
        {
            name: "add",
            description: "Ver las invitaciones de un usuario",
            type: 1,
            options: [
                {
                    name: 'user',
                    description: 'Usuario del que quieres añadir invitaciones',
                    type: 6,
                    required: true
                },
                {
                    name: "cantidad",
                    description: "Cantidad de invitaciones a añadir",
                    type: 10,
                    required: true
                }
            ],
        },
        {
            name: "remove",
            description: "Ver las invitaciones de un usuario",
            type: 1,
            options: [
                {
                    name: 'user',
                    description: 'Usuario del que quieres eliminar invitaciones',
                    type: 6,
                    required: true
                },
                {
                    name: "cantidad",
                    description: "Cantidad de invitaciones a remover",
                    type: 10,
                    required: true
                }
            ],
        },
        {
            name: "clear",
            description: "Ver las invitaciones de un usuario",
            type: 1,
            options: [
                {
                    name: 'user',
                    description: 'Usuario del que quieres ver las invites',
                    type: 6,
                    required: true
                },
            ],
        },
        {
            name: "leaderboard",
            description: "Ver la leaderboard de invitaciones",
            type: 1,
        },
    ],

    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {

        if (client.config?.DISABLE_COMMANDS?.DISABLED?.includes("invites")) {
            return interaction.reply({
                content: `${client.language.DISABLED_COMMAND}`,
                ephemeral: true
            })
        }

        const subCommand = interaction.options.getSubcommand(["check", "add", "remove", "clear", "leaderboard"]);

        if (subCommand === "check") {

            const user = interaction.options.getUser("user") || interaction.user;
            const userInvite = await UserInvite.findOne({ userId: user.id });

            if (userInvite) {
                interaction.reply({ content: `${client.language.Invites.hasInvites}`.replace("%user%", user).replace("%invites%", userInvite.invites), ephemeral: true });
            } else {
                interaction.reply({ content: `${client.language.Invites.noHasInvites}`.replace("%user%", user), ephemeral: true });
            }

        } else if (subCommand === "leaderboard") {

            const userId = interaction.user.id;
            const cooldownTime = 2 * 60 * 1000;

            if (cooldowns.has(userId)) {
                const expirationTime = cooldowns.get(userId) + cooldownTime;
                if (Date.now() < expirationTime) {
                    const remainingTime = duration(expirationTime - Date.now(), {
                        language: "es",
                        units: ["h", "m", "s"],
                        round: true,
                    });
                    return interaction.reply({
                        content: `${client.language.Invites.cooldown}`.replace("%remainingTime%", remainingTime),
                        ephemeral: true
                    });
                }
            }

            cooldowns.set(userId, Date.now());

            const member = interaction.options.getUser("user")

            if (member) {

                const userInvite = await UserInvite.findOne({ userId: member });

                if (userInvite) {
                    interaction.reply({ content: `${client.language.Invites.hasInvites}`.replace("%user%", member).replace("%invites%", userInvite.invites), ephemeral: true });
                } else {
                    interaction.reply({ content: `${client.language.Invites.noHasInvites}`.replace("%user%", user), ephemeral: true });
                }
            } else {

                const topUsers = await UserInvite.find().sort({ invites: -1 }).limit(10);

                const leaderboard = new Discord.EmbedBuilder()
                    .setColor(client.embeds.Invites.Leaderboard.Color)
                    .setTitle(client.embeds.Invites.Leaderboard.Title)
                    .setDescription(topUsers.map((user, index) => `${index + 1}. <@${user.userId}> - ${user.invites} invitaciones`).join('\n'))
                    .setTimestamp()
                    .setFooter({ text: client.embeds.Invites.Leaderboard.Footer });

                interaction.reply({ embeds: [leaderboard], ephemeral: false });
            }
        } else if (subCommand === "add") {

            if (!interaction.member.permissions.has("ADMINISTRATOR")) {
                return interaction.reply({ content: client.language.NO_PERMS, ephemeral: true });
            }

            const amount = interaction.options.getNumber("cantidad")

            const member = interaction.options.getUser("user")

            const userInvite = await UserInvite.findOneAndUpdate(
                { userId: member.id },
                { $inc: { invites: amount } },
                { new: true, upsert: true }
            );

            const embed = new Discord.EmbedBuilder()
                .setColor(client.embeds.Invites.AddInvites.Color)
                .setTitle(client.embeds.Invites.AddInvites.Title)
                .setDescription(`${client.embeds.Invites.AddInvites.Description}`.replace("%user%", member).replace("%invites%", userInvite.invites))
                .setTimestamp()
                .setFooter({ text: client.embeds.Invites.AddInvites.Footer });

            interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (subCommand === "remove") {

            if (!interaction.member.permissions.has("ADMINISTRATOR")) {
                return interaction.reply({ content: client.language.NO_PERMS, ephemeral: true });
            }

            const amount = interaction.options.getNumber("cantidad")

            const member = interaction.options.getUser("user")

            const userInvite = await UserInvite.findOne({ userId: member.id });

            if (userInvite) {
                const newAmount = Math.max(userInvite.invites - amount, 0);
                await UserInvite.findOneAndUpdate(
                    { userId: member.id },
                    { $set: { invites: newAmount } },
                    { new: true }
                );

                const embed = new Discord.EmbedBuilder()
                    .setColor(client.embeds.Invites.RemoveInvites.Color)
                    .setTitle(client.embeds.Invites.RemoveInvites.Title)
                    .setDescription(`${client.embeds.Invites.RemoveInvites.Description}`.replace("%user%", member).replace("%amout%", newAmount))
                    .setTimestamp()
                    .setFooter({ text: client.embeds.Invites.RemoveInvites.Footer });

                interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                interaction.reply({ content: `<@${member.id}> no tiene invitaciones.`, ephemeral: true });
            }
        } else if (subCommand === 'clear') {

            if (!interaction.member.permissions.has("ADMINISTRATOR")) {
                return interaction.reply({ content: client.language.NO_PERMS, ephemeral: true });
            }

            const member = interaction.options.getUser("user")

            await UserInvite.findOneAndUpdate(
                { userId: member.id },
                { $set: { invites: 0 } },
                { new: true, upsert: true }
            );

            const embed = new Discord.EmbedBuilder()
                .setColor(client.embeds.Invites.ClearInvites.Color)
                .setTitle(client.embeds.Invites.ClearInvites.Title)
                .setDescription(`${client.embeds.Invites.ClearInvites.Description}`.replace("%user%", member))
                .setTimestamp()
                .setFooter({ text: client.embeds.Invites.ClearInvites.Footer });

            interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};