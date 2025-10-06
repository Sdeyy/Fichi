module.exports = {
  name: "volume",
  description: "Set the music volume (1-100).",
  options: [
    {
      name: "amount",
      description: "Volume percentage to set",
      type: 4,
      required: true,
      minValue: 1,
      maxValue: 100,
    },
  ],

  run: async (client, interaction) => {

    if (client.config?.DISABLE_COMMANDS?.DISABLED?.includes("volume")) {
      return interaction.reply({
        content: client.language.DISABLED_COMMAND,
        ephemeral: true,
      });
    }
    
    const queue = client.distube.getQueue(interaction);

    if (!queue)
      return interaction.reply({
        content: client.language.Music.Volume.NoQueue,
        ephemeral: true,
      });

    const volume = interaction.options.getInteger("amount");

    try {
      queue.setVolume(volume);
      interaction.reply({
        content: client.language.Music.Volume.SetVolume.replace(
          "{volume}",
          volume
        ),
      });
    } catch (error) {
      interaction.reply({ content: "Failed to set volume.", ephemeral: true });
    }
  },
};
