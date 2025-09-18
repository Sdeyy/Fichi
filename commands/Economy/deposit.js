const ecoSchema = require('../../data/models/economy');

module.exports = {
    name: "deposit",
    description: "Deposit money from wallet to bank.",
    cooldown: "1m",
    options: [
        {
            name: "amount",
            description: "Amount to deposit (or 'all' for everything).",
            type: 3,
            required: true
        }
    ],
    run: async (client, interaction, args) => {
        if(client.config.DISABLE_COMMANDS.DISABLED.includes("deposit")) return interaction.reply({
            content: `${client.messages.DISABLED_COMMAND}`,
            ephemeral: true
        });

        let data = await ecoSchema.findOne({userID: interaction.user.id});
        if(!data) {
            data = await ecoSchema.create({userID: interaction.user.id});
        }

        const amountStr = interaction.options.getString("amount");
        let amount;
        if(amountStr.toLowerCase() === 'all') {
            amount = data.money;
        } else {
            amount = parseInt(amountStr);
            if(isNaN(amount) || amount <= 0) return interaction.reply({content: 'Invalid amount!'});
        }

        if(amount > data.money) return interaction.reply({content: 'You don\'t have enough money in your wallet!'});

        await ecoSchema.findOneAndUpdate({userID: interaction.user.id}, {
            $inc: {money: -amount, bank: amount}
        });

        interaction.reply({content: `Deposited ${amount} coins to your bank!`});
    }
}
