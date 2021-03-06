import { Mesh, MeshBasicMaterial, SphereGeometry, Raycaster, Vector3, EventDispatcher } from 'three'
import { Object3DMover2 } from '../../lib'

export default class Charge extends Mesh {
  /**
   *
   * @param {(Bot|Tower|Base|Model)} owner
   * @param {Vector3} position
   * @param {Vector3} direction
   */
  constructor(owner, position, direction) {
    super()
    this.position.copy(position)
    // this.position.setY(13)
    this.applyQuaternion(owner.quaternion)

    this.options = {
      distance: 200,
      speed: 300,
      // TODO: для дебага. Не забыть убрать.
      damage: owner.team.color === '#0000FF' ? 60 : 40
    }

    /**
     *
     * @type {(Bot|Tower|Base|Model)}
     */
    this.owner = owner

    /**
     *
     * @type {Vector3}
     */
    this.direction = new Vector3().copy(direction)

    /**
     *
     * @type {Vector3}
     */
    this.prevPosition = new Vector3().copy(position)

    /**
     *
     * @type {Vector3}
     */
    this.startPosition = new Vector3().copy(position)

    /**
     *
     * @type {SphereGeometry}
     */
    this.geometry = new SphereGeometry(0.6)

    /**
     *
     * @type {MeshBasicMaterial}
     */
    this.material = new MeshBasicMaterial({ color: owner.team.color })

    /**
     *
     * @type {Object3DMover2}
     */
    this.object3DMover = new Object3DMover2(this, direction, this.options.speed)

    /**
     *
     * @type {Raycaster}
     */
    this.raycaster = new Raycaster()

    /**
     *
     * @type {EventDispatcher}
     */
    this.event = new EventDispatcher()

    /**
     *
     * @type {boolean}
     */
    this.destroyed = false
  }

  /**
   *
   * @type {string}
   */
  static COLLISION_EVENT = 'COLLISION_EVENT'

  /**
   * @typedef {Object} CollisionEventOptions
   * @param {string} type
   * @param {Object} intersections
   */

  /**
   * @param {CollisionEventOptions} options
   * @callback collisionEventCallback
   */

  /**
   *
   * @param collisionEventCallback
   * @returns {Charge}
   */
  collisionEvent(collisionEventCallback) {
    this.event.addEventListener(Charge.COLLISION_EVENT, collisionEventCallback)
    return this
  }

  /**
   *
   * @type {string}
   */
  static DESTROY_EVENT = 'DESTROY_EVENT'

  /**
   * @typedef {Object} DestroyEventOptions
   * @param {string} type
   */

  /**
   * @param {DestroyEventOptions} options
   * @callback destroyEventCallback
   */

  /**
   *
   * @param destroyEventCallback
   * @returns {Charge}
   */
  destroyEvent(destroyEventCallback) {
    this.event.addEventListener(Charge.DESTROY_EVENT, destroyEventCallback)
    return this
  }

  /**
   *
   * @returns {Charge}
   */
  dispatchDestroyEvent() {
    this.destroyed = true
    this.event.dispatchEvent({ type: Charge.DESTROY_EVENT })
    return this
  }

  /**
   *
   * @param {Object3D[]} objects
   * @param {boolean} [recursive]
   * @returns {Intersection[]}
   */
  getIntersectionObjects(objects, recursive = false) {
    if (this.prevPosition.equals(this.position) || objects.length === 0) {
      return []
    }
    this.raycaster.ray.origin.copy(this.prevPosition)
    this.raycaster.ray.direction.copy(this.direction)
    this.raycaster.near = 0
    this.raycaster.far = this.prevPosition.distanceTo(this.position)
    // console.log(objects)
    return this.raycaster.intersectObjects(objects, recursive)
  }

  /**
   *
   * @param {number} delta
   * @param {Array.<(ModelBase|ModelBot|ModelTower)>} objects
   * @returns {Charge}
   */
  update(delta, objects) {
    if (this.destroyed) {
      return this
    }
    this.prevPosition.copy(this.position)
    this.object3DMover.update(delta)
    const intersections = this.getIntersectionObjects(objects, true)
    // console.log(intersections.length, intersections)
    if (intersections.length > 0) {
      // console.log(intersections)
      this.event.dispatchEvent({ type: Charge.COLLISION_EVENT, intersections })
    }
    if (this.startPosition.distanceTo(this.position) >= this.options.distance) {
      this.dispatchDestroyEvent()
    }
    return this
  }
}