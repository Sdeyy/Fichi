const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: "pause",
  description: "Pause the currently playing song",
  cooldown: "3s",

  run: async (client, interaction, args) => {

    if (client.config.DISABLE_COMMANDS.DISABLED.includes("pause"))
      return interaction.reply({
        content: client.language.DISABLED_COMMAND,
        ephemeral: true,
      });

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel)
      return interaction.reply({
        content: client.language.Music.Pause.MustBeInVC,
        ephemeral: true,
      });

    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue)
      return interaction.reply({
        content: client.language.Music.Pause.Nothing,
        ephemeral: true,
      });

    if (queue.paused)
      return interaction.reply({
        content: client.language.Music.Pause.AlreadyPaused,
        ephemeral: true,
      });

    try {

      await queue.pause();

      const embed = new EmbedBuilder()
        .setColor("Yellow")
        .setDescription(client.language.Music.Pause.Paused);

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error pausing the song:", error);
      return interaction.reply({
        content: "There was an error trying to pause the song.",
        ephemeral: true,
      });
    }
  }
};
