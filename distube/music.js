const { EmbedBuilder } = require("discord.js");

module.exports = {
  playSong: (client, queue, song) => {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(
        `${client.language.Music.PlaySong}`
       .replaceAll("<songName>", song.name)
       .replaceAll("<songURL>", song.url)
      );

    queue.textChannel.send({ embeds: [embed] }).catch(console.error);
  },

  addSong: (client, queue, song) => {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(
       `${client.language.Music.AddSong}`
       .replaceAll("<songName>", song.name)
       .replaceAll("<songURL>", song.url)
      );

    queue.textChannel.send({ embeds: [embed] }).catch(console.error);
  },

  addList: (client, queue, playlist) => {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(
        `${client.language.Music.AddList}`
       .replaceAll("<songName>", song.name)
       .replaceAll("<songURL>", song.url)
      );
    queue.textChannel.send({ embeds: [embed] });
  },
};
