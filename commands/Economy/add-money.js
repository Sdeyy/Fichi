const ecoSchema = require('../../data/models/economy');

module.exports = {
    name: "add-money",
    description: "Add money to a user (Admin only).",
    options: [
        {
            name: "user",
            description: "User to add money to.",
            type: 6,
            required: true
        },
        {
            name: "amount",
            description: "Amount to add.",
            type: 4,
            required: true
        }
    ],
    run: async (client, interaction, args) => {
        if (client.config.DISABLE_COMMANDS.DISABLED.includes("add-money")) return interaction.reply({
            content: `${client.language.DISABLED_COMMAND}`,
            flags: 64
        });

        if (!interaction.member.permissions.has('ADMINISTRATOR')) return interaction.reply({ content: 'You need Administrator permission to use this command!', ephemeral: true });

        const user = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        if (amount <= 0) return interaction.reply({ content: 'Amount must be positive!', flags: 64 });

        let data = await ecoSchema.findOne({ userID: user.id });
        if (!data) {
            data = await ecoSchema.create({ userID: user.id });
        }

        await ecoSchema.findOneAndUpdate({ userID: user.id }, {
            $inc: { money: amount }
        });

        interaction.reply({
            content: `${client.language.Economy.MoneyAdded}`
                .replaceAll("<amount>", amount)
                .replaceAll("<userTag>", user.tag),
            flags: 64
        });
    }
}
