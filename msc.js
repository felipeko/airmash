class Backchannel {

  onlinePlayers = []

  constructor(nick, secret, server="wss://nuppet.starma.sh:9595", verbose=true) {
    if (!secret) {
      throw "Secret is required. Like `new Backchannel('twoshot', 'lol-not-that-stupid');`";
    }
    if (!nick) {
      throw "Nickname is required. Like `new Backchannel('twoshot', 'lol-not-that-stupid');`";
    }
    this.connection = null;
    this.nick = nick;
    this.server = server;
    this.secret = secret;
    this.verbose = verbose;
  }

  connect() {
    try {
      if (this.connection.readyState != this.connection.CLOSED) return;
    } catch (e) {
      // just continue
    }

    console.log("Connecting. Use `chat.cmd(msg)` for server commands, `chat.say(msg)` to chat, `chat.mini(msg)` to shitpost.");

    let connection = this.connection = new WebSocket(this.server);

    connection.onopen = (event) => connection.send(this.secret);

    connection.onmessage = (event) => {
      try {
        let re = /^(\S+)\s(\S+)\s(.*)/;
        let msg = event.data.split(re);
        let type = msg[2];
        let name = msg[1];
        let text = msg[3];
        if (text === undefined) throw 'malformedMessage';
        switch (text) {
          case "-ping":
            if (Players.getMe() === undefined) {
              this.send("mini", "JS Console / Limbo / " + this.nick);
            } else {
              this.send("mini", game.playHost + " / " + game.playPath + " / " + Players.getMe().name);
            }
            break;
          default:
            this.print(type, name, text);
            break;
        }
      } catch (e) {
        console.log(e + " /// " + event.data);
        return;
      }
    }

    connection.onerror = (event) => {
      this.print("mini", "Disconnected from Multi Server Chat.");
      connection.close();
    }
  }

  print(type, name, text) {
    switch (type) {
      case "mini":
        SWAM.SmallLog.add('<div style="color: #FCF">&#x1F4AC; ' +
          UI.escapeHTML(name) +
          '<span style="margin: 0 10px; opacity: 0.8;">' +
          UI.escapeHTML(text) +
          '</span></div>');
        if (name === "###")
          this.updatePlayerOnMessage(text)
        break;
      case "chat":
        UI.addChatLine({id: 0, name: name}, text, 0);
        break;
    }
    if (this.verbose) console.log(`[${type}] ${name}: ${text}`);
  };

  send(type, text) {
    if (this.connection.readyState === this.connection.CLOSED) {
      this.connect();
    }
    this.connection.send(type + " " + text);
  };

  say(msg){ this.send("chat", msg) }
  mini(msg){ this.send("mini", msg) }
  cmd(msg){ this.send("cmd", msg) }

  updatePlayerOnMessage(message) {
    const commands = {
      "who":/^Online: /,
      "exit": /^Farewell /,
      "join": /^Welcome /,
    }
    if (message.test(commands.who)===0) {
      this.onlinePlayers = message
        .replace(commands.who,"").split(",")
        .map(name => name.trim())
    } else if (message.test(commands.exit)) {
      const exitingPlayer = message
        .replace(commands.exit,"")
        .replace(/\. \[.*\]$/,"")
      this.onlinePlayers = this.onlinePlayers.filter(name => name !== exitingPlayer)
    } else if (message.test(commands.join)) {
      const joingPlayer = message
        .replace(commands.join,"")
        .slice(0,-1)
      this.onlinePlayers = this.onlinePlayers.concat(joingPlayer)
    }
  }

  handleKeydown(evt) {
    console.log(evt,evt.target)
  }
}

var chat;

!function () {
  // Default values for the settings
  let settings = {
    server: "wss://nuppet.starma.sh:9595",
    secret: "please-change-me",
    mscVerbose: false
  };

  // This is the handler that will be executed when new settings are applied
  function settingsApplied(values)
  {
    settings = values;
  }

  // creates an instance of SettingsProvider
  function createSettingsProvider()
  {
    let sp = new SettingsProvider(settings, settingsApplied);

    let section = sp.addSection("Multi-Server Chat");

    section.addString("server",
      "Chat server address.",
      {maxLength: 30});
    section.addString("secret",
      "Secret pass word.",
      {maxLength: 40});
    section.addBoolean("mscVerbose",
      "Log chat to console?");

    // we return our SettingsProvider instance
    return sp;
  }

  SWAM.on("gameWipe", () => {
    document.getElementById("chatinput").removeEventListener("keydown",chat.keydown)
  })

  SWAM.on("gamePrep", function(){
    if (chat === undefined) {
      chat = new Backchannel("player", settings.secret, settings.server, settings.mscVerbose);
      chat.connect();
      document.getElementById("chatinput").addEventListener("keydown",chat.handleKeydown)
    }

    if (UI.realparseCommand != undefined) { return; }
    UI.realparseCommand = UI.parseCommand;
    UI.parseCommand = function (text) {
      if ("////" === text.substr(0,4)) {
        chat.mini(text.substr(4));
        return !0;
      }
      if ("///" === text.substr(0,3)) {
        chat.cmd(text.substr(3));
        return !0;
      }
      if ("//pm " === text.substr(0, 5)) {
        chat.cmd(text.substr(2));
        return !0;
      }
      if ("//" === text.substr(0,2)) {
        chat.say(text.substr(2));
        return !0;
      }
      return UI.realparseCommand(text);
    }
  });

  SWAM.registerExtension({
    name:"Multi-Server Chat",
    id:"mschatv3",
    description:"Chat with everyone else using this extension, no matter where they are. Just begin messages with two slashes: //",
    version:"37",
    author:"Nuppet",
    settingsProvider: createSettingsProvider()
  });

}();
