const WishlistData = require('../WishlistData');

module.exports = {
    name: 'add',
    description: 'Add a character or series to your wishlist',
    async execute(interaction) {
        const data = interaction.options.data;
        const [category, id] = data;
        const cardNumbers = data.length === 2 ? '123456789' : data[2].value;
        WishlistData.add(interaction.member.id, category.value, id.value, cardNumbers);
        let ret = 'Added ';
        if (category.value === 'gid') {
            ret += `GID ${id.value} - Card Numbers: ${cardNumbers}`;
        } else {
            ret += `SID ${id.value}`;
        }
        await interaction.reply({ content: ret, ephemeral: true });
    },
};