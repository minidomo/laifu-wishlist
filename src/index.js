const { Client, Intents, Collection, MessageEmbed } = require('discord.js');
const fs = require('fs');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

(() => {
    const dayjs = require('dayjs');
    const getCurrentTime = () => {
        return `${dayjs().format('YYYY-MM-DD hh:mm:ss.SSS A')}`;
    };

    const getLogFilename = () => {
        return `${dayjs().format('YYYY-MM-DD_hh-mm-ss_A')}.log`;
    };

    const winston = require('winston');
    const logger = winston.createLogger({
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({ filename: `./logs/${getLogFilename()}` }),
        ],
        format: winston.format.printf(log => `[${getCurrentTime()}] [${log.level.toUpperCase()}] ${log.message}`),
    });

    const log = (level, args) => {
        if (args.length === 0) return;
        let res = '';
        for (let i = 0; i < args.length; i++) {
            if (i > 0) {
                res += ' ';
            }
            if (typeof args[i] === 'object') {
                res += JSON.stringify(args[i], null, 4);
            } else {
                res += args[i];
            }
        }

        logger.log(level, res);
    };

    console.log = function () {
        log('info', arguments);
    };
    /**
     * @param {Error} err
     */
    console.error = function (err) {
        log('error', [err.name, err.message, err.stack]);
    };
})();

const laifu = require('./laifu');
const WishlistData = require('./WishlistData');
const LaifuData = require('./LaifuData');
const config = require('../config.json');
const wait = require('util').promisify(setTimeout);

const gachaMessageIds = new Set();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    loadCommands();
    setInterval(() => {
        WishlistData.export();
        gachaMessageIds.clear();
        LaifuData.load();
    }, 1000 * 60 * 10);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        if (!client.commands.has(interaction.commandName)) return;
        try {
            await client.commands.get(interaction.commandName).execute(interaction);
        } catch (err) {
            console.error(err);
        }
    } else if (interaction.isSelectMenu()) {
        try {
            await client.commands.get(interaction.customId).update(interaction);
        } catch (err) {
            console.error(err);
        }
    }
});

client.on('messageCreate', async message => {
    if (!client.application?.owner) await client.application?.fetch();
    if (message.author.id === client.application?.owner.id) {
        const mention = `<@!${client.user.id}>`;
        if (message.content.startsWith(mention)) {
            const trimmed = message.content.substr(mention.length).trim().toLowerCase();
            switch (trimmed) {
                case 'deploy dev': {
                    const guildIds = config.dev.guilds;
                    deploy.clear(guildIds).then(() => deploy.guild(guildIds));
                    break;
                }
                case 'deploy prod': {
                    const guildIds = config.prod.guilds;
                    deploy.clear(guildIds).then(() => deploy.guild(guildIds));
                    break;
                }
                case 'deploy clear': {
                    deploy.clear();
                    break;
                }
                case 'export': {
                    WishlistData.export();
                    break;
                }
            }
        }
    } else if (message.author.id === laifu.id) {
        if (message.embeds.length === 1) {
            const [embed] = message.embeds;
            if (laifu.embed.isView(embed) || laifu.embed.isBurn(embed)) {
                try {
                    const gid = laifu.embed.getGID(embed);
                    const cardNumber = laifu.embed.getCardNumber(embed);
                    const sid = laifu.embed.getSID(embed);
                    const userIds = WishlistData.search(gid, sid, cardNumber);
                    if (userIds.length > 0) {
                        const usersEmbed = new MessageEmbed()
                            .setTitle('Users that may be interested')
                            .setDescription(userIds.map(id => `<@!${id}>`).join(' '))
                            .setFooter('Developed by JB#9224');
                        await message.reply({ embeds: [usersEmbed] });
                    }
                } catch (err) {
                    console.log(embed);
                    console.error(err);
                }
            }
        }
    }
});

client.on('messageUpdate', async message => {
    if (!client.application?.owner) await client.application?.fetch();
    if (message.author.id === laifu.id) {
        wait(1000)
            .then(async () => {
                if (gachaMessageIds.has(message.id)) return;
                gachaMessageIds.add(message.id);
                const msg = await message.channel.messages.fetch(message.id);
                if (msg.embeds.length === 1) {
                    const [embed] = msg.embeds;
                    if (laifu.embed.isGacha(embed)) {
                        const gid = laifu.embed.getGID(embed);
                        const cardNumber = laifu.embed.getCardNumber(embed);
                        const sid = laifu.embed.getSID(embed);
                        const userIds = WishlistData.search(gid, sid, cardNumber);
                        if (userIds.length > 0) {
                            const usersEmbed = new MessageEmbed()
                                .setTitle('Users that may be interested')
                                .setDescription(userIds.map(id => `<@!${id}>`).join(' '))
                                .setFooter('Developed by JB#9224');
                            await msg.reply({ embeds: [usersEmbed] });
                        }
                    }
                }
            })
            .catch(console.error);
    }
});

if (process.argv.length > 2 && process.argv[2] === '--production') {
    client.login(process.env.PROD_TOKEN);
} else {
    client.login(process.env.DEV_TOKEN);
}

const loadCommands = () => {
    client.commands = new Collection();
    const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.name, command);
    }
};

const deploy = {
    /**
     * @param {string[]} guildIds
     */
    async guild(guildIds) {
        try {
            for (const guildId of guildIds) {
                const guild = client.guilds.cache.get(guildId);
                await guild.commands.set(require('./commands/commandData.json'));
            }
            console.log(`Commands deployed to ${guildIds.length} guild(s)`);
        } catch (err) {
            console.error(err);
        }
    },
    /**
     * @param {string[]} guildIds
     */
    async clear(guildIds) {
        try {
            for (const guildId of guildIds) {
                const guild = client.guilds.cache.get(guildId);
                await guild.commands.set([]);
            }
            console.log(`Commands cleared for ${guildIds.length} guild(s)`);
        } catch (err) {
            console.error(err);
        }
    },
};

process.on('SIGINT', process.exit);
process.on('exit', () => {
    WishlistData.export();
    console.log('Shutting down');
});