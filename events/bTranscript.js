const { ButtonBuilder, EmbedBuilder, ActionRowBuilder } = require("discord.js");
const discordTranscripts = require('discord-html-transcripts');
const client = require("../index");
const ticketSchema = require("../data/models/ticketDB");
let supportRole = client.config.TICKET.SUPPORT_ROLE;

client.on("interactionCreate", async (interaction) => {

	if (interaction.isButton()) {

		if (interaction.customId == "Ticket-Transcript") {
			let idmiembro = interaction.channel.topic;

			if (!interaction.member.roles.cache.has(supportRole)) {
				return;
			}

			const guildData = await ticketSchema.findOne({ guildID: interaction.guild.id })
			if (!guildData) return interaction.reply({ content: `NO data found.`, ephemeral: true })

			interaction.deferUpdate();

			const trow = new ActionRowBuilder()

				.addComponents(new ButtonBuilder()
					.setCustomId("TR-YES")
					.setLabel("Yes")
					.setStyle("Success"),

					new ButtonBuilder()
						.setCustomId("TR-CN")
						.setLabel("Cancel")
						.setStyle("Secondary"),

					new ButtonBuilder()
						.setCustomId("TR-NO")
						.setLabel("No")
						.setStyle("Danger"))

			interaction.channel.send({
				embeds: [new EmbedBuilder()
					.setDescription('Do you want to send the ticket to the user?')
					.setColor(`${client.config.BOT_CONFIG.EMBED_COLOR}`)], components: [trow]
			})
		}
	}
	if (interaction.isButton()) {


		let idmiembro = interaction.channel.topic;

		let logcanal = client.config.TICKET.LOGS_CHANNEL;
		let transcriptcanal = client.config.TICKET.TRANSCRIPT_CHANNEL;

		if (interaction.customId == "TR-CN") {

			interaction.deferUpdate();
			interaction.message.delete();
		}
		if (interaction.customId == "TR-YES") {
			interaction.deferUpdate();

			interaction.message.delete();
			const saving = new EmbedBuilder()
				.setDescription(`Saving transcript...`)
				.setColor(client.config.BOT_CONFIG.EMBED_COLOR)

			let savingMessage = interaction.channel.send({ embeds: [saving] })

			const file = await discordTranscripts.createTranscript(interaction.channel, { limit: -1, fileName: `transcript-${interaction.channel.name}.html` });

			const mensaje = new EmbedBuilder()
				.setAuthor({
					name: interaction.client.users.cache.get(idmiembro).tag,
					iconURL: interaction.client.users.cache.get(idmiembro).avatarURL({ dynamic: true })
				})
				.addFields(
					{
						name: "Ticket Owner",
						value: `<@!${idmiembro}>`,
						inline: true
					},
					{
						name: "Ticket Name",
						value: interaction.channel.name,
						inline: true
					}
				)
				.setColor(`${client.config.BOT_CONFIG.EMBED_COLOR}`)

			const guildData = await ticketSchema.findOne({ guildID: interaction.guild.id })
			await client.channels.cache.get(transcriptcanal).send({ embeds: [mensaje], files: [file] }).then((a) => {
				const Data = guildData.tickets.find((x) => x.ticketCategory === interaction.channel.parentId);

				a.edit({ embeds: [mensaje
					.addFields(
						{
						name: "Panel Name",
						value: Data.ticketName,
						inline: true
					},
					{
						name: "Direct Transcript",
						value: `[Direct Transcript](${a.attachments.first().url})`,
						inline: true
					},
					{
						name: "Ticket Closed",
						value: `${interaction.member.user}`,
						inline: true 
					}
				)]
				})
			})

			const trsend = new EmbedBuilder()
				.setDescription(`Transcript Saved To <#${transcriptcanal}>`)
				.setColor(client.config.BOT_CONFIG.EMBED_COLOR)
				; (await savingMessage).edit({ embeds: [trsend] })

			let user = interaction.client.users.cache.get(idmiembro);
			try { await user.send({ embeds: [mensaje], files: [file] }) }
			catch (error) {
				(await savingMessage).edit({
					embeds: [new EmbedBuilder()
						.setDescription(`This user has closed direct messages`)
						.setColor(client.config.BOT_CONFIG.EMBED_COLOR)]
				})
			}

			if (!guildData.channelLog) return;
			const log = new EmbedBuilder()
				.setTitle(`${client.config.BOT_CONFIG.NAME} | Transcript Saved`)
				.setColor(client.config.BOT_CONFIG.EMBED_COLOR)
				.setDescription(`**User**: <@!${interaction.member.user.id}>\n**Action**: Save a ticket transcript\n**Ticket**: ${interaction.channel.name}`)

			interaction.client.channels.cache.get(logcanal).send({ embeds: [log] });
		}
		if (interaction.customId == "TR-NO") {

			interaction.deferUpdate();
			interaction.message.delete();
			const guildData = await ticketSchema.findOne({ guildID: interaction.guild.id })

			const saving = new EmbedBuilder()
				.setDescription(`Saving transcript...`)
				.setColor(client.config.BOT_CONFIG.EMBED_COLOR)

			let savingMessage = interaction.channel.send({ embeds: [saving] })

			const file = await discordTranscripts.createTranscript(interaction.channel, { limit: -1, returnBuffer: false, fileName: `transcript-${interaction.channel.name}.html` });

			const mensaje = new EmbedBuilder()
				.setAuthor({ name: interaction.client.users.cache.get(idmiembro).tag,
					iconURL: interaction.client.users.cache.get(idmiembro).avatarURL({ dynamic: true })
				})
				.addFields(
					{
						name: "Ticket Owner",
						value: `<@!${idmiembro}>`,
						inline: true
					},
					{
						name: "Ticket Name",
						value: interaction.channel.name,
						inline: true
					}
				)
				.setColor(`${client.config.BOT_CONFIG.EMBED_COLOR}`)

			await client.channels.cache.get(transcriptcanal).send({ embeds: [mensaje], files: [file] }).then((a) => {
				const Data = guildData.tickets.find((x) => x.ticketCategory === interaction.channel.parentId);

				a.edit({
					embeds: [mensaje
						.addFields(
							{
								name: "Panel Name",
								value: `${Data.ticketName}`,
								inline: true
							},
							{
								name: "Direct Transcript",
								value: `[Direct Transcript](${a.attachments.first().url})`,
								inline: true
							},
							{
								name: "Ticket Closed",
								value: `${interaction.member.user}`,
								inline: true
							}
						)]
				})
			});

				const trsend = new EmbedBuilder()
					.setDescription(`Transcript saved to <#${transcriptcanal}>`)
					.setColor(client.config.BOT_CONFIG.EMBED_COLOR)
					; (await savingMessage).edit({ embeds: [trsend] })


				const log = new EmbedBuilder()
					.setTitle(`${client.config.BOT_CONFIG.NAME} | Transcript Saved`)
					.setColor(client.config.BOT_CONFIG.EMBED_COLOR)
					.setDescription(`**User**: <@!${interaction.member.user.id}>\n**Action**: Save a ticket transcript\n**Ticket**: ${interaction.channel.name}`)
				interaction.client.channels.cache.get(logcanal).send({ embeds: [log] });
			
		}
	}});