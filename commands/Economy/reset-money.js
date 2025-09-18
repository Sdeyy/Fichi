const ecoSchema = require('../../data/models/economy');

module.exports = {
    name: "reset-money",
    description: "Reset a user's money to default (Admin only).",
    options: [
        {
            name: "user",
            description: "User to reset money.",
            type: 6,
            required: true
        }
    ],
    run: async (client, interaction, args) => {
        if(client.config.DISABLE_COMMANDS.DISABLED.includes("reset-money")) return interaction.reply({
            content: `${client.messages.DISABLED_COMMAND}`,
            ephemeral: true
        });

        if(!interaction.member.permissions.has('ADMINISTRATOR')) return interaction.reply({content: 'You need Administrator permission to use this command!', ephemeral: true});

        const user = interaction.options.getUser("user");

        await ecoSchema.findOneAndUpdate({userID: user.id}, {
            money: 500,
            bank: 100,
            daily: null,
            work: null,
            inventory: [],
            badges: [],
            totalEarned: 0,
            totalSpent: 0
        }, {upsert: true});

        interaction.reply({content: `Reset money and economy data for ${user.tag}.`});
    }
}
