module.exports = {
  name: 'shuffle',
  description: 'Shuffle the songs in the queue.',

  run: async (client, interaction) => {
    const queue = client.distube.getQueue(interaction);

    if (!queue)
      return interaction.reply({
        content: client.language.Music.Shuffle.NoMusic,
        ephemeral: true,
      });

    queue.shuffle();

    interaction.reply({
      content: client.language.Music.Shuffle.Shuffled,
    });
  },
};
