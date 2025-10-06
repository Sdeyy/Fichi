const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "skip",
  description: "Skip the currently playing song",
  cooldown: "3s",

  run: async (client, interaction, args) => {
    if (client.config?.DISABLE_COMMANDS?.DISABLED?.includes("skip")) {
      return interaction.reply({
        content: client.language.DISABLED_COMMAND,
        ephemeral: true,
      });
    }

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel)
      return interaction.reply({
        content: client.language.Music.Skip.NoVoiceChannel,
        ephemeral: true,
      });

    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue)
      return interaction.reply({
        content: client.language.Music.Skip.NoQueue,
        ephemeral: true,
      });

    try {
      await queue.skip();

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setDescription(client.language.Music.Skip.Skipped);

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error skipping the song:", error);
      return interaction.reply({
        content: "There was an error trying to skip the song.",
        ephemeral: true,
      });
    }
  },
};
