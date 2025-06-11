#!/usr/bin/env node
// -*- coding: utf-8 -*-

console.clear();

const { Client, GatewayIntentBits, Collection } = require('discord.js')
const fs = require('fs');
const yaml = require('js-yaml');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { SoundCloudPlugin } = require("@distube/soundcloud");

const checkExpiredRoles = require("./functions/checkTempRoles");
const musicHandlers = require('./distube/music');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates]
});

process.on('unhandledRejection', error => {
  console.error(error);
});

client.on('shardError', error => {
  console.error(error);
});

require('events').EventEmitter.defaultMaxListeners = 0;

client.commands = new Collection();
client.embeds = yaml.load(fs.readFileSync('data/settings/embeds.yml', 'utf8'));
client.config = yaml.load(fs.readFileSync('data/settings/config.yml', 'utf8'));
client.buttons = yaml.load(fs.readFileSync('data/settings/buttons.yml', 'utf8'));
client.language = yaml.load(fs.readFileSync('data/settings/language.yml', 'utf8'));

module.exports = client;

fs.readdirSync('./handlers').forEach((handler) => {
  require(`./handlers/${handler}`)(client);
});

client.on("ready", () => {
  setInterval(() => {
    checkExpiredRoles(client);
}, 1000); // 1 second (MS/Miliseconds)
})

client.distube = new DisTube(client, {
  emitNewSongOnly: true,
  plugins: [
    new SpotifyPlugin(),
    new SoundCloudPlugin(),
    new YtDlpPlugin(),
  ],
});

client.distube
  .on('playSong', (queue, song) => {
    musicHandlers.playSong(client, queue, song);
  })
  .on('addSong', (queue, song) => {
    musicHandlers.addSong(client, queue, song);
  });


client.login(client.config.BOT_CONFIG.TOKEN);