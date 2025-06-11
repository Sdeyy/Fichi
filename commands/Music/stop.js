const Discord = require("discord.js");

module.exports = {
  name: "stop",
  description: "Stop the music and clear the queue",
  cooldown: "5s",

  run: async (client, interaction, args) => {

    if (client.config.DISABLE_COMMANDS.DISABLED.includes("stop")) {
      return interaction.reply({
        content: client.messages.DISABLED_COMMAND,
        ephemeral: true,
      });
    }

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: client.language.Music.Stop.NoVoiceChannel,
        ephemeral: true,
      });
    }

    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) {
      return interaction.reply({
        content: client.language.Music.Stop.NoQueue,
        ephemeral: true,
      });
    }

    try {

      await queue.stop();

      return interaction.reply({
        content: client.language.Music.Stop.Stopped,
      });
    } catch (error) {
      console.error("Stop command error:", error);
      return interaction.reply({
        content: "An error occurred while trying to stop the music.",
        ephemeral: true,
      });
    }
  }
};
