!function() {
  /*
    Thanks Bombita for the original prowler radar code
   */
  const Limit = (top,right,bottom,left) => ({top,right,bottom,left})
  const alliedHemisphere = 'alliedHemisphere'
  const outsideEnemyGateArea = 'outsideEnemyGateArea'
  const outsideEnemyBase = 'outsideEnemyBase'
  const disabled = 'disabled'

  const isActive = () => userSettings.defectType !== 'disabled'
  const isCarryingFlag = (team) => [SWAM.ArrowIndicator.BLUE.tracker.flag.isCarried, SWAM.ArrowIndicator.RED.tracker.flag.isCarried][team]

  const limits = {
    //teams
    1: {
      // top, right, bottom, left
      [alliedHemisphere]: Limit(-8160, 0, 8160, 16352),
      [outsideEnemyBase]: Limit(-1698, 8975, -250, 7188),
      [outsideEnemyGateArea]: Limit(-1698, 8975, 780, 6158)
    },
    2: {
      [alliedHemisphere]: Limit(-8160, -16352, 8160, 0),
      [outsideEnemyBase]: Limit(-2140, -8145, -730, -10086),
      [outsideEnemyGateArea]: Limit(-2140, -7115, 300, -10086)
    }
  }

  // Settings
  const DEFAULT_SETTINGS = {
    'defectType': [outsideEnemyGateArea],
    'flagDefect': true
  }

  let userSettings = DEFAULT_SETTINGS

  const settingsProvider = () => {
    const onApply = (settings) => {
      userSettings = settings
      if (!isActive()) {
        Yt()
      }
    }

    let sp = new SettingsProvider(DEFAULT_SETTINGS, onApply)
    let section = sp.addSection('Deffective Prowler Radar')
    section.addValuesField('defectType', '', {
      [alliedHemisphere]: 'Fails on allied hemisphere',
      [outsideEnemyGateArea]: 'Fails outside enemy base and gate area',
      [outsideEnemyBase]: 'Fails outside enemy base',
      [disabled]: 'Always fails (Disabled)'
    })
    section.addBoolean('flagDefect', 'Fails when team is carrying enemy flag')
    return sp
  }

  const isFailing = ({x, y}) => {
    const team = Players.getMe().team
    if (userSettings.flagDefect && isCarryingFlag(team))
      return true
    const limit = limits[team][userSettings.defectType]
    return y < limit.top || y > limit.bottom || x < limit.left || x > limit.right
  }

  function DrawCircle(Kt) {
    if (isActive()) {
      let Zt = Wt[Kt.id]
      Zt || (Zt = new PIXI.Graphics,
        Zt.clear(),
        Zt.beginFill(16711680, .125),
        Zt.drawCircle(0, 0, zt),
        Zt.endFill(),
        Wt[Kt.id] = Zt,
        game.graphics.layers.groundobjects.addChild(Zt)),
        Zt.position.set(Kt.lowResPos.x, Kt.lowResPos.y),
        Zt.renderable = !isFailing(Kt.lowResPos) && (Kt.removedFromMap || 1 != game.myType && 4 != game.myType || 5 != Kt.type || Kt.team == Players.getMe().team || Kt.hidden || Kt.render && !Kt.stealthed ? !1 : !0)
    }
  }

  function Xt() {
    var Kt = Players.getIDs()
      , Zt = Players.getMe()
    if (isActive())
      for (var Qt in Kt) {
        var Jt = Players.get(Qt)
        if ((1 == game.myType || 4 == game.myType) && 5 == Jt.type && Jt.team != Zt.team) {
          var $t = Tools.distance(Jt.lowResPos.x, Jt.lowResPos.y, Zt.pos.x, Zt.pos.y)
        }
        DrawCircle(Jt, Zt)
      }
  }

  function Yt() {
    for (let Kt in Wt)
      Ht(Kt)
  }

  function Ht(Kt) {
    let Zt = Wt[Kt]
    Zt && (game.graphics.layers.groundobjects.removeChild(Zt),
      Zt.destroy(),
      delete Wt[Kt])
  }

  let Wt = {}
    , zt = 600
    , Vt = 0
  SWAM.on('playerChangedType', Kt => {
      DrawCircle(Players.get(Kt.id))
    }
  )
  SWAM.on('playerKilled', (Kt, Zt) => {
      DrawCircle(Zt)
    }
  )
  SWAM.on('playerStealth', Kt => {
      let Zt = Players.get(Kt.id)
      DrawCircle(Zt)
    }
  )
  SWAM.on('playerDestroyed', Kt => {
      Ht(Kt.id)
    }
  )
  SWAM.on('gamePrep', () => {
      Vt = setInterval(Xt, 500)
    }
  )
  SWAM.on('gameWipe', () => {
      Yt(),
        Vt = clearInterval(Vt)
    }
  )


  // Register the file as an extension
  SWAM.registerExtension({
    name: 'Deffective Prowler Radar',
    id: 'deffectiveProwlerRadar',
    description: 'Perfect is enemy of the good. Featuring a previously perfect prowler radar made by Bombita',
    author: 'Best Korea',
    version: '1.0',
    settingsProvider: settingsProvider()
  })
}()
