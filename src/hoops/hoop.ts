import { AbstractMesh, Material, MeshBuilder, PhysicsImpostor, PhysicsViewer, Scene, Vector3 } from '@babylonjs/core'

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
}

export interface Hoop {
  hoop: AbstractMesh
  sensor1: AbstractMesh
  sensor2: AbstractMesh
}

export const createHoop = (params: CreateHoopParams): Hoop => {

  const { id, diameter, thickness, tessellation, scene, position, rotation, sensor1Material, sensor2Material } = params

  const hoop = MeshBuilder.CreateTorus(`hoop-${id}`, { diameter, thickness, tessellation }, scene)
  hoop.position = position
  hoop.rotation = rotation
  const physicsImpostor = new PhysicsImpostor(
    hoop,
    PhysicsImpostor.MeshImpostor,
    {
      mass: 0,
      friction: 0.5,
      restitution: 0.3,
    },
  )
  const viewer = new PhysicsViewer(scene)
  viewer.showImpostor(physicsImpostor, hoop)
  hoop.physicsImpostor = physicsImpostor

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

  return {
    hoop,
    sensor1,
    sensor2,
  }

}
