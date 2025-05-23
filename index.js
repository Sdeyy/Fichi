#!/usr/bin/env node
// -*- coding: utf-8 -*-

console.clear();

const { Client, GatewayIntentBits, Collection } = require('discord.js')
const checkExpiredRoles = require("./functions/checkTempRoles")

const fs = require('fs');
const yaml = require('js-yaml');
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

client.login(client.config.BOT_CONFIG.TOKEN);