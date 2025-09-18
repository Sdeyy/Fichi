const ecoSchema = require('../../data/models/economy');
const Discord = require('discord.js');

module.exports = {
    name: "leaderboard",
    description: "View the economy leaderboard.",
    cooldown: "1m",
    run: async (client, interaction, args) => {
        if (client.config.DISABLE_COMMANDS.DISABLED.includes("leaderboard")) {
            return interaction.reply({
                content: `${client.messages.DISABLED_COMMAND}`,
                ephemeral: true
            });
        }

        const users = await ecoSchema.aggregate([
            {
                $addFields: {
                    total: { $add: ["$money", "$bank"] }
                }
            },
            {
                $sort: { total: -1 }
            },
            {
                $limit: 10
            }
        ]);

        let description = '';
        for (let i = 0; i < users.length; i++) {
            const user = await client.users.fetch(users[i].userID).catch(() => null);
            const total = users[i].total || 0;
            description += `${i + 1}. ${user ? user.tag : 'Unknown'} - ${total} coins\n`;
        }

        const embed = new Discord.EmbedBuilder()
            .setTitle('Economy Leaderboard')
            .setDescription(description || 'No users found.')
            .setColor(Discord.Colors.Gold);

        interaction.reply({ embeds: [embed] });
    }
}
