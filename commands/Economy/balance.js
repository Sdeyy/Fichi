const ecoSchema = require('../../data/models/economy');
const Discord = require('discord.js');

module.exports = {
    name: "balance",
    description: "See all the money you got.",
    cooldown: "1m",
    options: [
    {
       name: "user",
       description: "View user balance.",
       type: 6,
       required: false
    },
    ],
    run: async (client, interaction, args) => {

        if(client.config.DISABLE_COMMANDS.DISABLED.includes("balance")) return interaction.reply({ 
            content: `${client.language.DISABLED_COMMAND}`, 
            flags: 64
        })

        const user = interaction.options.getUser("user") || interaction.user;
        if(user.bot) return interaction.reply({content: `${client.language.ECONOMY.BOTS_MONEY}`});

        let data = await ecoSchema.findOne({userID: user.id});
        if(!data) {
            data = await ecoSchema.create({userID: user.id});
        }

        interaction.reply({
            embeds: [new Discord.EmbedBuilder()
            .setAuthor({name: `${user.tag}`, iconURL: user.displayAvatarURL({dynamic: true})})
            .setDescription(`Money: ${data.money}
Bank: ${data.bank}

Use \`/profile\` for more details.`)
            .setColor(Discord.Colors.Aqua)
            ]
        })
    }
}