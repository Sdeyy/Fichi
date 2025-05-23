let invites = {};
const client = require("../index")
const Invite = require("../data/models/invites")
const UserInvite = require("../data/models/userInvites")

if (client.config.INVITES.ENABLED == false) return;

client.on("ready", async () => {

    const guild = client.guilds.cache.get(client.config.BOT_CONFIG.GUILD_ID);
    const fetchedInvites = await guild.invites.fetch();
    invites[guild.id] = fetchedInvites.reduce((acc, invite) => {
        acc[invite.code] = invite.uses;
        return acc;
    }, {});

});

client.on('guildMemberAdd', async (member) => {

    const guild = member.guild;
    const newInvites = await guild.invites.fetch();
    const oldInvites = invites[guild.id];

    const invite = newInvites.find(i => i.uses > oldInvites[i.code]);

    if (invite) {
        const inviter = invite.inviter;

        const newInvite = new Invite({
            inviterId: inviter.id,
            inviteeId: member.id,
            inviteCode: invite.code
        });

        await newInvite.save();

        const userInvite = await UserInvite.findOneAndUpdate(
            { userId: inviter.id },
            { $inc: { invites: 1 } },
            { new: true, upsert: true }
        );

        const channel = guild.channels.cache.get(client.config.INVITES.CHANNEL);
        if (channel) {
            channel.send(`${client.config.INVITES.MESSAGE}`.replace("%user%", member.user).replace("%inviter%", inviter).replace("%inviteCode%", invite.code).replace("%invitesCount%", userInvite.invites));
        }
    }

    invites[guild.id] = newInvites.reduce((acc, invite) => {
        acc[invite.code] = invite.uses;
        return acc;
    }, {});
});

client.on('guildMemberRemove', async (member) => {
    const invite = await Invite.findOne({ inviteeId: member.id });

    if (invite) {
        const userInvite = await UserInvite.findOneAndUpdate(
            { userId: invite.inviterId },
            { $inc: { invites: -1 } },
            { new: true }
        );
    }
});