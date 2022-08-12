import { AbstractMesh, Material, MeshBuilder, Scene, Vector3 } from '@babylonjs/core'

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

export interface CreatedHoop {
  hoop: AbstractMesh
  sensor1: AbstractMesh
  sensor2: AbstractMesh
}

export const createHoop = (params: CreateHoopParams): CreatedHoop => {

  const { id, diameter, thickness, tessellation, scene, position, rotation, sensor1Material, sensor2Material } = params

  const hoop = MeshBuilder.CreateTorus(`torus-${id}`, { diameter, thickness, tessellation }, scene)
  hoop.position = position
  hoop.rotation = rotation
  // hoop.physicsImpostor = new PhysicsImpostor(
  //   hoop,
  //   PhysicsImpostor.BoxImpostor,
  //   {
  //     mass: 0,
  //     restitution: 1,
  //   },
  // )

  const sensorDepth = 1

  const sensor1 = MeshBuilder.CreateCylinder(`sensor-1-${id}`, { diameter, tessellation, height: sensorDepth }, scene)
  sensor1.parent = hoop
  sensor1.position.y -= (sensorDepth / 2)
  sensor1.material = sensor1Material

  const sensor2 = MeshBuilder.CreateCylinder(`sensor-2-${id}`, { diameter, tessellation, height: sensorDepth }, scene)
  sensor2.parent = hoop
  sensor2.position.y += (sensorDepth / 2)
  sensor2.material = sensor2Material

  return {
    hoop,
    sensor1,
    sensor2,
  }

}
