class Backchannel {

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
    this.onlinePlayers = []
    this.handleKeydown = this.handleKeydown.bind(this)
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
        if (name === "###")
          this.lastReplyPlayer = this.onlinePlayers.find(name => text.indexOf(name) === 0) || this.lastReplyPlayer
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
      "who":/^Online: (.*)/,
      "exit": /^Farewell (.*)\. \[.*]$/,
      "join": /^Welcome (.*)\./,
    }
    switch (true) {
      case commands.who.test(message):
        this.onlinePlayers = message
          .replace(commands.who,"$1").split(",")
          .map(name => name.trim())
        break;
      case commands.join.test(message):
        const joingPlayer = message
          .replace(commands.join,"$1")
        this.onlinePlayers = this.onlinePlayers
          .filter(name => name!==joingPlayer)
          .concat(joingPlayer)
        break;
      case commands.exit.test(message):
        const exitingPlayer = message
          .replace(commands.exit,"$1")
        this.onlinePlayers = this.onlinePlayers.filter(name => name !== exitingPlayer)
    }
  }

  handleKeydown(evt) {
    if (evt.key !== "Tab") {
      return;
    }
    const value = evt.target.value
    const tabbableValues = [
      /^\/\/\s?$/, // "// "
      /^\/\/\/pm\s?(.*)?/, // "//pm" || "//pm anychar..."
    ]
    if (tabbableValues.find(regex => regex.test(value))) {
      const playerAndMessage = value.replace(/^\/\/(\/pm )?/,"").trim()
      const canCompletePlayer = this.onlinePlayers.find(name => name.indexOf(playerAndMessage)===0)
      if (canCompletePlayer) {
        evt.preventDefault()
        evt.stopPropagation()
        this.autoComplete(evt.target,evt.shiftKey)
      }
    }
  }

  autoComplete(el,isShiftPressed) {
    const onlinePlayers = this.onlinePlayers.sort()
    if (el.value === "//" || el.value.trim() === "///pm") {
      el.value = "///pm "+(this.lastReplyPlayer || onlinePlayers[0]) + " "
    } else {
      const maybeIncompletePlayer = el.value.replace("///pm ","").trim()
      const completePlayer = onlinePlayers.find(name => name === maybeIncompletePlayer)
      if (maybeIncompletePlayer === completePlayer) {
        const index = onlinePlayers.indexOf(completePlayer)
        const delta = isShiftPressed ? -1 : 1
        el.value = "///pm "+onlinePlayers[(index + delta + onlinePlayers.length)%onlinePlayers.length] + " "
      } else {
        el.value = "///pm "+ completePlayer + " "
      }
    }
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
    chat && document.getElementById("chatinput").removeEventListener("keydown",chat.handleKeydown)
  })

  SWAM.on("gamePrep", function(){
    if (chat === undefined) {
      chat = new Backchannel("player", settings.secret, settings.server, settings.mscVerbose);
      chat.connect();
    }
    document.getElementById("chatinput").addEventListener("keydown",chat.handleKeydown);

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
