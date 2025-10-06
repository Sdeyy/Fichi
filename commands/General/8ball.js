const Discord = require('discord.js')

module.exports = {
    name: "8ball",
    description: "Ask the bot a question..",
    cooldown: "2m",
    options: [
        {
            name: 'question',
            description: 'Question',
            type: 3,
            required: true
        },
    ],

    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {

        if (client.config?.DISABLE_COMMANDS?.DISABLED?.includes("8ball")) {
            return interaction.reply({
                content: `${client.language.DISABLED_COMMAND}`,
                ephemeral: true
            })
        }

        const mensaje = interaction.options.getString('question');

        let respuestas = client.config.BALL.CONFIG;

        const ball = new Discord.EmbedBuilder()
            .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
            .setTitle('**:8ball: 8BALL**')
            .addFields(
                {
                    name: `**» Question:**`,
                    value: ` ${mensaje}`,
                    inline: false
                },
                {
                    name: "**» Answer:**",
                    value: ` ${respuestas[(Math.floor(Math.random() * respuestas.length))]}.`,
                    inline: false
                }
            )
        interaction.reply({ embeds: [ball] })

    },
};