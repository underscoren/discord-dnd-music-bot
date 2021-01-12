# Discord DnD music bot

A discord music bot that is controlled by the browser and uses the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), designed to quickly and easily mix background music, ambience and sound effects for tabletop roleplaying games.

## Usage

You will need nodejs, npm and a [discord bot](https://discord.com/developers/applications).

Clone the git repo and run `npm install`. Open up config.json and enter your bot token into "your token here".

Invite the bot to your server, making sure to give it permissions to receive messages, join audio channels and speak.

Start the bot using `npm run start`. Put all your music into the `dist\audio\music` folder, and sound effects into `dist\audio\sfx`.

Open up a web browser and go to [http://localhost](http://localhost), tell your bot to join a voice channel with the `!join` command, and start playing audio using the browser.

## Building

If you made changes to the web app (or just wanna build it from scratch) then run `npm run build` to build new css and js. Currently the HTML resides in the `dist` folder because im lazy and don't feel like adding a bunch more dependencies.

## Design

The project consists of three parts: the bot, the server and the browser. 

The bot connects to voice channels and plays audio. Each user can set the volume of the audio to best suit their preferences.

The local webserver hosts the audio, webapp and websocket server. The browser loads the audio, uses the Web Audio API to process and apply effects, and then it sends the raw audio samples to the bot via websockets.

The websocket server receives and encodes the raw audio stream into opus packets, and the stream is sent directly to discord.

## TODO

 - Queue system
 - Control Panel
 - Searching
 - Audio Effects
 - Favourites list
 - Save and load sessions