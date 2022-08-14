import {
  AbstractMesh,
  Animation,
  IAnimationKey,
  Material,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  TransformNode,
  Vector3,
} from '@babylonjs/core'

export interface CreateHoopParams {
  id: string
  diameter: number
  tessellation: number
  thickness: number
  scene: Scene
  position: Vector3
  rotation: Vector3
  sensor1Material: Material
  sensor2Material: Material
  animation?: TargetAnimation
}

interface TargetAnimation {
  framerate: number
  affectedProperty: 'position.x' | 'position.y' | 'position.z' | 'rotation.x' | 'rotation.y' | 'rotation.z'
  loopMode: 'relative' | 'cycle' | 'constant'
  keyFrames: ReadonlyArray<IAnimationKey>
  fromFrame: number
  toFrame: number
}

export interface Hoop {
  sensor1: AbstractMesh
  sensor2: AbstractMesh
  dispose: () => void
}

export const createHoop = (params: CreateHoopParams): Hoop => {

  const {
    id,
    diameter,
    thickness,
    tessellation,
    scene,
    position,
    rotation,
    sensor1Material,
    sensor2Material,
    animation,
  } = params

  const hoop = MeshBuilder.CreateTorus(`hoop-${id}`, { diameter, thickness, tessellation }, scene)

  const physicsImpostor = new PhysicsImpostor(
    hoop,
    PhysicsImpostor.MeshImpostor,
    {
      mass: 0,
      friction: 0,
      restitution: 1,
    },
    scene,
  )

  hoop.physicsImpostor = physicsImpostor

  hoop.checkCollisions

  // const viewer = new PhysicsViewer(scene)
  // viewer.showImpostor(physicsImpostor, hoop)

  /**
   * Our goal is to apply physics to the hoop itself and animate the hoop
   * afterwards. Unfortunately the physics and animations are in conflict since
   * they both want to affect the spatial transformation of the mesh
   * (more on that: https://forum.babylonjs.com/t/physics-blocks-animations/4788/2).
   * We resolve this conflict by **firstly** (this is important) applying
   * physics to the `hoop`, **afterwords** we create a fictitious parent
   * to which we apply the animation. This works well, but we stumbled upon
   * a new issue by wanting to firstly rotate the parent and apply the animation
   * to it. It seems that animations affect the local coordinate system,
   * which got messed up by the initial rotation, thus creating undesirable
   * visual output (more on that: https://forum.babylonjs.com/t/rotation-animation-help/1559/4).
   * Finally we can resolve this issue by introducing yet another parent
   * (grandparent to our `hoop` mesh), to which we apply original
   * transformations.
   */

  const hoopParent = new TransformNode(`hoop-parent-${id}`, scene)
  hoop.parent = hoopParent

  const hoopGrandparent = new TransformNode(`hoop-grandparent-${id}`, scene)
  hoopParent.parent = hoopGrandparent
  hoopGrandparent.position = position
  hoopGrandparent.rotation = rotation

  const sensorDepth = 1
  const sensorDiameter = diameter - thickness
  const sensorOffsetFromHoopCenter = (sensorDepth / 2) + (thickness / 2)

  const sensor1 = MeshBuilder.CreateCylinder(`sensor-1-${id}`, {
    diameter: sensorDiameter,
    tessellation,
    height: sensorDepth,
  }, scene)
  sensor1.parent = hoop
  sensor1.position.y = -sensorOffsetFromHoopCenter // Note the `-`.
  sensor1.material = sensor1Material

  const sensor2 = MeshBuilder.CreateCylinder(`sensor-2-${id}`, {
    diameter: sensorDiameter,
    tessellation,
    height: sensorDepth,
  }, scene)
  sensor2.parent = hoop
  sensor2.position.y = sensorOffsetFromHoopCenter
  sensor2.material = sensor2Material

  if (animation != null) {
    const { framerate, affectedProperty, loopMode, keyFrames, fromFrame, toFrame } = animation
    const anim = new Animation(`hoop-animation--${id}`, affectedProperty, framerate, Animation.ANIMATIONTYPE_FLOAT, getConcreteLoopMode(loopMode))
    anim.setKeys([...keyFrames])
    scene.beginDirectAnimation(hoopParent, [anim], fromFrame, toFrame, true)
  }

  return {
    dispose: () => hoopParent.dispose(),
    sensor1,
    sensor2,
  }

}

function getConcreteLoopMode (loopMode: 'relative' | 'cycle' | 'constant'): number {
  switch (loopMode) {
    case 'relative':
      return Animation.ANIMATIONLOOPMODE_RELATIVE
    case 'cycle':
      return Animation.ANIMATIONLOOPMODE_CYCLE
    case 'constant':
      return Animation.ANIMATIONLOOPMODE_CONSTANT
    default:
      return Animation.ANIMATIONLOOPMODE_RELATIVE
  }
}
