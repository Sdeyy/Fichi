const shopSchema = require('../../data/models/shop');
const Discord = require('discord.js');
const trim = (str, max) => str.length > max ? str.slice(0, max - 3) + '...' : str;
module.exports = {
    name: "shop",
    description: "View available items in the shop.",
    cooldown: "1m",
    run: async (client, interaction, args) => {
        if (client.config.DISABLE_COMMANDS.DISABLED.includes("shop")) return interaction.reply({
            content: `${client.language.DISABLED_COMMAND}`,
            ephemeral: true
        });

        const items = await shopSchema.find({});
        if (items.length === 0) return interaction.reply({ content: 'The shop is empty!' });

        const embed = new Discord.EmbedBuilder()
            .setTitle('Shop')
            .setColor(Discord.Colors.Blurple)
            .setDescription('Use `/buy <itemID>` to purchase an item.');

        items.forEach(item => {
            embed.addFields({
                name: trim(`${item.name} (${item.itemID})`, 256),
                value: trim(`${item.description}\nPrice: ${item.price} coins\nType: ${item.type}`, 1024),
                inline: false
            });
        });

        interaction.reply({ embeds: [embed] });
    }
}
