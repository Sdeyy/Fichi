const { ActivityType } = require('discord.js');
const client = require('..');
const chalk = require('chalk');
const mongoose = require("mongoose");

client.on('clientReady', async () => {
    const activityList = [
        { name: `${client.users.cache.size} Users`, type: ActivityType.Watching }
    ];

    let i = 0;
    setInterval(() => {
        if (i >= activityList.length) i = 0;
        client.user.setActivity(activityList[i]);
        i++;
    }, 10000);

    console.log(chalk.bold("║" + chalk.green.bold(`  \u2705 Client - Logged in as ${client.user.tag}`)));

    try {
        await mongoose.connect(client.config.BOT_CONFIG.MONGO_URI);
        console.log(chalk.bold("║" + chalk.green.bold(`  \u2705 Database - Mongoose connected`)));
    } catch (error) {
        console.error(chalk.bold("║" + chalk.red.bold(`  ❌ Database - Connection failed:`)), error);
    }

    console.log(chalk.bold('║'));
    console.log(chalk.bold("╚═══════════════════════════════════════════════"));
});
