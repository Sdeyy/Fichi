const Discord = require('discord.js');
const ms = require("ms");
const TempRole = require('../../data/models/tempRole');
const checkExpiredRoles = require("../../functions/checkTempRoles");
const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    name: "role",
    description: "Add temp/perm role to a user",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "list",
            type: ApplicationCommandOptionType.Subcommand,
            description: "List Roles",
        },
        {
            name: 'add-temp',
            description: 'temporarily adds a role to a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'User to add rol',
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: 'role',
                    description: 'Role to be given to the user',
                    type: ApplicationCommandOptionType.Role,
                    required: true
                },
                {
                    name: 'time',
                    description: 'Amount of time for which you will be given the role',
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
            ]
        },
        {
            name: 'check-time',
            description: 'Revisar cuánto tiempo le queda a los roles temporales de un usuario',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'El usuario al que revisar los roles temporales',
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
            ],
        },
        {
            name: "force-check",
            description: "Tira un check forzado a la base de datos para que se quiten los roles",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "add",
            description: "Adds a role PERMANENTLY to a user",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "user",
                    description: "User to be given the role",
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: "role",
                    description: "Role to be given to the user",
                    type: ApplicationCommandOptionType.Role,
                    required: true
                },
            ]
        },
        {
            name: "remove",
            description: "Removes a role to a user",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "user",
                    description: "User to be removed the role",
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: "role",
                    description: "Role to be removed to ther user",
                    type: ApplicationCommandOptionType.Role,
                    required: true
                }
            ]
        }
    ],
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {

        const subCommand = interaction.options.getSubcommand(["list", "add-temp", "check-time", "force-check", "remove", "add"])

        if (subCommand == "add-temp") {
            if (!interaction.member.permissions.has("MANAGE_ROLES")) {
                return interaction.reply({ content: client.language.NO_PERMS, ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            const role = interaction.options.getRole('role');
            const time = interaction.options.getString('time');
            const member = interaction.guild.members.cache.get(user.id);
            const guildMember = await interaction.guild.members.fetch(user.id);

            if (!member) {
                return interaction.reply({ content: "Member not found", ephemeral: true });
            }

            const existingTempRole = await TempRole.findOne({
                guildId: interaction.guild.id,
                userId: user.id,
                roleId: role.id
            });

            if (existingTempRole) {
                const newExpiresAt = new Date(existingTempRole.expiresAt.getTime() + ms(time));
                existingTempRole.expiresAt = newExpiresAt;
                await existingTempRole.save();

                await interaction.reply({ content: `El tiempo del rol temporal **${role.name}** para **${user.tag}** ha sido extendido por ${time}.`, ephemeral: true });
            } else {
                await guildMember.roles.add(role, "Role added by " + interaction.user.tag + " [" + time + "]");
                const expiresAt = new Date(Date.now() + ms(time));

                await TempRole.create({
                    guildId: interaction.guild.id,
                    userId: user.id,
                    roleId: role.id,
                    expiresAt: expiresAt,
                });

                await interaction.reply({ content: `${client.language.TempRoles.Added}`.replace("%role%", role).replace("%roleName%", role.name).replace("%user%", user).replace("%userTag%", user.tag).replace("%userID%", user.id).replace("%time%", time), ephemeral: true });
            }
        } else if (subCommand === 'check-time') {

            if (!interaction.member.permissions.has("MANAGE_ROLES")) {
                return interaction.reply({ content: client.language.NO_PERMS, ephemeral: true })
            }

            const user = interaction.options.getUser('user');
            const member = interaction.guild.members.cache.get(user.id);
            if (!member) {
                return interaction.reply({ content: "Member not found", ephemeral: true })
            }

            const tempRoles = await TempRole.find({
                guildId: interaction.guild.id,
                userId: user.id,
            });

            if (tempRoles.length > 0) {
                const now = new Date();
                let description = '';

                for (const tempRole of tempRoles) {
                    const role = interaction.guild.roles.cache.get(tempRole.roleId);
                    const expiresAt = new Date(tempRole.expiresAt);
                    const remainingTime = expiresAt - now;

                    if (role) {
                        if (remainingTime > 0) {
                            const days = Math.floor(remainingTime / (24 * 3600000));
                            const hours = Math.floor((remainingTime % (24 * 3600000)) / 3600000);
                            const minutes = Math.floor((remainingTime % 3600000) / 60000);
                            const seconds = Math.floor((remainingTime % 60000) / 1000);

                            description += `${role}: Expira en ${days}d ${hours}h ${minutes}m ${seconds}s\n`;
                        } else {
                            description += `${role}: Expirado\n`;
                        }
                    } else {
                        description += `Rol desconocido (ID: ${tempRole.roleId}): ${remainingTime > 0 ? `Expira en ${days}d ${hours}h ${minutes}m ${seconds}s` : `Expirado`}\n`;
                    }
                }

                const embed = new Discord.EmbedBuilder()
                    .setColor("#f27405")
                    .setTitle(`Roles temporales de ${user.tag}`)
                    .setDescription(description);

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({ content: client.language.TempRoles.NotFoundRoles, ephemeral: true });
            }
        } else if (subCommand == "add") {

            if (!interaction.member.permissions.has("MANAGE_ROLES")) {
                return interaction.reply({ content: client.language.NO_PERMS, ephemeral: true })
            }

            const role = interaction.options.getRole('role');
            const usuario = interaction.options.getMember("user")
            const member = interaction.guild.members.cache.get(usuario.id);

            if (role.position >= interaction.guild.members.me.roles.highest) {
                return interaction.reply({ content: `${client.language.NO_PERMSROLEHIGHER}`, ephemeral: true });
            } else if (role.position >= interaction.member.roles.highest) {
                return interaction.reply({ content: `${client.language.NO_PERMSROLEHIGHER}`, ephemeral: true })
            } else if (member.roles.cache.get(role.id)) {
                return interaction.reply({ content: `${client.language.Roles.Already}`.replace("%role%", role).replace("%roleName", role.name).replace("%user%", usuario).replace("%userTag%", usuario.tag), ephemeral: true })
            } else if (!member) {
                return interaction.reply({ content: "Member not found", ephemeral: true })
            }

            usuario.roles.add(role.id, "Role added by " + interaction.user.tag + " [Permanent]");
            const embed = new Discord.EmbedBuilder()
                .setTitle(`Successfully added role`)
                .setDescription(`${role} role has been added to ${usuario}`)
                .setColor(`#f27405`)

            interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (subCommand === "remove") {

            if (!interaction.member.permissions.has("MANAGE_ROLES")) {
                return interaction.reply({ content: client.language.NO_PERMS, ephemeral: true });
            }

            const role = interaction.options.getRole('role');
            const usuario = interaction.options.getMember("user");
            const member = interaction.guild.members.cache.get(usuario.id);

            if (!member) {
                return interaction.reply({ content: "Member not found", ephemeral: true });
            }

            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({ content: `${client.language.NO_PERMSROLEHIGHER}`, ephemeral: true });
            } else if (role.position >= interaction.member.roles.highest.position) {
                return interaction.reply({ content: `${client.language.NO_PERMSROLEHIGHER}`, ephemeral: true });
            } else if (!member.roles.cache.has(role.id)) {
                return interaction.reply({
                    content: `${client.language.Roles.NoHaveRole}`
                        .replace("%role%", role)
                        .replace("%roleName", role.name)
                        .replace("%user%", usuario)
                        .replace("%userTag%", usuario.user.tag),
                    ephemeral: true
                });
            }

            const tempRole = await TempRole.findOne({
                guildId: interaction.guild.id,
                userId: usuario.id,
                roleId: role.id,
            });

            if (tempRole) {

                await TempRole.deleteOne({
                    guildId: interaction.guild.id,
                    userId: usuario.id,
                    roleId: role.id,
                });
            }

            await usuario.roles.remove(role.id, "Role removed by " + interaction.user.tag);

            const embed2 = new Discord.EmbedBuilder()
                .setTitle(`Successfully removed role`)
                .setDescription(`${role} role has been removed from ${usuario}`)
                .setColor(`#f27405`);

            interaction.reply({ embeds: [embed2], ephemeral: true });
        } else if (subCommand == "list") {

            let roles = interaction.guild.roles.cache;

            roles = roles.sort((a, b) => b.position - a.position);

            const embed = new Discord.EmbedBuilder()
                .setColor(`${client.config.EMBEDCOLOR}`)
                .setDescription(
                    roles.map(role => `<@&${role.id}>`).join('\n')
                )

            interaction.reply({ embeds: [embed], ephemeral: true });
        } else if (subCommand == "force-check") {

            if (!interaction.member.permissions.has("MANAGE_ROLES")) {
                return interaction.reply({ content: client.language.NO_PERMS, ephemeral: true })
            }

            await checkExpiredRoles(interaction.client);
            await interaction.reply({ content: client.language.TempRoles.CheckExpiredRoles });
        }

    }
}