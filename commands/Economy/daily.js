const ecoSchema = require('../../data/models/economy');

module.exports = {
    name: "daily",
    description: "Claim a daily reward.",
    cooldown: "24h",

    run: async (client, interaction, args) => {

        if(client.config.DISABLE_COMMANDS.DISABLED.includes("daily")) return interaction.reply({ 
            content: `${client.messages.DISABLED_COMMAND}`, 
            ephemeral: true
        })

        let data = await ecoSchema.findOne({userID: interaction.user.id});
        if(!data) {
            data = await ecoSchema.create({userID: interaction.user.id});
        }

        let reward = 350;

        await ecoSchema.findOneAndUpdate({userID: interaction.user.id}, {
            $inc: {
                money: reward,
                totalEarned: reward
            },
            daily: Date.now()
        })
        return interaction.reply({content: `Daily already claimed`.replace(`<amount>`, `${reward}`)})
    }
}