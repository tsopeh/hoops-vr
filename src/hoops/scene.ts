import {
  Color3,
  FreeCamera,
  HemisphericLight,
  MeshBuilder,
  PhysicsImpostor,
  PointerEventTypes,
  Ray,
  Scene,
  StandardMaterial,
  Tools,
  Vector3,
  WebXRFeatureName,
} from '@babylonjs/core'
import { GridMaterial } from '@babylonjs/materials'
import { SceneParams } from '../scene'
import { Course } from './course'

export const createHoopsScene = async (params: SceneParams): Promise<Scene> => {

  const { engine, physicsPlugin, canvas } = params

  const scene = new Scene(engine)
  const gravityVector = new Vector3(0, -9.8, 0)
  scene.enablePhysics(gravityVector, physicsPlugin)

  scene.collisionsEnabled = true

  const camera = new FreeCamera('camera1', new Vector3(0, 2, 0), scene)
  camera.setTarget(new Vector3(0, 10, 400))
  camera.attachControl(canvas, true)

  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
  light.intensity = 0.7

  const environment = scene.createDefaultEnvironment({ createGround: false, skyboxSize: 10000 })
  environment!.setMainColor(Color3.FromHexString('#74b9ff'))

  const ground = MeshBuilder.CreateGround('ground', { width: 50, height: 1000 }, scene)
  ground.physicsImpostor = new PhysicsImpostor(
    ground,
    PhysicsImpostor.BoxImpostor, {
      mass: 0,
      restitution: 0.7,
      // disableBidirectionalTransformation: true, // Uncomment for perf increase.
    },
    scene,
  )
  ground.position.z = 475
  ground.material = new GridMaterial('mat', scene)

  const walkableGround = MeshBuilder.CreateGround('walkable-ground', { width: 25, height: 25 }, scene)
  walkableGround.physicsImpostor = new PhysicsImpostor(
    walkableGround,
    PhysicsImpostor.BoxImpostor, {
      mass: 0,
      restitution: 0.7,
    },
    scene,
  )
  walkableGround.position.y = 0.001
  walkableGround.material = (() => {
    const mat = new StandardMaterial('walkable-ground-mat', scene)
    mat.diffuseColor = new Color3(0, 1, 0)
    mat.alpha = 0.3
    return mat
  })()

  // snap points
  const snapPoint1 = MeshBuilder.CreateBox('snapPoint1', { height: 0.01, width: 1, depth: 1 })
  snapPoint1.position.x = 0
  snapPoint1.position.z = 10

  const snapPoint2 = MeshBuilder.CreateBox('snapPoint2', { height: 0.01, width: 1, depth: 1 })
  snapPoint2.position.x = 5
  snapPoint2.position.z = 5

  const snapPoint3 = MeshBuilder.CreateBox('snapPoint3', { height: 0.01, width: 1, depth: 1 })
  snapPoint3.position.x = -5
  snapPoint3.position.z = 5

  const xr = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [walkableGround],
  })

  xr.teleportation.addSnapPoint(snapPoint1.position)
  xr.teleportation.addSnapPoint(snapPoint2.position)
  xr.teleportation.addSnapPoint(snapPoint3.position)

  const xrControllerPhysics = xr.baseExperience.featuresManager.enableFeature(WebXRFeatureName.PHYSICS_CONTROLLERS, 'latest', {
    xrInput: xr.input,
    physicsProperties: {
      restitution: 0.5,
      impostorSize: 0.1,
      impostorType: PhysicsImpostor.BoxImpostor,
    },
    enableHeadsetImpostor: true,
  })

  let hoopIndex = 0
  const getNextHoopId = (): string => {
    hoopIndex++
    return hoopIndex.toString()
  }

  const course = new Course({
    scene,
    targets: [
      {
        hoop: {
          id: getNextHoopId(),
          diameter: 10,
          thickness: 1,
          tessellation: 32,
          position: new Vector3(0, 10, 50),
          rotation: new Vector3(Tools.ToRadians(90), 0, 0),
        },
      },
      {
        hoop: {
          id: getNextHoopId(),
          diameter: 20,
          thickness: 1,
          tessellation: 32,
          position: new Vector3(0, 25, 70),
          rotation: new Vector3(Tools.ToRadians(90), 0, 0),
          animation: {
            framerate: 15,
            loopMode: 'cycle',
            affectedProperty: 'position.x',
            keyFrames: [
              {
                frame: 0,
                value: 0,
              },
              {
                frame: 15,
                value: 10,
              },
              {
                frame: 30,
                value: 0,
              },
              {
                frame: 45,
                value: -10,
              },
              {
                frame: 60,
                value: 0,
              },
            ],
            fromFrame: 0,
            toFrame: 60,
          },
        },
      },
      {
        hoop: {
          id: getNextHoopId(),
          diameter: 15,
          thickness: 1,
          tessellation: 3,
          position: new Vector3(-10, 10, 50),
          rotation: new Vector3(Tools.ToRadians(90), 0, 0),
        },
      },
      {
        hoop: {
          id: getNextHoopId(),
          diameter: 15,
          thickness: 1.5,
          tessellation: 4,
          position: new Vector3(10, 10, 50),
          rotation: new Vector3(Tools.ToRadians(90), 0, 0),
          animation: {
            framerate: 15,
            loopMode: 'cycle',
            affectedProperty: 'rotation.y',
            keyFrames: [
              {
                frame: 0,
                value: 0,
              },
              {
                frame: 120,
                value: 2 * Math.PI,
              },
            ],
            fromFrame: 0,
            toFrame: 120,
          },
        },
      },
      {
        hoop: {
          id: getNextHoopId(),
          diameter: 15,
          thickness: 1,
          tessellation: 5,
          position: new Vector3(0, 8, 40),
          rotation: new Vector3(Tools.ToRadians(90), 0, 0),
        },
      },
    ],
    score: {
      scale: 1,
      position: new Vector3(0, 30, 100),
      rotation: new Vector3(Tools.ToRadians(240), 0, 0),
      scoreColors: {
        diffuse: '#F0F0F0',
        specular: '#000000',
        ambient: '#F0F0F0',
        emissive: '#e7980a',
      },
      winColors: {
        diffuse: '#F0F0F0',
        specular: '#000000',
        ambient: '#F0F0F0',
        emissive: '#1b94de',
      },
    },
  })

  let worldPointerRay: Ray
  scene.onPointerObservable.add((event) => {
    if (event.type === PointerEventTypes.POINTERDOWN) {
      const pointerId = (event.event as any).pointerId
      const xrController = xr.pointerSelection.getXRControllerByPointerId(pointerId)
      const isMouseCursorPointer = xrController == null
      const isXrController = xrController?.motionController != null
      if (isMouseCursorPointer || isXrController) {
        const bullet = MeshBuilder.CreateSphere('bullet', { diameter: 1 })
        if (xrController) {
          // TODO: Toggle this to see the difference.
          // xrController.getWorldPointerRayToRef(worldPointerRay)
        }
        const ray = worldPointerRay != null ? worldPointerRay : event.pickInfo?.ray
        if (ray == null) return
        ray.direction.scaleInPlace(0.2) // TODO: Change this to see what it does?
        bullet.position.copyFrom(ray.origin)
        bullet.position.addInPlace(ray.direction)
        bullet.physicsImpostor = new PhysicsImpostor(
          bullet,
          PhysicsImpostor.SphereImpostor,
          { mass: 3 },
        )

        course.registerBullet(bullet)

        bullet.physicsImpostor.setLinearVelocity(ray.direction.scale(400))
      }
    }
  })

  return scene

}
