const TempRole = require('../data/models/tempRole');

async function checkExpiredRoles (client) {
    const now = new Date();

    const expiredRoles = await TempRole.find({ expiresAt: { $lt: now } });

    for (const expiredRole of expiredRoles) {
        const guild = client.guilds.cache.get(expiredRole.guildId);
        if (!guild) continue;

        const member = guild.members.cache.get(expiredRole.userId);
        if (!member) continue;

        await member.roles.remove(expiredRole.roleId, "TempRole removed");
        await TempRole.deleteOne({ _id: expiredRole._id });
    }
};

module.exports = checkExpiredRoles;