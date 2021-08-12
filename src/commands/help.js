const Discord = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Displays available commands',
    async execute(interaction) {
        const embed = new Discord.MessageEmbed()
            .setTitle('Commands')
            .setDescription('add\nremove\nwishlist')
            .setFooter('Developed by JB#9224');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};