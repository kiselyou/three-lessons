import { AnimationMixer, AnimationAction, AnimationClip } from 'three'

class AnimationBot {
  /**
   *
   * @param {GLTF} gltf
   */
  constructor(gltf) {
    /**
     *
     * @type {AnimationMixer}
     */
    this.mixer = new AnimationMixer(gltf.model)

    /**
     *
     * @type {AnimationAction}
     */
    this.actionWalking = this.mixer.clipAction(AnimationClip.findByName(gltf.animations, 'Walking'))

    /**
     *
     * @type {AnimationAction}
     */
    this.actionShooting = this.mixer.clipAction(AnimationClip.findByName(gltf.animations, 'Shooting'))
    this.actionShooting.setDuration(0.6)

    /**
     *
     * @type {AnimationAction}
     */
    this.actionDying = this.mixer.clipAction(AnimationClip.findByName(gltf.animations, 'Dying'))

    /**
     *
     * @type {AnimationAction}
     */
    this.actionIdle = this.mixer.clipAction(AnimationClip.findByName(gltf.animations, 'Idle'))

    /**
     *
     * @type {(AnimationAction|?)}
     */
    this.activeAction = null
  }

  /**
   *
   * @returns {AnimationBot}
   */
  pauseAction(action) {
    action.paused = true
    return this
  }

  /**
   *
   * @returns {AnimationBot}
   */
  clearActiveAction() {
    if (this.activeAction) {
      this.pauseAction(this.activeAction)
      this.activeAction = null
    }
    return this
  }

  /**
   *
   * @param {AnimationAction} action
   * @param {number} [duration]
   * @returns {AnimationBot}
   */
  enableAction(action, duration = 0.4) {
    if (this.activeAction === action) {
      return this
    }
    if (this.activeAction) {
      this.activeAction.paused = false
    }
    action.paused = false
    action.enabled = true
    action.setEffectiveTimeScale(1)
    action.setEffectiveWeight(1)
    action.time = 0
    if (this.activeAction) {
      this.activeAction.crossFadeTo(action, duration, true)
    }
    action.play()
    this.activeAction = action
    return this
  }

  /**
   *
   * @returns {AnimationBot}
   */
  idleAnimation() {
    // console.log(this.actionIdle)
    this.enableAction(this.actionIdle)
    return this
  }

  /**
   *
   * @returns {AnimationBot}
   */
  dyingAnimation() {
    this.enableAction(this.actionDying)
    return this
  }

  /**
   *
   * @returns {AnimationBot}
   */
  walkingAnimation() {
    this.enableAction(this.actionWalking)
    return this
  }

  /**
   *
   * @returns {AnimationBot}
   */
  shootingAnimation() {
    this.enableAction(this.actionShooting)
    return this
  }

  /**
   *
   * @param {number} delta
   * @returns {void}
   */
  update(delta) {
    this.mixer.update(delta)
  }
}

export default AnimationBot