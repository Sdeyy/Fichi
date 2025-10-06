module.exports = {
  name: 'shuffle',
  description: 'Shuffle the songs in the queue.',

  run: async (client, interaction) => {

    if (client.config?.DISABLE_COMMANDS?.DISABLED?.includes("shuffle")) {
      return interaction.reply({
        content: client.language.DISABLED_COMMAND,
        ephemeral: true,
      });
    }
    
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
