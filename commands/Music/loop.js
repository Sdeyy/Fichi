const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: "loop",
  description: "Toggle loop mode: off, repeat current song, or repeat the entire queue",
  cooldown: "3s",
  options: [
    {
      name: "mode",
      description: "Loop mode: off, one, all",
      type: 3,
      required: true,
      choices: [
        { name: "Off", value: "off" },
        { name: "Repeat One", value: "one" },
        { name: "Queue", value: "all" }
      ]
    }
  ],

  run: async (client, interaction, args) => {
    if (client.config.DISABLE_COMMANDS.DISABLED.includes("loop"))
      return interaction.reply({
        content: client.language.DISABLED_COMMAND,
        ephemeral: true,
      });

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel)
      return interaction.reply({
        content: "You must be in a voice channel to use this command.",
        ephemeral: true,
      });

    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue)
      return interaction.reply({
        content: "There is no song playing right now.",
        ephemeral: true,
      });

    const mode = interaction.options.getString("mode");
    let modeNum;

    switch (mode) {
      case "off":
        modeNum = 0;
        break;
      case "one":
        modeNum = 1; 
        break;
      case "all":
        modeNum = 2;
        break;
      default:
        modeNum = 0;
    }

    try {

      const newMode = queue.setRepeatMode(modeNum);

      let description = client.language.Music.Loop.Off;
      if (newMode === 1) description = client.language.Music.Loop.RepeatOne;
      if (newMode === 2) description = client.language.Music.Loop.RepeatQueue;

      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setDescription(description);

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error setting loop mode:", error);
      return interaction.reply({
        content: "There was an error trying to change the loop mode.",
        ephemeral: true,
      });
    }
  }
};
