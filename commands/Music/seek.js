module.exports = {
  name: "seek",
  description: "Seek to a specific time in the current song.",
  options: [
    {
      name: "time",
      description: "Time in seconds to seek to",
      type: 4,
      required: true,
    },
  ],

  run: async (client, interaction) => {
    const queue = client.distube.getQueue(interaction);
    const time = interaction.options.getInteger("time");

    if (!queue)
      return interaction.reply({
        content: client.language.Music.Seek.NoMusic,
        ephemeral: true,
      });

    if (time < 0 || time > queue.songs[0].duration)
      return interaction.reply({
        content: client.language.Music.Seek.InvalidTime.replace(
          "<duration>",
          queue.songs[0].formattedDuration
        ),
        ephemeral: true,
      });

    try {
      await queue.seek(time);
      interaction.reply({
        content: client.language.Music.Seek.SeekedTo.replace(
          "<time>",
          new Date(time * 1000).toISOString().substr(14, 5)
        ),
      });
    } catch (error) {
      interaction.reply({
        content: "Failed to seek in the song.",
        ephemeral: true,
      });
    }
  },
};
