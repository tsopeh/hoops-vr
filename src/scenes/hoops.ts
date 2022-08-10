import {
  Color3,
  FreeCamera,
  HemisphericLight,
  MeshBuilder,
  PhysicsImpostor,
  PointerEventTypes,
  Scene,
  Tools,
  Vector3,
  WebXRFeatureName,
} from '@babylonjs/core'
import { GridMaterial } from '@babylonjs/materials'
import { SceneParams } from '../scene'

export const createHoopsScene = async (params: SceneParams): Promise<Scene> => {

  const {engine, physicsPlugin, canvas} = params

  const scene = new Scene(engine)
  const gravityVector = new Vector3(0, -9.8, 0)
  scene.enablePhysics(gravityVector, physicsPlugin)

  const camera = new FreeCamera('camera1', new Vector3(0, 2, -450), scene)
  camera.setTarget(new Vector3(0, 10, 400))
  camera.attachControl(canvas, true)

  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
  light.intensity = 0.7

  const environment = scene.createDefaultEnvironment({createGround: false, skyboxSize: 1000})
  environment!.setMainColor(Color3.FromHexString('#74b9ff'))

  const ground = MeshBuilder.CreateGround('ground', {width: 100, height: 1000}, scene)
  ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, {
    mass: 0,
    restitution: 0.7,
    // disableBidirectionalTransformation: true, // Uncomment for perf increase.
  }, scene)
  ground.material = new GridMaterial('mat', scene)

  const torus = MeshBuilder.CreateTorus('torus', {thickness: 0.5, diameter: 10, tessellation: 32}, scene)
  torus.position = new Vector3(0, 10, -400)
  torus.rotation = new Vector3(Tools.ToRadians(90), 0, 0)
  torus.physicsImpostor = new PhysicsImpostor(
    torus,
    PhysicsImpostor.BoxImpostor,
    {
      mass: 0,
      restitution: 1,
    },
  )

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

  scene.onPointerObservable.add((event) => {
    if (event.type === PointerEventTypes.POINTERPICK) {
      const pointerId = (event.event as any).pointerId
      const xrController = xr.pointerSelection.getXRControllerByPointerId(pointerId)
      const isMouseCursorPointer = xrController == null
      const isXrController = xrController?.motionController != null
      if (isMouseCursorPointer || isXrController) {
        const bullet = MeshBuilder.CreateSphere('bullet', {diameter: 0.5})
        // TODO: Toggle this to see the difference.
        // if (xrController) {
        //     xrController.getWorldPointerRayToRef(tmpRay);
        // }
        const ray = /*xrController ? tmpRay :*/event.pickInfo?.ray
        if (ray == null) return
        ray.direction.scaleInPlace(0.2) // TODO: Change this to see what it does?
        bullet.position.copyFrom(ray.origin)
        bullet.position.addInPlace(ray.direction)
        bullet.physicsImpostor = new PhysicsImpostor(bullet, PhysicsImpostor.SphereImpostor, {mass: 3})
        bullet.physicsImpostor.setLinearVelocity(ray.direction.scale(400))
      }
    }
  })

  return scene

}