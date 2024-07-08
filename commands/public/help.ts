import {proto, WASocket, } from "@whiskeysockets/baileys"

module.exports.options = {
name: "help",
description: "Confess Helper Menu"
}

module.exports.run = async(sock:WASocket, msg:proto.IWebMessageInfo, args:[]) => {
    (sock as any).sendMessageWTyping({text: `Hello word test`}, String(msg.key.remoteJid))
}