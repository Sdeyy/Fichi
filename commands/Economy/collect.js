const ecoSchema = require('../../data/models/economy');

module.exports = {
    name: "collect",
    description: "Collect money based on your roles.",
    cooldown: "24h",
    run: async (client, interaction, args) => {
        if (client.config?.DISABLE_COMMANDS?.DISABLED?.includes("collect")) return interaction.reply({
            content: `${client.language.DISABLED_COMMAND}`,
            flags: 64
        });

        let data = await ecoSchema.findOne({ userID: interaction.user.id });
        if (!data) {
            data = await ecoSchema.create({ userID: interaction.user.id });
        }

        const collectRoles = client.config.ECONOMY?.COLLECT_ROLES || {};
        let totalCollect = 0;
        let roleLines = [];

        interaction.member.roles.cache.forEach(role => {
            if (collectRoles[role.id]) {
                const amount = collectRoles[role.id];
                totalCollect += amount;
                roleLines.push(`${role.toString()}: ${amount} coins`);
            }
        });

        if (totalCollect === 0) {
            return interaction.reply({
                content: `${client.language.Economy.NoCollectRoles}`,
                flags: 64
            });

        }

        roleLines.push(`**Total:** ${totalCollect} coins`);

        return interaction.reply({
            content: roleLines.join('\n'),
            allowedMentions: { parse: [] },
            flags: 64
        });
    }
}
