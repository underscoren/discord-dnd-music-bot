const Discord = require("discord.js");
const config = require("./config.json");
const webserver = require("./webserver");
const prism = require("prism-media");

const bot = new Discord.Client();

bot.on("ready", () => {
    console.log(`${bot.user.username}#${bot.user.discriminator} (${bot.user.id}) logged in. Active on ${bot.guilds.cache.size} servers`);

    const broadcast = bot.voice.createBroadcast();
    const opusStream = webserver.outputStream.pipe(new prism.opus.Encoder({ frameSize: 960, channels: 2, rate: 48000 }));
    broadcast.play(opusStream, {
        type: "opus",
        volume: false,
        highWaterMark: 1
    });

    bot.on("message", message => {
        //if(message.author.id != "96642719270600704") return;
        
        if(message.content == "!join") {
            let vc = message.member.voice.channel
            if(vc) {
                vc.join().then(connection => {
                    connection.play(broadcast);
                    if(message.deletable) message.delete();
                });
            } else {
                // do some funny response about how you're not in a voice channel
            }
        }

        if(message.content == "!leave") {
            let vc = message.member.voice.channel;
            if(vc) {
                vc.leave();
                if(message.deletable) message.delete();
            }
        }
    });
});



bot.login(config.token);
webserver.start();
