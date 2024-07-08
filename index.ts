import makeWASocket, {
    BufferJSON,
    useMultiFileAuthState,
  } from "@whiskeysockets/baileys";
import * as fs from "fs";

async function StartTheBot()
{
const { state, saveCreds } = await useMultiFileAuthState("confess_auth");
const Whatsapp = makeWASocket({
    auth: state,
    printQRInTerminal: true
})

Whatsapp.ev.on("creds.update", saveCreds);


}
StartTheBot()