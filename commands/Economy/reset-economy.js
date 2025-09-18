const ecoSchema = require('../../data/models/economy');

module.exports = {
    name: "reset-economy",
    description: "Reset the entire economy database (Admin only).",
    run: async (client, interaction, args) => {
        if(client.config.DISABLE_COMMANDS.DISABLED.includes("reset-economy")) return interaction.reply({
            content: `${client.messages.DISABLED_COMMAND}`,
            ephemeral: true
        });

        if(!interaction.member.permissions.has('ADMINISTRATOR')) return interaction.reply({content: 'You need Administrator permission to use this command!', ephemeral: true});

        await ecoSchema.deleteMany({});

        interaction.reply({content: 'Economy database has been reset!'});
    }
}
