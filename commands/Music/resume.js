const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: "resume",
  description: "Resume the paused song",
  cooldown: "3s",

  run: async (client, interaction, args) => {

    if (client.config.DISABLE_COMMANDS.DISABLED.includes("resume"))
      return interaction.reply({
        content: client.messages.DISABLED_COMMAND,
        ephemeral: true,
      });

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel)
  return interaction.reply({
    content: client.language.Music.Resume.MustBeInVC,
    ephemeral: true,
  });

    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue)
  return interaction.reply({
    content: client.language.Music.Resume.NoQueue,
    ephemeral: true,
  });

    if (!queue.paused)
  return interaction.reply({
    content: client.language.Music.Resume.NotPaused,
    ephemeral: true,
  });

    try {

      await queue.resume();

      const embed = new EmbedBuilder()
  .setColor("Green")
  .setDescription(client.language.Music.Resume.Resumed);

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error resuming the song:", error);
      return interaction.reply({
        content: "There was an error trying to resume the song.",
        ephemeral: true,
      });
    }
  }
};
