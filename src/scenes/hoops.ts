import {
  AbstractMesh,
  ActionManager,
  Color3,
  ExecuteCodeAction,
  FreeCamera,
  HemisphericLight,
  Material,
  MeshBuilder,
  PhysicsImpostor,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  Tools,
  Vector3,
  WebXRFeatureName,
} from '@babylonjs/core'
import { GridMaterial } from '@babylonjs/materials'
import { SceneParams } from '../scene'

export const createHoopsScene = async (params: SceneParams): Promise<Scene> => {

  const { engine, physicsPlugin, canvas } = params

  const scene = new Scene(engine)
  const gravityVector = new Vector3(0, -9.8, 0)
  scene.enablePhysics(gravityVector, physicsPlugin)

  const camera = new FreeCamera('camera1', new Vector3(0, 2, -450), scene)
  camera.setTarget(new Vector3(0, 10, 400))
  camera.attachControl(canvas, true)

  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
  light.intensity = 0.7

  const environment = scene.createDefaultEnvironment({ createGround: false, skyboxSize: 1000 })
  environment!.setMainColor(Color3.FromHexString('#74b9ff'))

  const ground = MeshBuilder.CreateGround('ground', { width: 100, height: 1000 }, scene)
  ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, {
    mass: 0,
    restitution: 0.7,
    // disableBidirectionalTransformation: true, // Uncomment for perf increase.
  }, scene)
  ground.material = new GridMaterial('mat', scene)

  // TODO: Add a fixed place from where one can shoot the hoops.

  const xr = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [ground],
  })

  const xrControllerPhysics = xr.baseExperience.featuresManager.enableFeature(WebXRFeatureName.PHYSICS_CONTROLLERS, 'latest', {
    xrInput: xr.input,
    physicsProperties: {
      restitution: 0.5,
      impostorSize: 0.1,
      impostorType: PhysicsImpostor.BoxImpostor,
    },
    enableHeadsetImpostor: true,
  })

  const sensor1Mat = (() => {
    const mat = new StandardMaterial('sensor1Mat', scene)
    mat.diffuseColor = new Color3(0, 1, 0)
    mat.alpha = 0.2
    return mat
  })()

  const sensor2Mat = (() => {
    const mat = new StandardMaterial('sensor2Mat', scene)
    mat.diffuseColor = new Color3(0, 0, 1)
    mat.alpha = 0.2
    return mat
  })()

  const sensors1 = createHoop({
    id: 'hoop1',
    diameter: 10,
    thickness: 1,
    tessellation: 32,
    position: new Vector3(0, 10, -400),
    rotation: new Vector3(Tools.ToRadians(90), 0, 0),
    scene: scene,
    sensor1Material: sensor1Mat,
    sensor2Material: sensor2Mat,
  })

  const activeHoops: Array<Sensors> = [sensors1]

  scene.onPointerObservable.add((event) => {
    if (event.type === PointerEventTypes.POINTERPICK) {
      const pointerId = (event.event as any).pointerId
      const xrController = xr.pointerSelection.getXRControllerByPointerId(pointerId)
      const isMouseCursorPointer = xrController == null
      const isXrController = xrController?.motionController != null
      if (isMouseCursorPointer || isXrController) {
        const bullet = MeshBuilder.CreateSphere('bullet', { diameter: 0.5 })
        // TODO: Toggle this to see the difference.
        // if (xrController) {
        //     xrController.getWorldPointerRayToRef(tmpRay);
        // }
        const ray = /*xrController ? tmpRay :*/event.pickInfo?.ray
        if (ray == null) return
        ray.direction.scaleInPlace(0.2) // TODO: Change this to see what it does?
        bullet.position.copyFrom(ray.origin)
        bullet.position.addInPlace(ray.direction)
        bullet.physicsImpostor = new PhysicsImpostor(
          bullet,
          PhysicsImpostor.SphereImpostor,
          { mass: 3 },
        )

        bullet.actionManager = new ActionManager(scene)

        activeHoops.forEach(({ sensor1, sensor2 }) => {

          bullet!.actionManager!.registerAction(new ExecuteCodeAction(
            { trigger: ActionManager.OnIntersectionExitTrigger, parameter: sensor1 },
            (event) => {
              event.source.passthrough = 1
            },
          ))

          const bulletMat = new StandardMaterial('bulletMat', scene)
          bulletMat.diffuseColor = new Color3(1, 0, 0)

          bullet!.actionManager!.registerAction(new ExecuteCodeAction(
            { trigger: ActionManager.OnIntersectionExitTrigger, parameter: sensor2 },
            (event) => {
              if (event.source.passthrough == 1) {
                event.source.material = bulletMat
              }
            },
          ))
        })

        bullet.physicsImpostor.setLinearVelocity(ray.direction.scale(400))
      }
    }
  })

  return scene

}

interface CreateHoopParams {
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

interface Sensors {
  sensor1: AbstractMesh
  sensor2: AbstractMesh
}

const createHoop = (params: CreateHoopParams): Sensors => {

  const { id, diameter, thickness, tessellation, scene, position, rotation, sensor1Material, sensor2Material } = params

  const torus = MeshBuilder.CreateTorus(`torus-${id}`, { diameter, thickness, tessellation }, scene)
  torus.position = position
  torus.rotation = rotation
  torus.physicsImpostor = new PhysicsImpostor(
    torus,
    PhysicsImpostor.BoxImpostor,
    {
      mass: 0,
      restitution: 1,
    },
  )

  const sensorDepth = 1

  const sensor1 = MeshBuilder.CreateCylinder(`sensor-1-${id}`, { diameter, tessellation, height: sensorDepth }, scene)
  sensor1.parent = torus
  sensor1.position.y -= (sensorDepth / 2)
  sensor1.material = sensor1Material

  const sensor2 = MeshBuilder.CreateCylinder(`sensor-2-${id}`, { diameter, tessellation, height: sensorDepth }, scene)
  sensor2.parent = torus
  sensor2.position.y += (sensorDepth / 2)
  sensor2.material = sensor2Material

  return {
    sensor1,
    sensor2,
  }

}