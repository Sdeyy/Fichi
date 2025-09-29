const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits } = require("discord.js");
const client = require('../index')
const ticketSchema = require("../data/models/ticketDB");
const getNumber = require("../functions/numberTicket");
const blacklistdb = require("../data/models/blacklist");

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    const guildData = await ticketSchema.findOne({ guildID: interaction.guild.id });
    if (!guildData) return;
  
    let mapCustomID = guildData.tickets.map(x => x.customID);
  
    if (!mapCustomID.includes(interaction.customId)) return;
  
    const data = await blacklistdb.findOne({ guildID: interaction.guild.id, userID: interaction.member.user.id });
    if (data) return interaction.reply({ content: "You are blacklisted from the tickets", ephemeral: true });
  
    if (client.config.TICKET.TICKET_LIMIT) {
      const canales = interaction.guild.channels.cache;
      const canalExistente = canales.find(c => c.type === ChannelType.GuildText && c.topic === interaction.user.id);
  
      if (canalExistente) {
        return interaction.reply({
          content: `${client.language.Tickets.AlreadyOpen}`,
          ephemeral: true
        });
      }
    }
  
    const Modal = new ModalBuilder()
      .setTitle('Ticket Reason')
      .setCustomId(interaction.customId);
  
    const cualrazon = new TextInputBuilder()
      .setCustomId('ticketreason')
      .setLabel(client.language.TicketReason.Label)
      .setPlaceholder(client.language.TicketReason.Placeholder)
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
  
    const row1 = new ActionRowBuilder()
      .addComponents(cualrazon);
  
    Modal.addComponents(row1);
  
    await interaction.showModal(Modal);
  }
});

client.on("interactionCreate", async (interaction) => {

  if (interaction.isModalSubmit()) {

    if (interaction.customId.startsWith("modal_")) {
      return;
    }

    const guildData = await ticketSchema.findOne({ guildID: interaction.guild.id });
    let mapCustomID = guildData.tickets.map(x => x.customID);

    if (!mapCustomID.includes(interaction.customId)) return;

    const data = await blacklistdb.findOne({ guildID: interaction.guild.id, userID: interaction.member.user.id })
    if (data) return interaction.reply({ content: "You are blacklisted from the tickets", ephemeral: true })

    const ticketreason = interaction.fields.getTextInputValue("ticketreason")
    const ticketaccess = client.config.TICKET.TICKET_ACCESS_ROLE;
    const supportrole = client.config.TICKET.SUPPORT_ROLE;

    const Data = guildData.tickets.find(x => x.customID === interaction.customId);
    let memberID = interaction.member.user.id;

    const ticketRoles = Data.ticketRoles.map(x => {
      return {
        id: x,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AddReactions,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.ManageChannels
        ]
      };
    });
    
    const tagRoles = ticketRoles.map(x => {
      return `<@&${x.id}>`;
    });

    await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.config.BOT_CONFIG.EMBED_COLOR).setDescription(client.language.Tickets.TicketCreating)], ephemeral: true });
    let numberTicket = await getNumber(guildData.ticketCounter, ticketSchema, interaction.guild.id);

    interaction.guild.channels.create({
      name: `ticket-${numberTicket}`,
      type: ChannelType.GuildText,
      topic: `${memberID}`,
      parent: Data.ticketCategory,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: memberID,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks
          ]
        },
        ...ticketRoles
      ]
    }).then(async channel => {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(client.buttons.TICKETS_GENERAL_BUTTONS.Close.Style).setLabel(client.buttons.TICKETS_GENERAL_BUTTONS.Close.Label).setEmoji(client.buttons.TICKETS_GENERAL_BUTTONS.Close.Emoji).setCustomId("Ticket-Open-Close"),
        new ButtonBuilder().setStyle(client.buttons.TICKETS_GENERAL_BUTTONS.Claim.Style).setLabel(client.buttons.TICKETS_GENERAL_BUTTONS.Claim.Label).setEmoji(client.buttons.TICKETS_GENERAL_BUTTONS.Claim.Emoji).setCustomId("Ticket-Claimed")
      );
      const welcome = new EmbedBuilder()
        .setTitle(client.embeds.Tickets.TICKET_OPEN_REASON_ENABLED.Title)
        .setDescription(client.embeds.Tickets.TICKET_OPEN_REASON_ENABLED.Description.replace('<ticketReason>', ticketreason).replace('<creationDate>', `<t:${Math.round(channel.createdTimestamp / 1000)}:R>`))
        .setFooter({text: `${client.embeds.Tickets.TICKET_OPEN_REASON_ENABLED.Footer}`.replace('<botName>', client.config.BOT_CONFIG.NAME)})
        .setTimestamp()
        .setThumbnail(interaction.guild.iconURL())
        .setColor(client.config.BOT_CONFIG.EMBED_COLOR);

      const db = require('../data/models/statisticsModel');
      await db.findOneAndUpdate({ guildID: interaction.guild.id }, {
        $inc: {
          ticketsOpen: 1
        },
      });

      channel.send({ content: `<@!${memberID}> | ${tagRoles}`, embeds: [welcome], components: [row] });

      interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.config.BOT_CONFIG.EMBED_COLOR).setDescription(client.language.Tickets.TicketCreated.replace('<channel>', `<#${channel.id}>`))], ephemeral: true });

      let channelLOG = client.config.TICKET.LOGS_CHANNEL;
      if (!channelLOG) return;
      const log = new EmbedBuilder()
        .setTitle(`${client.config.BOT_CONFIG.NAME} | Ticket Created`)
        .setColor(client.config.BOT_CONFIG.EMBED_COLOR)
        .setDescription(`**User**: <@!${memberID}>\n**Action**: Created a ticket\n**Panel**: ${Data.ticketName}\n**Ticket Name**: ${channel.name}`);

      client.channels.cache.get(channelLOG).send({ embeds: [log] });
    });
  }
});
