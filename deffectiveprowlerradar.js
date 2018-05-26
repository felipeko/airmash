!function() {
  /*
    Thanks Bombita for the original prowler radar code
   */
  const alliedHemisphere = 'alliedHemisphere'
  const outsideEnemyGateArea = 'outsideEnemyGateArea'
  const outsideEnemyBase = 'outsideEnemyBase'
  const isCarryingFlag = (team) => [SWAM.ArrowIndicator.BLUE.tracker.flag.isCarried, SWAM.ArrowIndicator.RED.tracker.flag.isCarried][team]
  const activated = true
  const limits = {
    //teams
    1: {
      // top, right, bottom, left
      [alliedHemisphere]: [-8160, 0, 8160, 16352],
      [outsideEnemyBase]: [-1698, 8975, -250, 7188],
      [outsideEnemyGateArea]: [-1698, 8975, 780, 6158]
    },
    2: {
      [alliedHemisphere]: [-8160, -16352, 8160, 0],
      [outsideEnemyBase]: [-2140, -8145, -730, -10086],
      [outsideEnemyGateArea]: [-2140, -7115, 300, -10086]
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
      if (!activated) {
        Yt()
      }
    }

    let sp = new SettingsProvider(DEFAULT_SETTINGS, onApply)
    let section = sp.addSection('Deffective Prowler Radar')
    section.addValuesField('defectType', 'How defective', {
      [alliedHemisphere]: 'Fails on allied hemisphere',
      [outsideEnemyGateArea]: 'Fails outside enemy base and gate area',
      [outsideEnemyBase]: 'Fails outside enemy base'
    })
    section.addBooleanField('flagDefect', 'Fails when team is carrying enemy flag')
    return sp
  }

  const isFailing = ({x, y}) => {
    const team = Players.getMe().team
    if (userSettings.flagDefect && isCarryingFlag(team))
      return false
    const limit = limits[team][userSettings.defectType]
    return y > limit[0] && y < limit[2] && x > limit[1] && x < limit[3]
  }

  function DrawCircle(Kt) {
    if (activated) {
      let Zt = Wt[Kt.id]
      Zt || (Zt = new PIXI.Graphics,
        Zt.clear(),
        Zt.beginFill(16711680, .125),
        Zt.drawCircle(0, 0, zt),
        Zt.endFill(),
        Wt[Kt.id] = Zt,
        game.graphics.layers.groundobjects.addChild(Zt)),
        Zt.position.set(Kt.lowResPos.x, Kt.lowResPos.y),
        Zt.renderable = !isFailing(kt.lowResPos) && (Kt.removedFromMap || 1 != game.myType && 4 != game.myType || 5 != Kt.type || Kt.team == Players.getMe().team || Kt.hidden || Kt.render && !Kt.stealthed ? !1 : !0)
    }
  }

  function Xt() {
    var Kt = Players.getIDs()
      , Zt = Players.getMe()
    if (!!activated)
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
    version: '0.1',
    settingsProvider: settingsProvider()
  })
}()
