const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const client = require("../index");
const rrModel = require("../data/models/reactionRoles");

client.on("interactionCreate", async (interaction) => {

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId !== "autoroles") return;
        if (client.config.REACTION_ROLES.ENABLED == false) return;

        const roleId = interaction.values[0];
        const role = interaction.guild.roles.cache.get(roleId);
        const hasRole = interaction.member.roles.cache.has(roleId);
        await interaction.deferUpdate();

        if (hasRole) {

            const desc = `${client.embeds.ReactionRoles.Removed.Description}`.replace("<role>", role);
            const embed = new EmbedBuilder()
                .setTitle(client.embeds.ReactionRoles.Removed.Title)
                .setColor(client.embeds.ReactionRoles.Removed.Color)
                .setDescription(desc);
            await interaction.followUp({ embeds: [embed], ephemeral: true });
            await interaction.member.roles.remove(roleId);

        } else {

            const desc = `${client.embeds.ReactionRoles.Added.Description}`.replace("<role>", role);
            const embed = new EmbedBuilder()
                .setTitle(client.embeds.ReactionRoles.Added.Title)
                .setColor(client.embeds.ReactionRoles.Added.Color)
                .setDescription(desc);
            await interaction.followUp({ embeds: [embed], ephemeral: true });
            await interaction.member.roles.add(roleId);

        }

        const guildData = await rrModel.findOne({ guildID: interaction.guild.id });
        if (!guildData?.roles) {

            return interaction.reply({ content: "There are no autoroles set up for this server.", ephemeral: true });

        } else {

            const options = guildData.roles.map(x => {
                const role = interaction.guild.roles.cache.get(x.roleId);
                if (!role) return null;
                return {
                    label: role.name,
                    value: role.id,
                    description: x.roleDescription || '',
                    emoji: x.roleEmoji || ''
                };

            }).filter(option => option !== null);

            if (options.length === 0) {
                return interaction.reply({ content: "There are no autoroles set up for this server.", ephemeral: true });
            }

            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("autoroles")
                    .setMaxValues(1)
                    .addOptions(options)
            );

            try {
                await interaction.message.edit({ components: [row] });
            } catch (error) {
                console.error('Error editing message:', error);
                await interaction.reply({ content: "There was an error updating the select menu. Check the console or contact an admin.", ephemeral: true });
            }
        }
    }
});
