import Map from './map/Map'
import Bot from './map/units/Bot'
import Charge from './map/units/Charge'
import LoadingModels from './LoadingModels'
import ModelBot from "./map/models/ModelBot";
import ModelBase from "./map/models/ModelBase";
import ModelTower from "./map/models/ModelTower";

export default class PlayController {
  /**
   *
   * @param {Scene} scene
   */
  constructor(scene) {
    /**
     *
     * @type {Scene}
     */
    this.scene = scene

    /**
     *
     * @type {Map}
     */
    this.map = new Map(scene)

    /**
     *
     * @type {LoadingModels}
     */
    this.loadingModels = new LoadingModels()

    /**
     *
     * @type {{tmp: number, interval: number, enabled: boolean}}
     */
    this.waveBotsOptions = { interval: 30, enabled: false, tmp: 0 }
  }

  /**
   *
   * @returns {void}
   */
  async preset() {
    await this.loadingModels.presetModels()
  }

  /**
   *
   * @returns {PlayController}
   */
  startRenderWaveBots() {
    this.waveBotsOptions.enabled = true
    this.waveBotsOptions.tmp = 0
    return this
  }

  /**
   *
   * @returns {PlayController}
   */
  stopRenderWaveBots() {
    this.waveBotsOptions.enabled = false
    this.waveBotsOptions.tmp = 0
    return this
  }

  /**
   *
   * @param {Object} rawMap
   * @returns {PlayController}
   */
  renderMap(rawMap) {
    this.map.preset(rawMap, this.loadingModels)
    for (const team of this.map.teams) {
      for (const base of team.bases) {
        base.destroyEvent(() => this.map.removeBase(base))
      }
    }

    // Добавляем логику событий для башни
    for (const tower of this.map.towers) {
      tower.shotEvent((shotOptions) => {
        const charge = new Charge(tower, shotOptions.position, shotOptions.direction)
        charge.collisionEvent((options) => {
          const model = options.intersections[0]['object']
          model.hit(charge)
          charge.dispatchDestroyEvent()
        })
        charge.destroyEvent(() => this.map.removeCharge(charge))
        this.map.addCharge(charge)
      })
      tower.destroyEvent(() => this.map.removeTower(tower))
    }
    return this
  }

  enshureModelUnit(intersectObject) {
    if (intersectObject instanceof ModelBot) {
      return intersectObject
    }

    if (intersectObject instanceof ModelBase) {
      return intersectObject
    }

    if (intersectObject instanceof ModelTower) {
      return intersectObject
    }

    if (intersectObject.parent) {
      return this.enshureModelUnit(intersectObject.parent)
    }

    return null
  }

  /**
   *
   * @returns {PlayController}
   */
  renderWaveBots() {
    for (const team of this.map.teams) {
      if (team.defeat) {
        continue
      }
      for (const road of this.map.roads) {
        for (const base of team.bases) {
          const gltf = this.loadingModels.getGLTF(LoadingModels.MODEL_BOT)
          const bot = new Bot(team, gltf, road.points, base.position)
          // Добавляем логику событий для ботов
          bot.shotEvent((shotOptions) => {
            const charge = new Charge(bot, shotOptions.position, shotOptions.direction)
            charge.collisionEvent((options) => {
              const model = this.enshureModelUnit(options.intersections[0]['object'])
              model.hit(charge)
              charge.dispatchDestroyEvent()
            })

            charge.destroyEvent(() => this.map.removeCharge(charge))
            this.map.addCharge(charge)
          })
          bot.destroyEvent(() => this.map.removeBot(bot))
          this.map.addBot(bot)
        }
      }
    }
    return this
  }

  /**
   *
   * @param {number} delta
   * @returns {PlayController}
   */
  update(delta) {
    const teams = this.map.getTeams()
    if (teams.length === 1) {
      // Game finished
      return this
    }

    for (const bot of this.map.bots) {
      const units = this.map.getEnemyUnits(bot.team)
      bot.tryCaptureTarget(units).update(delta)
    }

    for (const tower of this.map.towers) {
      const units = this.map.getEnemyUnits(tower.team)
      tower.tryCaptureTarget(units).update(delta)
    }

    for (const base of this.map.bases) {
      base.update(delta)
    }

    for (const charge of this.map.charges) {
      const units = this.map.getEnemyUnits(charge.owner.team)
      charge.update(delta, units)
    }

    if (!this.waveBotsOptions.enabled) {
      return this
    }
    this.waveBotsOptions.tmp += delta
    if (this.waveBotsOptions.tmp >= this.waveBotsOptions.interval) {
      this.waveBotsOptions.tmp = 0
      this.renderWaveBots()
    }

    return this
  }
}