const { Collection, PermissionBitField } = require('discord.js');
const ms = require('ms');
const client = require('..');
const cooldowns = new Collection();

client.on('interactionCreate', async interaction => {
    const command = client.commands.get(interaction.commandName);

    if (interaction.type === 4 && command?.autocomplete) {
        await command.autocomplete(client, interaction);
        return;
    }

    if (interaction.type !== 2) return;
    if (!command) return client.commands.delete(interaction.commandName);

    try {
        const cooldownKey = `${command.name}-${interaction.user.id}`;
        const cooldownTime = command.cooldown ? ms(command.cooldown) : null;

        if (command.userPerms || command.botPerms) {
            const missingUserPerms = command.userPerms && !interaction.memberPermissions.has(PermissionBitField.resolve(command.userPerms || []));
            const botMember = interaction.guild.members.cache.get(client.user.id);
            const missingBotPerms = command.botPerms && !botMember.permissions.has(PermissionBitField.resolve(command.botPerms || []));

            if (missingUserPerms)
                return interaction.reply(client.embeds.fail(`You don't have \`${command.userPerms}\` permissions.`));

            if (missingBotPerms)
                return interaction.reply(client.embeds.fail(`I don't have \`${command.botPerms}\` permissions.`));
        }

        if (cooldownTime) {
            if (cooldowns.has(cooldownKey)) {
                const remaining = cooldowns.get(cooldownKey) - Date.now();
                if (remaining > 0) {
                    const duration = ms(remaining, { long: true });

                    const cooldownMessage = client.embeds.Cooldown?.Message?.replace('%time%', duration) || `⏳ Espera ${duration}`;

                    return interaction.reply({ content: cooldownMessage, flags: 64 });
                }
            }

            await command.run(client, interaction);
            cooldowns.set(cooldownKey, Date.now() + cooldownTime);
            setTimeout(() => cooldowns.delete(cooldownKey), cooldownTime);
        } else {
            await command.run(client, interaction);
        }
    } catch (e) {
        console.log(e);
        return interaction.reply({ embeds: [client.embeds.ERROR] });
    }
});
