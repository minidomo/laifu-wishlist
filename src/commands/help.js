'use strict';

const Discord = require('discord.js');
const Builders = require('@discordjs/builders');

const commandNames = [
    'add',
    'remove',
    'wishlist',
];
const _description = commandNames.join('\n');

module.exports = {
    data: new Builders.SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays available commands')
        .setDefaultPermission(true),
    /**
     * @param {import('discord.js').CommandInteraction<import('discord.js').CacheType>} interaction
     */
    async execute(interaction) {
        const embed = new Discord.MessageEmbed()
            .setTitle('Commands')
            .setDescription(_description)
            .setFooter({ text: 'Developed by JB#9224' })
            .setColor('RANDOM');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
