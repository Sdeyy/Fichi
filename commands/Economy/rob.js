const ecoSchema = require('../../data/models/economy');
const Discord = require('discord.js');
const duration = require('humanize-duration');

module.exports = {
    name: "rob",
    description: "Attempt to rob another user.",
    cooldown: "5m",
    options: [
        {
            name: "user",
            description: "User to rob.",
            type: 6,
            required: true
        }
    ],
    run: async (client, interaction, args) => {
        if(client.config.DISABLE_COMMANDS.DISABLED.includes("rob")) return interaction.reply({
            content: `${client.messages.DISABLED_COMMAND}`,
            ephemeral: true
        });

        const target = interaction.options.getUser("user");
        if(target.id === interaction.user.id) return interaction.reply({content: 'You can\'t rob yourself!'});
        if(target.bot) return interaction.reply({content: 'You can\'t rob bots!'});

        let robberData = await ecoSchema.findOne({userID: interaction.user.id});
        if(!robberData) {
            robberData = await ecoSchema.create({userID: interaction.user.id});
        }

        let targetData = await ecoSchema.findOne({userID: target.id});
        if(!targetData) {
            targetData = await ecoSchema.create({userID: target.id});
        }

        if(targetData.money < 100) return interaction.reply({content: 'The target doesn\'t have enough money to rob!'});

        const success = Math.random() > 0.5;
        const amount = Math.floor(Math.random() * Math.min(targetData.money, 500)) + 1;

        if(success) {
            await ecoSchema.findOneAndUpdate({userID: interaction.user.id}, {
                $inc: {money: amount, totalEarned: amount},
                daily: Date.now()
            });
            await ecoSchema.findOneAndUpdate({userID: target.id}, {
                $inc: {money: -amount}
            });
            interaction.reply({content: `You successfully robbed ${target.tag} for ${amount} coins!`});
        } else {
            const fine = Math.floor(amount / 2);
            await ecoSchema.findOneAndUpdate({userID: interaction.user.id}, {
                $inc: {money: -fine},
                daily: Date.now()
            });
            interaction.reply({content: `You failed to rob ${target.tag} and paid a fine of ${fine} coins!`});
        }
    }
}
