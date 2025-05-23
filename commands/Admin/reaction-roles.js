const { CommandInteraction, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const rrModel = require("../../data/models/reactionRoles");

module.exports = {
    name: "reaction-roles",
    description: "Manage autoroles",
    options: [
        {
            name: 'add',
            description: 'Add an autorole',
            type: 1,
            options: [
                {
                    name: 'role',
                    description: 'The role to add',
                    type: 8,
                    required: true
                },
                {
                    name: 'description',
                    description: 'The description of the role',
                    type: 3,
                    required: false
                },
                {
                    name: 'emoji',
                    description: 'The emoji to use',
                    type: 3,
                    required: false
                }
            ]
        },
        {
            name: 'remove',
            description: 'Remove an autorole',
            type: 1,
            options: [
                {
                    name: 'role',
                    description: 'The role to remove',
                    type: 8,
                    required: true
                },
            ]
        },
        {
            name: 'panel',
            description: 'Open the autoroles panel',
            type: 1,
            options: [
                {
                    name: 'channel',
                    description: 'The channel to send the panel',
                    type: 7,
                    required: false
                },
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

        if (client.config.DISABLE_COMMANDS.DISABLED.includes("reaction-roles")) return interaction.reply({
            content: `${client.language.DISABLED_COMMAND}`,
            ephemeral: true
        })

        if (client.config.REACTION_ROLES.ENABLED == false) return;

        if (!interaction.member.permissions.has("ADMINISTRATOR")) return interaction.reply({ content: `${client.language.NO_PERMSUSER}`, ephemeral: true });

        const SubCommand = interaction.options.getSubcommand(["add", "remove", "panel"]);

        if (SubCommand == "add") {

            const role = interaction.options.getRole('role');
            const roleDescription = interaction.options.getString('description') || null;
            const roleEmoji = interaction.options.getString('emoji') || null;

            const me = interaction.guild.members.me

            if (role.position >= me.roles.highest) {
                return interaction.reply({ content: "I can't add that role, it's higher than my highest role.", ephemeral: true });
            }

            const guildData = await rrModel.findOne({ guildID: interaction.guild.id });

            const newRole = {
                roleId: role.id,
                roleDescription,
                roleEmoji,
            }

            if (guildData) {
                let roleData = guildData.roles.find((z) => z.roleId == role.id);
                if (roleData) {
                    roleData = newRole;
                } else {
                    guildData.roles = [...guildData.roles, newRole];
                }
                await guildData.save();
            } else {
                await rrModel.create({
                    guildID: interaction.guild.id,
                    roles: newRole
                })
            }
            const embed = new EmbedBuilder()
                .setTitle(client.embeds.ReactionRoles.AddCommand.Title)
                .setDescription(`${client.embeds.ReactionRoles.AddCommand.Description}`.replace("%role%", role))
                .setColor(client.embeds.ReactionRoles.AddCommand.Color)
            interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (SubCommand == "remove") {

            const role = interaction.options.getRole('role');
            const guildData = await rrModel.findOne({ guildID: interaction.guild.id });
            if (!guildData) {
                return interaction.reply({ content: "There are no autoroles set up for this server.", ephemeral: true });
            } else {
                const guildRoles = guildData.roles;
                const findRole = guildRoles.find((z) => z.roleId == role.id);
                if (!findRole) {
                    return interaction.reply({ content: "That role is not in the autoroles.", ephemeral: true });
                } else {
                    const filteredRoles = guildRoles.filter((z) => z.roleId != role.id);
                    guildData.roles = filteredRoles;

                    await guildData.save();
                }
            }
            const embed = new EmbedBuilder()
                .setTitle(client.embeds.ReactionRoles.RemoveCommand.Title)
                .setDescription(`${client.embeds.ReactionRoles.RemoveCommand.Description}`.replace("%role%", role))
                .setColor(client.embeds.ReactionRoles.RemoveCommand.Color)
            interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (SubCommand == "panel") {

            const guildData = await rrModel.findOne({ guildID: interaction.guild.id });
            if (!guildData?.roles) {
                return interaction.reply({ content: "There are no autoroles set up for this server.", ephemeral: true });
            } else {
                const options = guildData.roles.map(x => {
                    const role = interaction.guild.roles.cache.get(x.roleId);
                    if (!role) return;
                    return {
                        label: role.name,
                        value: role.id,
                        description: x.roleDescription,
                        emoji: x.roleEmoji
                    };
                });
                if (options.length == 0) {
                    return interaction.reply({ content: "There are no autoroles set up for this server.", ephemeral: true });
                }
                const embed = new EmbedBuilder()
                    .setTitle(client.config.REACTION_ROLES.EMBED_CONFIG.TITLE)
                    .setDescription(client.config.REACTION_ROLES.EMBED_CONFIG.DESCRIPTION)
                    .setColor(client.config.REACTION_ROLES.EMBED_CONFIG.COLOR)
                    .setFooter({ text: client.config.REACTION_ROLES.EMBED_CONFIG.FOOTER ? client.config.REACTION_ROLES.EMBED_CONFIG.FOOTER : null })
                const components = [
                    new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId("autoroles")
                            .setMaxValues(1)
                            .addOptions(options)
                    )
                ];
                const channel = interaction.options.getChannel('channel') || interaction.channel;
                channel.send({ embeds: [embed], components, });
                interaction.reply({ content: `Sent the panel to ${channel}`, ephemeral: true });
            }
        };
    },
};