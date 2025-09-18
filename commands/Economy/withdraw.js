const ecoSchema = require('../../data/models/economy');
const Discord = require('discord.js');

module.exports = {
    name: "withdraw",
    description: "Withdraw money from bank to wallet.",
    cooldown: "1m",
    options: [
        {
            name: "amount",
            description: "Amount to withdraw (or 'all' for everything).",
            type: 3,
            required: true
        }
    ],
    run: async (client, interaction, args) => {
        if (client.config.DISABLE_COMMANDS.DISABLED.includes("withdraw")) return interaction.reply({
            content: `${client.language.DISABLED_COMMAND}`,
            ephemeral: true
        });

        let data = await ecoSchema.findOne({ userID: interaction.user.id });
        if (!data) {
            data = await ecoSchema.create({ userID: interaction.user.id });
        }

        const amountStr = interaction.options.getString("amount");
        let amount;
        if (amountStr.toLowerCase() === 'all') {
            amount = data.bank;
        } else {
            amount = parseInt(amountStr);
            if (isNaN(amount) || amount <= 0) return interaction.reply({
                content: `${client.language.Economy.WithdrawInvalidAmount}`
            });
        }

        if (amount > data.bank) return interaction.reply({
            content: `${client.language.Economy.WithdrawNotEnoughBank}`
        });

        await ecoSchema.findOneAndUpdate({ userID: interaction.user.id }, {
            $inc: { money: amount, bank: -amount }
        });

        interaction.reply({
            content: `${client.language.Economy.WithdrawSuccess}`.replaceAll("<amount>", amount)
        });
    }
}
