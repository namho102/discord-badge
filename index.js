require("dotenv").config();
const {
  Client,
  Intents,
  MessageActionRow,
  MessageSelectMenu,
} = require("discord.js");

const bot = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
const TOKEN = process.env.TOKEN;

const BADGE = {
  // 'name': 'url'
};
const USER = {
  // 'username': [badges]
};

let selectingUser;

bot.login(TOKEN);

bot.on("ready", () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on("messageCreate", async (msg) => {
  const msgContent = msg.content;

  if (msgContent.startsWith(`!add`) && msg.attachments) {
    const badgeName = msgContent.substring(msgContent.indexOf(" ") + 1);
    const imageUrl = msg.attachments.first().url;
    BADGE[badgeName] = imageUrl;
    msg.channel.send(`New badge **${badgeName}** is added!`);
    msg.channel.send({
      files: [imageUrl],
    });
  }

  if (msg.content.startsWith(`!list`)) {
    if (msg.mentions.users.size) {
      const username = msg.mentions.users.first().username;
      if(!USER[username]) {
        msg.channel.send(`**${username}** has not been given any badges.`);
        return
      }

      for (const badge of USER[username]) {
        msg.channel.send(`**${badge}**`);
        msg.channel.send({
          files: [BADGE[badge]],
        })
      }
      return;
    }

    for (const [badge, file] of Object.entries(BADGE)) {
      msg.channel.send(`**${badge}**`);
      msg.channel.send({
        files: [file],
      })
    }
  }

  if (msg.content.startsWith("!give")) {
    if (!msg.mentions.users.size) {
      msg.reply("Please tag a valid user!");
      return;
    }

    if (!Object.values(BADGE).length) {
      msg.reply("You have no badges!");
      return;
    }

    selectingUser = msg.mentions.users.first().username;
    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId("select")
        .setPlaceholder("")
        .addOptions(
          Object.keys(BADGE).map((badge) => ({
            label: badge,
            value: badge,
          }))
        )
    );

    await msg.channel.send({
      content: `Please choose badge you want to give to **${selectingUser}**`,
      components: [row],
    });
  }
});

bot.on("interactionCreate", async (interaction) => {
  if (interaction.customId === "select") {
    const selectedBadge = interaction.values[0]
    await interaction.update({
      content: `**${selectedBadge}** was given to **${selectingUser}**!`,
      components: [],
    });

    if(!USER[selectingUser]) {
      USER[selectingUser]= [selectedBadge]
      return
    }

    USER[selectingUser].push(selectedBadge)
  }
});
