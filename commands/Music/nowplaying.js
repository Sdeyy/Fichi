const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: "nowplaying",
  description: "Shows information about the current playing song",
  cooldown: "3s",

  run: async (client, interaction, args) => {

    if (client.config?.DISABLE_COMMANDS?.DISABLED?.includes("nowplaying")) {
      return interaction.reply({
        content: client.language.DISABLED_COMMAND,
        ephemeral: true,
      });
    }

    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue || !queue.songs || queue.songs.length === 0)
      return interaction.reply({
        content: "There is no song currently playing.",
        ephemeral: true,
      });

    const song = queue.songs[0];

    const embed = new EmbedBuilder()
      .setColor(client.language.Music.NowPlaying.EmbedColor)
      .setTitle(client.language.Music.NowPlaying.EmbedTitle)
      .setDescription(
        `${client.language.Music.NowPlaying.EmbedDescription}`
          .replaceAll("<songName>", song.name)
          .replaceAll("<songURL>", song.url)
      )
      .addFields(
        {
          name: client.language.Music.NowPlaying.FieldOne.Name,
          value: `${client.language.Music.NowPlaying.FieldOne.Value}`
            .replaceAll("<songDuration>", song.formattedDuration),
          inline: client.language.Music.NowPlaying.FieldOne.inline
        },
        {
          name: client.language.Music.NowPlaying.FieldTwo.Name,
          value: `${client.language.Music.NowPlaying.FieldTwo.Value}`
            .replaceAll("<requestBy>", song.user?.tag || "Unknown"),
          inline: client.language.Music.NowPlaying.FieldTwo.inline
        }
      )
      .setThumbnail(song.thumbnail)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
