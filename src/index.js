'use strict';

require('./init').run();

const Discord = require('discord.js');

const Laifu = require('laifu-util');
const wishlistDatabase = require('./wishlist-database');
const laifuDatabase = require('./laifu-database');
const commandLoader = require('./command-loader');

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });
commandLoader.init({ client });
const _laifuEmbedSet = new Set();

/**
 * @param {Discord.Message} message
 */
const laifuFunction = async message => {
    if (!message) return;
    const embed = message.embeds[0];
    if (embed.type !== 'rich') return;

    const Identifier = Laifu.Identifier;
    if (Identifier.isGachaCharacterEmbed(embed)
        || Identifier.isViewEmbed(embed)
        || Identifier.isBurnEmbed(embed)) {
        const gid = Laifu.Character.getGid(embed);
        const cardNumber = Laifu.Character.getCardNumber(embed);
        const sid = Laifu.Character.getSid(embed);
        const userIds = wishlistDatabase.search({ gid, sid, cardNumber });
        if (userIds.length > 0) {
            const usersEmbed = new Discord.MessageEmbed()
                .setTitle('Users that may be interested')
                .setDescription(userIds.map(id => `<@${id}>`).join(' '))
                .setFooter({ text: 'Developed by JB#9224' })
                .setColor('RANDOM');
            await message.reply({
                embeds: [
                    usersEmbed,
                ],
            });
        }
    } else if (Identifier.isWishlistEmbed(embed)) {
        // Const res = Laifu.EmbedParser.parseWishlistEmbed(embed);
        // if (res.username) {
        //     message.guild.members.fetch({ query: res.username, limit: 1 })
        //         .then(users => {
        //             const user = users.first();
        //             if (!res.charactersWanted || !user) return;
        //             res.characters.forEach(character => {
        //                 wishlistDatabase.add(user.id, 'gid', character.gid, '123456789');
        //             });
        //         })
        //         .catch(console.error);
        // }
    }
};

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    commandLoader.load();
    setInterval(() => {
        wishlistDatabase.export();
        laifuDatabase.load();
        _laifuEmbedSet.clear();
    }, 1000 * 60 * 30);
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction);
        } else if (interaction.isSelectMenu()) {
            await client.commands.get(interaction.customId).update(interaction);
        }
    } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on('messageCreate', async message => {
    if (!client.application?.owner) await client.application?.fetch();

    Laifu.Util.hasLaifuEmbed(message, { loaded: false, duplicates: false, embedSet: _laifuEmbedSet })
        .then(laifuFunction);
});

client.on('messageUpdate', async message => {
    if (!client.application?.owner) await client.application?.fetch();

    Laifu.Util.hasLaifuEmbed(message, { delay: 1000, load: false, duplicates: false, embedSet: _laifuEmbedSet })
        .then(laifuFunction);
});

client.login(process.env.BOT_TOKEN);

process.on('SIGINT', process.exit);
process.on('exit', () => {
    wishlistDatabase?.export();
    console.log('Shutting down');
});
