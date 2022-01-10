'use strict';

const Builders = require('@discordjs/builders');
const wishlistDatabase = require('../wishlist-database');

const idsRegex = /^([0-9]+)(?:\.([0-9]+))?$/;
const MAX_IDS = 20;

/**
 * @typedef {Object} IdInfo
 * @property {number} id
 * @property {string} cardNumbers
 */

/**
 * @param {string} str
 * @returns {IdInfo[]}
 */
const parseIds = str =>
    str
        .split(/,+/)
        .map(e => e.trim())
        .filter(e => e.length > 0 && e.match(idsRegex))
        .map(e => {
            const parts = e.match(idsRegex);
            /** @type {IdInfo} */
            const obj = {
                id: parseInt(parts[1]),
                cardNumbers: typeof parts[2] === 'string' ? parts[2] : undefined,
            };
            return obj;
        });

module.exports = {
    data: new Builders.SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a character or series from your wishlist')
        .addSubcommand(subcommand =>
            subcommand
                .addStringOption(option =>
                    option
                        .setName('category')
                        .setDescription('The category to be removed')
                        .setRequired(true)
                        .setChoices([
                            ['Character', 'gid'],
                            ['Series', 'sid'],
                        ]))
                .addIntegerOption(option =>
                    option
                        .setName('id')
                        .setDescription('The ID of the character/series')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('card_numbers')
                        .setDescription('The card numbers to remove. Only type the numbers (no spaces).'
                            + ' All numbers are removed by default.')
                        .setRequired(false))
                .setDescription('Remove a single entry')
                .setName('single'))
        .addSubcommand(subcommand =>
            subcommand
                .addStringOption(option =>
                    option
                        .setName('category')
                        .setDescription('The category to be removed')
                        .setRequired(true)
                        .setChoices([
                            ['Character', 'gid'],
                            ['Series', 'sid'],
                        ]))
                .addStringOption(option =>
                    option
                        .setRequired(true)
                        .setDescription(`The IDs of the characters/series. Can remove at most ${MAX_IDS} IDs at once.`)
                        .setName('ids'))
                .setDescription('Remove multiple entries')
                .setName('multiple'))
        .setDefaultPermission(false),
    /**
     * @param {import('discord.js').CommandInteraction} interaction
     */
    async execute(interaction) {
        const { options } = interaction;
        const subcommand = options.getSubcommand();
        const category = options.getString('category');
        const userId = interaction.member.id;
        if (subcommand === 'single') {
            const id = options.getInteger('id');
            const cardNumbers = options.getString('card_numbers');
            wishlistDatabase.remove({ userId, category, id, cardNumbers });
        } else {
            const ids = parseIds(options.getString('ids'));
            if (ids.length > MAX_IDS) {
                await interaction.reply({ content: `${MAX_IDS} ID limit reached: ${ids.length}`, ephemeral: true });
                return;
            }
            ids.forEach(e => {
                wishlistDatabase.remove({ userId, category, id: e.id, cardNumbers: e.cardNumbers });
            });
        }
        await interaction.reply({ content: 'Removed the IDs to your wishlist!', ephemeral: true });
    },
};
