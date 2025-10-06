const ecoSchema = require('../../data/models/economy');
const shopSchema = require('../../data/models/shop');

module.exports = {
    name: "buy",
    description: "Buy an item from the shop.",
    cooldown: "1m",
    options: [
        {
            name: "itemid",
            description: "The ID of the item to buy.",
            type: 3,
            required: true,
            autocomplete: true
        }
    ],
    run: async (client, interaction, args) => {
        if (client.config?.DISABLE_COMMANDS?.DISABLED?.includes("buy")) return interaction.reply({
            content: `${client.language.DISABLED_COMMAND}`,
            flags: 64
        });

        const itemID = interaction.options.getString("itemid");
        const item = await shopSchema.findOne({ itemID: itemID });
        if (!item) return interaction.reply({ content: 'Item not found!', flags: 64 });

        let data = await ecoSchema.findOne({ userID: interaction.user.id });
        if (!data) {
            data = await ecoSchema.create({ userID: interaction.user.id });
        }

        if (data.money < item.price)
            return interaction.reply({
                content: `${client.language.Economy.NotEnoughMoney}`,
                flags: 64
            });


        await ecoSchema.findOneAndUpdate({ userID: interaction.user.id }, {
            $inc: { money: -item.price, totalSpent: item.price },
            $push: item.type === 'role' ? { inventory: item.itemID } : { badges: item.value }
        });

        if (item.type === 'role') {
            const role = interaction.guild.roles.cache.get(item.value);
            if (role) {
                await interaction.member.roles.add(role);
            }
        }

        interaction.reply({
            content: `${client.language.Economy.ItemBought}`
                .replaceAll("<itemName>", item.name)
                .replaceAll("<itemPrice>", item.price),
        });
    },

    autocomplete: async (client, interaction) => {
        const focusedValue = interaction.options.getFocused();
        const choices = await shopSchema.find({}).limit(25);
        const filtered = choices.filter(choice => choice.itemID.toLowerCase().startsWith(focusedValue.toLowerCase()));
        await interaction.respond(
            filtered.map(choice => ({ name: choice.name, value: choice.itemID })).slice(0, 25)
        );
    }
}
