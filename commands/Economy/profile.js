const ecoSchema = require('../../data/models/economy');
const Discord = require('discord.js');

module.exports = {
    name: "profile",
    description: "View your or another user's economy profile.",
    cooldown: "1m",
    options: [
        {
            name: "user",
            description: "User to view profile.",
            type: 6,
            required: false
        }
    ],
    run: async (client, interaction, args) => {
        if(client.config.DISABLE_COMMANDS.DISABLED.includes("profile")) return interaction.reply({
            content: `${client.messages.DISABLED_COMMAND}`,
            ephemeral: true
        });

        const user = interaction.options.getUser("user") || interaction.user;
        if(user.bot) return interaction.reply({content: `${client.messages.ECONOMY.BOTS_MONEY}`});

        let data = await ecoSchema.findOne({userID: user.id});
        if(!data) {
            data = await ecoSchema.create({userID: user.id});
        }

        const embed = new Discord.EmbedBuilder()
            .setAuthor({name: `${user.tag}'s Profile`, iconURL: user.displayAvatarURL({dynamic: true})})
            .setColor(Discord.Colors.Green)
            .addFields([
                {name: 'Wallet', value: `${data.money} coins`, inline: false},
                {name: 'Bank', value: `${data.bank} coins`, inline: false},
                {name: 'Total Earned', value: `${data.totalEarned} coins`, inline: false},
                {name: 'Total Spent', value: `${data.totalSpent} coins`, inline: false},
                {name: 'Inventory', value: data.inventory.length > 0 ? `${data.inventory.length} items` : 'Empty', inline: false}
            ]);

        interaction.reply({embeds: [embed]});
    }
}
