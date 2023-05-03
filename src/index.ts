import { SlashCommandBuilder, REST, Routes, Client, Events, GatewayIntentBits, Collection } from "discord.js"
import "dotenv/config"
import { green, reset, yellow } from "kleur"
import { ChatGPTAPI } from 'chatgpt'
import smartTruncate from 'smart-truncate'

const TOKEN = process.env.BOT_TOKEN
const client = new Client({ intents: [GatewayIntentBits.Guilds] })
const api = new ChatGPTAPI({ apiKey: process.env.OPENAI_API_KEY })
let lastConversation: string

client.once(Events.ClientReady, async c => {
  let commands = [
    new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Send a request to ChatGPT and get a result back.')
    .addStringOption(option => 
      option
        .setName('message')
        .setDescription('Message to send to ChatGPT.')
        .setRequired(true)
    ).toJSON(),
    new SlashCommandBuilder()
      .setName("wipe")
      .setDescription('Wipes the previous ChatGPT conversation from memory.').toJSON()
  ]
	console.log(green("✓"), reset(`Ready! Successfully logged in as ${c.user.tag}!`));
  console.log(yellow("..."), reset("Attempting to send slash commands to Discord..."))
  try {
    const data = await rest.put(
			Routes.applicationGuildCommands('1102743695683497994', '908920573520912395'),
			{ body: commands },
		); // @ts-ignore
    console.log(green("✓"), reset(`Successfully reloaded ${data.length} application (/) commands.`));
  } catch (error) {
    console.error(error)
  }
})

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return
  if (interaction.commandName.toLowerCase() == 'chat') {
    try {
      if (lastConversation) { // @ts-ignore
        let message = interaction.options.getString('message')
        await interaction.deferReply()
        const res = await api.sendMessage(message, {
          parentMessageId: lastConversation,
        })
        lastConversation = res.parentMessageId
        await interaction.editReply({ content: smartTruncate(res.text, 2000), tts: true }) 
      } else { // @ts-ignore
        let message = interaction.options.getString('message')
        await interaction.deferReply()
        const res = await api.sendMessage(message)
        lastConversation = res.parentMessageId
        await interaction.editReply({ content: smartTruncate(res.text, 2000), tts: true }) 
      }
    } catch (e) {
      console.error(e)
      if (interaction.replied) {
        await interaction.followUp({ content: 'There was an error while executing this command!' });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!' });
      }
    }
  } else if (interaction.commandName.toLowerCase() == 'wipe') {
    lastConversation = undefined
    await interaction.reply("Wiped previous conversation from memory.")
  }
})

const rest = new REST()
rest.setToken(TOKEN);

client.login(TOKEN)