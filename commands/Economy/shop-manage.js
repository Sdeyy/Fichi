const shopSchema = require('../../data/models/shop');
const Discord = require('discord.js');

module.exports = {
    name: "shop-manage",
    description: "Manage shop items (Admin only).",
    options: [
        {
            name: "add",
            description: "Add an item to the shop.",
            type: 1,
            options: [
                {
                    name: "itemid",
                    description: "Unique ID for the item.",
                    type: 3,
                    required: true
                },
                {
                    name: "name",
                    description: "Name of the item.",
                    type: 3,
                    required: true
                },
                {
                    name: "description",
                    description: "Description of the item.",
                    type: 3,
                    required: true
                },
                {
                    name: "price",
                    description: "Price in coins.",
                    type: 10,
                    required: true
                },
                {
                    name: "type",
                    description: "Type: role.",
                    type: 3,
                    required: true,
                    choices: [
                        {name: 'Role', value: 'role'}
                    ]
                },
                {
                    name: "value",
                    description: "Role.",
                    type: 8,
                    required: true
                }
            ]
        },
        {
            name: "remove",
            description: "Remove an item from the shop.",
            type: 1,
            options: [
                {
                    name: "itemid",
                    description: "ID of the item to remove.",
                    type: 3,
                    required: true
                }
            ]
        }
    ],
    run: async (client, interaction, args) => {
        if(client.config.DISABLE_COMMANDS.DISABLED.includes("shop-manage")) return interaction.reply({
            content: `${client.messages.DISABLED_COMMAND}`,
            ephemeral: true
        });

        if(!interaction.member.permissions.has("ADMINISTRATOR")) return interaction.reply({content: `${client.messages.NO_PERMSUSER}`, ephemeral: true});

        const sub = interaction.options.getSubcommand();

        if(sub === 'add') {
            const itemID = interaction.options.getString("itemid");
            const name = interaction.options.getString("name");
            const desc = interaction.options.getString("description");
            const price = interaction.options.getNumber("price");
            const type = interaction.options.getString("type");
            let value = interaction.options.getRole("value");
            value = value.id;

            const existing = await shopSchema.findOne({itemID: itemID});
            if(existing) return interaction.reply({content: 'Item ID already exists!'});

            await shopSchema.create({
                itemID, name, description: desc, price, type, value
            });

            interaction.reply({content: `Added ${name} to the shop!`});
        } else if(sub === 'remove') {
            const itemID = interaction.options.getString("itemid");

            const item = await shopSchema.findOneAndDelete({itemID: itemID});
            if(!item) return interaction.reply({content: 'Item not found!'});

            interaction.reply({content: `Removed ${item.name} from the shop!`});
        }
    }
}
