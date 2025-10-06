const ecoSchema = require('../../data/models/economy');

module.exports = {
    name: "remove-money",
    description: "Remove money from a user (Admin only).",
    options: [
        {
            name: "user",
            description: "User to remove money from.",
            type: 6,
            required: true
        },
        {
            name: "amount",
            description: "Amount to remove.",
            type: 4,
            required: true
        }
    ],
    run: async (client, interaction, args) => {
        if (client.config?.DISABLE_COMMANDS?.DISABLED?.includes("remove-money")) return interaction.reply({
            content: `${client.language.DISABLED_COMMAND}`,
            ephemeral: true
        });

        if (!interaction.member.permissions.has('ADMINISTRATOR')) return interaction.reply({ content: 'You need Administrator permission to use this command!', ephemeral: true });

        const user = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        if (amount <= 0)
            return interaction.reply({
                content: `${client.language.Economy.AmountMustBePositive}`
            });

        let data = await ecoSchema.findOne({ userID: user.id });
        if (!data) {
            data = await ecoSchema.create({ userID: user.id });
        }

        if (data.money < amount)
            return interaction.reply({
                content: `${client.language.Economy.UserNotEnoughMoney}`
            });

        await ecoSchema.findOneAndUpdate({ userID: user.id }, {
            $inc: { money: -amount }
        });

        interaction.reply({
            content: `${client.language.Economy.RemoveMoneySuccess}`
                .replaceAll("<amount>", amount)
                .replaceAll("<userTag>", user.tag)
        });
    }
}
