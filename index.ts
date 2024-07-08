import makeWASocket, {
    AnyMessageContent,
    BufferJSON,
    useMultiFileAuthState,
    delay,
    WASocket
  } from "@whiskeysockets/baileys";
import fs from "fs";
import cfg from './config.json'
import Path from 'path'

async function StartTheBot()
{
const { state, saveCreds } = await useMultiFileAuthState("confess_auth");
const sock = (global as any).sock =  makeWASocket({
    auth: state,
    printQRInTerminal: true
});
(sock as any).commands = new Map();

(sock as any).sendMessageWTyping = async(msg:AnyMessageContent, jid:string) => {
    await sock.presenceSubscribe(jid)
    await delay(500)
    await sock.sendPresenceUpdate("composing", jid)
    await delay(2000)
    await sock.sendPresenceUpdate('paused', jid)
    await sock.sendMessage(jid, msg)
}
const readAllFiles = async (dir: string): Promise<string[]> => {
    let results: string[] = [];
    const list = await fs.promises.readdir(dir, { withFileTypes: true });
  
    for (const dirent of list) {
      const res = Path.resolve(dir, dirent.name);
      if (dirent.isDirectory()) {
        results = results.concat(await readAllFiles(res));
      } else {
        results.push(res);
      }
    }
  
    return results;
  };
const commandsRegister = async () => {
    const commandsDir = Path.resolve(__dirname, './commands');
  
    if (!fs.existsSync(commandsDir)) {
      console.log('No Commands directory found.');
      return;
    }
  
    try {
      const commandFiles = await readAllFiles(commandsDir);
  
      for (const commandFile of commandFiles) {
        if (!commandFile.endsWith('.ts')) continue; // Skip non-TypeScript files
  
        const command = await import(commandFile); // Use dynamic import
  
        if (!command) {
          console.warn(`Invalid command file: ${commandFile}`);
          continue;
        }
        const cmdRelative = Path.relative(commandsDir, commandFile)
        console.log(`${cmdRelative} command loaded`);
        (sock as any).commands.set(command.options.name, command); // Use destructured default export
        // Consider optional cache clearing for improved performance:
        // delete require.cache[require.resolve(commandPath)]; // If using CommonJS require
      }
    } catch (error) {
      console.error('Error registering commands:', error);
    }
  };
sock.ev.on("connection.update", async(conn) => {
    if(conn.connection == "connecting") {
        await commandsRegister()
    }
})
sock.ev.on("messages.upsert", async(message) => {
  for(const msg of message.messages)
{
    if(msg.key.fromMe) continue;  //validate the authors
    if(msg.message?.conversation == null) continue; //validate this group or no.
    if(!msg.message.conversation.startsWith(cfg.prefix)) continue; //start the prefix validator
    let text = msg.message.conversation
    let args = text.slice(cfg.prefix.length).trim().split(/ + /g); //argument
    let cmd = args.shift()?.toLowerCase();
    let load_cmd = (sock as any).commands.get(cmd)
    if(!load_cmd) return (sock as any).sendMessageWTyping({text: `Command ${cmd} Not Found, type ${cfg.prefix}help`}, String(msg.key.remoteJid))
    else {

await load_cmd.run(sock, msg, args)
    }
    // //upname
    // sendMessageWTyping({text: String(msg.message?.conversation)}, String(msg.key.remoteJid))
}
})
sock.ev.on("creds.update", saveCreds);


}
StartTheBot()