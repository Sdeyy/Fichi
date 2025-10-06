const Discord = require("discord.js");
const youtube = require("youtube-sr").default;

module.exports = {
  name: "play",
  description: "Play a song or playlist from YouTube, Spotify or Soundcloud",
  cooldown: "5s",
  options: [
    {
      name: "query",
      description: "Link or name of the song",
      type: 3,
      required: true,
      autocomplete: true,
    },
  ],

  autocomplete: async (interaction) => {
    const focusedValue = interaction.options.getFocused();

    if (!focusedValue || focusedValue.trim().length === 0) {
      await interaction.respond([]);
      return;
    }

    try {
      const results = await youtube.search(focusedValue, {
        limit: 10,
        type: "video",
      });

      const choices = results.map((video) => ({
        name:
          video.title.length > 100
            ? video.title.substring(0, 97) + "..."
            : video.title,
        value: video.url,
      }));

      await interaction.respond(choices);
    } catch (e) {
      console.error(e);
      await interaction.respond([]);
    }
  },

  run: async (client, interaction, args) => {

    const query = interaction.options.getString("query")

    if (client.config?.DISABLE_COMMANDS?.DISABLED?.includes("play")) {
      return interaction.reply({
        content: `${client.language.DISABLED_COMMAND}`,
        ephemeral: true,
      });
    }

    if (!query)
      return interaction.reply({
        content: client.language.Music.Play.NoLinkProvided,
        ephemeral: true,
      });

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel)
      return interaction.reply({
        content: client.language.Music.Play.MustBeInVC,
        ephemeral: true,
      });

    try {
      await interaction.deferReply({ ephemeral: true });

      await client.distube.play(voiceChannel, query, {
        member: interaction.member,
        textChannel: interaction.channel,
        interaction,
      });

      return interaction.editReply({
        content: client.language.Music.Play.Searching,
      });
    } catch (error) {
      console.error("Play command error:", error);

      if (interaction.deferred || interaction.replied) {
        return interaction.followUp({
          content: "There was an error trying to play that song.",
          ephemeral: true,
        });
      } else {
        return interaction.reply({
          content: "There was an error trying to play that song.",
          ephemeral: true,
        });
      }
    }
  },
};
