const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");

module.exports = {
  name: "queue",
  description: "View the music queue with pagination.",

  run: async (client, interaction, args) => {

    if (client.config?.DISABLE_COMMANDS?.DISABLED?.includes("queue")) {
      return interaction.reply({
        content: client.language.DISABLED_COMMAND,
        ephemeral: true,
      });
    }
    
    const queue = client.distube.getQueue(interaction);

    if (!queue)
      return interaction.reply({
        content: client.language.Music.Queue.NoSongPlaying,
        ephemeral: true,
      });

    const member = interaction.member;
    const botMember = interaction.guild.members.me;

    if (!member.voice.channel)
      return interaction.reply({
        content: client.language.Music.Queue.MustBeInVC,
        ephemeral: true,
      });

    if (
      botMember.voice.channel &&
      member.voice.channel.id !== botMember.voice.channel.id
    )
      return interaction.reply({
        content: client.language.Music.Queue.SameVC,
        ephemeral: true,
      });

    const maxSongsPerPage = 30;
    const pages = [];
    for (let i = 0; i < queue.songs.length; i += maxSongsPerPage) {
      const chunk = queue.songs.slice(i, i + maxSongsPerPage);
      const desc = chunk
        .map(
          (song, idx) =>
            `**\`${i + idx + 1}\`** - [\`${song.name}\`](${song.url}) - \`${
              song.formattedDuration
            }\``
        )
        .join("\n");
      pages.push(desc);
    }

    const embeds = pages.map((page, i) =>
      new EmbedBuilder()
        .setTitle(
          `Queue - [${queue.songs.length} ${
            queue.songs.length > 1 ? "Songs" : "Song"
          }]`
        )
        .setColor("#8400ff")
        .setDescription(page)
        .addFields({
          name: "💿 Current Song",
          value: `**[\`${queue.songs[0].name}\`](${queue.songs[0].url})**`,
        })
        .setFooter({ text: `Page ${i + 1} / ${pages.length}` })
    );

    let currentPage = 0;

    const prevButton = new ButtonBuilder()
      .setCustomId("previous")
      .setLabel("Previous")
      .setEmoji("◀️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);

    const homeButton = new ButtonBuilder()
      .setCustomId("home")
      .setLabel("Home")
      .setEmoji("🏠")
      .setStyle(ButtonStyle.Danger);

    const nextButton = new ButtonBuilder()
      .setCustomId("next")
      .setLabel("Next")
      .setEmoji("▶️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(pages.length <= 1);

    const row = new ActionRowBuilder().addComponents(
      prevButton,
      homeButton,
      nextButton
    );

    const message = await interaction.reply({
      embeds: [embeds[currentPage]],
      components: [row],
      fetchReply: true,
    });

    if (pages.length <= 1) return;

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 180000,
    });

    collector.on("collect", async (btnInteraction) => {
      if (btnInteraction.user.id !== interaction.user.id) {
        return btnInteraction.reply({
          content: client.language.Music.Queue.OnlyExecutor,
          ephemeral: true,
        });
      }

      switch (btnInteraction.customId) {
        case "previous":
          currentPage--;
          if (currentPage < 0) currentPage = pages.length - 1;
          break;
        case "home":
          currentPage = 0;
          break;
        case "next":
          currentPage++;
          if (currentPage >= pages.length) currentPage = 0;
          break;
      }

      prevButton.setDisabled(currentPage === 0);
      nextButton.setDisabled(currentPage === pages.length - 1);

      await btnInteraction.update({
        embeds: [embeds[currentPage]],
        components: [row],
      });
    });

    collector.on("end", async () => {
      prevButton.setDisabled(true);
      homeButton.setDisabled(true);
      nextButton.setDisabled(true);
      await message.edit({
        content: client.language.Music.Queue.CollectorExpired,
        embeds: [embeds[currentPage]],
        components: [row],
      });
    });
  },
};
