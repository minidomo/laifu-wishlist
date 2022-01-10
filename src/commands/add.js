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
        .split(/\s+/)
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
        .setName('add')
        .setDescription('Add a character or series to your wishlist')
        .addSubcommand(subcommand =>
            subcommand
                .addStringOption(option =>
                    option
                        .setName('category')
                        .setDescription('The category to be added')
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
                        .setDescription('The card numbers to look for. Only type the numbers (no spaces).'
                            + ' All numbers are added by default.')
                        .setRequired(false))
                .setDescription('Add a single entry')
                .setName('single'))
        .addSubcommand(subcommand =>
            subcommand
                .addStringOption(option =>
                    option
                        .setName('category')
                        .setDescription('The category to be added')
                        .setRequired(true)
                        .setChoices([
                            ['Character', 'gid'],
                            ['Series', 'sid'],
                        ]))
                .addStringOption(option =>
                    option
                        .setRequired(true)
                        .setDescription(`The IDs of the characters/series. Can add at most ${MAX_IDS} IDs at once.`
                            + ` Format:<id>.<card_numbers>`)
                        .setName('ids'))
                .setDescription('Add multiple entries')
                .setName('multiple'))
        .setDefaultPermission(true),
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
            wishlistDatabase.add({ userId, category, id, cardNumbers });
        } else {
            const ids = parseIds(options.getString('ids'));
            if (ids.length > MAX_IDS) {
                await interaction.reply({ content: `${MAX_IDS} ID limit reached: ${ids.length}`, ephemeral: true });
                return;
            }
            ids.forEach(e => {
                wishlistDatabase.add({ userId, category, id: e.id, cardNumbers: e.cardNumbers });
            });
        }
        await interaction.reply({ content: 'Added the IDs to your wishlist!', ephemeral: true });
    },
};
