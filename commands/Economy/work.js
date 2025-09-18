const ecoSchema = require('../../data/models/economy')
const duration = require('humanize-duration');
const client = require('../../index')
var works = client.config.ECONOMY.WORKS;

module.exports = {
    name: "work",
    description: "Work and get money.",
    cooldown: client.config.ECONOMY.WORK_COOLDOWN,
    run: async (client, interaction, args) => {

        if (client.config.DISABLE_COMMANDS.DISABLED.includes("work")) return interaction.reply({
            content: `${client.language.DISABLED_COMMAND}`,
            ephemeral: true
        })

        let data = await ecoSchema.findOne({ userID: interaction.user.id });
        if (!data) {
            data = await ecoSchema.create({ userID: interaction.user.id });
        }

        let money = Math.floor(Math.random() * 800) + 200;

        let work = works[Math.floor(Math.random() * works.length)];

        await ecoSchema.findOneAndUpdate({ userID: interaction.user.id }, {
            $inc: {
                money: money,
                totalEarned: money
            },
            work: Date.now()
        })
        return interaction.reply({
            content: `${client.language.Economy.WorkSuccess}`
                .replaceAll("<work>", work)
                .replaceAll("<money>", money)
        });
    }
}
