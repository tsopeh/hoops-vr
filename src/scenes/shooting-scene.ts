import {
  AbstractMesh,
  Animation,
  BezierCurveEase,
  Color3,
  FreeCamera,
  HemisphericLight,
  MeshBuilder,
  Observer,
  PhysicsImpostor,
  PhysicsJoint,
  PointerEventTypes,
  Quaternion,
  Ray,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
  WebXRFeatureName,
} from '@babylonjs/core'
import '@babylonjs/loaders' // Needed for loading the proper controller model.
import { GridMaterial } from '@babylonjs/materials'
import { SceneParams } from '../scene'

export const createShootingScene = async (params: SceneParams): Promise<Scene> => {

  const {engine, physicsPlugin, canvas} = params

  // This creates a basic Babylon Scene object (non-mesh)
  const scene = new Scene(engine)
  const gravityVector = new Vector3(0, -9.8, 0)
  scene.enablePhysics(gravityVector, physicsPlugin)

  const camera = new FreeCamera('camera1', new Vector3(0, 10, 80), scene)
  camera.setTarget(new Vector3(0, 10, 400))
  camera.attachControl(canvas, true)

  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
  light.intensity = 0.7

  const environment = scene.createDefaultEnvironment({createGround: false, skyboxSize: 1000})
  environment!.setMainColor(Color3.FromHexString('#74b9ff'))

  const ground = MeshBuilder.CreateGround('ground', {width: 1000, height: 1000}, scene)
  ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, {
    mass: 0,
    friction: 0.8,
    restitution: 0.5,
    disableBidirectionalTransformation: true,
  }, scene)
  ground.checkCollisions = true
  ground.material = new GridMaterial('mat', scene)

  // towers
  const towerMeshes: Array<AbstractMesh> = []
  for (var x = 0; x < 7; x++) {
    for (var z = 0; z < 7; z++) {
      const box1 = MeshBuilder.CreateBox('towerBox',
        {width: 2, height: 2, depth: 2}, scene)
      box1.position.x = (x - 4) * 6
      box1.position.y = 2 + z * 2
      box1.position.z = 100
      box1.physicsImpostor = new PhysicsImpostor(box1,
        PhysicsImpostor.BoxImpostor,
        {mass: 1, friction: 0.5, restitution: 0}, scene)
      towerMeshes.push(box1)
    }
  }

  // spheres
  const materialAmiga = new StandardMaterial('amiga', scene)
  const texture = new Texture('/textures/amiga.jpg', scene)
  texture.uScale = 5
  texture.vScale = 5
  materialAmiga.diffuseTexture = texture
  materialAmiga.emissiveColor = new Color3(0.5, 0.5, 0.5)

  let y = 0
  for (var index = 0; index < 20; index++) {
    const sphere = MeshBuilder.CreateSphere('Sphere0', {segments: 16, diameter: 1}, scene)
    sphere.material = materialAmiga
    sphere.position = new Vector3(Math.random() * 20 - 10, y, (Math.random() * 10 - 5) + 80)
    sphere.physicsImpostor = new PhysicsImpostor(sphere, PhysicsImpostor.SphereImpostor, {
      mass: 1,
      restitution: 0.8,
    }, scene)
    y += 2
  }

  // Link
  const spheres = []
  for (index = 0; index < 10; index++) {
    const sphere = MeshBuilder.CreateSphere('Sphere0', {segments: 16, diameter: 0.8}, scene)
    spheres.push(sphere)
    sphere.material = materialAmiga
    sphere.position = new Vector3(Math.random() * 20 - 10, 100, (Math.random() * 10 - 5 + 70))

    sphere.physicsImpostor = new PhysicsImpostor(sphere, PhysicsImpostor.SphereImpostor, {mass: 1}, scene)
  }

  for (index = 0; index < 9; index++) {
    spheres[index].setPhysicsLinkWith(spheres[index + 1], new Vector3(0, 0.5, 0), new Vector3(0, -0.5, 0))
  }

  //boxing area
  const base = MeshBuilder.CreateBox('base', {width: 5, depth: 5, height: 0.1})
  base.position.set(0, 0, 90)
  base.physicsImpostor = new PhysicsImpostor(base,
    PhysicsImpostor.BoxImpostor,
    {mass: 1000, friction: 0.5, restitution: 0}, scene)

  const boxingArray: [Array<AbstractMesh>, Array<AbstractMesh>, Array<AbstractMesh>] = [[], [], []]
  const positions = [
    new Vector3(0, 2.6, 90),
    new Vector3(0, 2.3, 90),
    new Vector3(0, 2.0, 90),
    new Vector3(0, 1.7, 90),
    new Vector3(0, 1.4, 90),
  ]
  let xPos = 0
  for (let i = -1; i < 2; ++i) {
    positions.forEach((position, idx) => {
      const boxingSphere = MeshBuilder.CreateSphere(`boxing_impostor`, {diameter: 0.2}, scene)
      boxingSphere.position.copyFrom(position)
      boxingSphere.position.x = i
      boxingSphere.physicsImpostor = new PhysicsImpostor(boxingSphere, PhysicsImpostor.SphereImpostor, {mass: idx === 0 ? 0 : 1.1 + i}, scene)
      boxingArray[i + 1].push(boxingSphere)

      if (idx === 0) return
      const impostor = boxingArray[i + 1][idx - 1].physicsImpostor
      if (impostor == null) return
      const lockJoint = new PhysicsJoint(PhysicsJoint.LockJoint, {})
      impostor.addJoint(boxingSphere.physicsImpostor, lockJoint)
    })
  }

  // enable xr
  const xr = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [ground],
  })

  // enable physics
  const xrPhysics = xr.baseExperience.featuresManager.enableFeature(WebXRFeatureName.PHYSICS_CONTROLLERS, 'latest', {
    xrInput: xr.input,
    physicsProperties: {
      restitution: 0.5,
      impostorSize: 0.1,
      impostorType: PhysicsImpostor.BoxImpostor,
    },
    enableHeadsetImpostor: true,
  })

  let observers: Record<string, Observer<XRFrame> | null> = {}
  let meshesUnderPointer: Record<string, AbstractMesh> = {}
  const tmpVec = new Vector3()
  const tmpRay = new Ray(new Vector3(), new Vector3())
  let lastTimestamp = 0
  const oldPos = new Vector3()

  const bullets: Array<AbstractMesh> = []

  // show how to use babylon's native pointer events to interact with the input source AND the mouse
  scene.onPointerObservable.add((event) => {
    if (event.type === PointerEventTypes.POINTERPICK) {
      const pointerId = (event.event as any).pointerId
      const inputSource = xr.pointerSelection.getXRControllerByPointerId(pointerId)
      if (!inputSource || (inputSource && inputSource.motionController?.handness === 'right')) {
        const bullet = MeshBuilder.CreateSphere('bullet', {diameter: 0.2})
        // if (inputSource) {
        //     inputSource.getWorldPointerRayToRef(tmpRay);
        // }
        const ray = /*inputSource ? tmpRay :*/event.pickInfo?.ray
        if (ray == null) return
        ray.direction.scaleInPlace(0.2)
        bullet.position.copyFrom(ray.origin)
        bullet.position.addInPlace(ray.direction)
        bullet.physicsImpostor = new PhysicsImpostor(bullet, PhysicsImpostor.SphereImpostor, {mass: 3})
        bullet.physicsImpostor.setLinearVelocity(ray.direction.scale(400))
      }
    }
  })

  // XR-way of interacting with the controllers for the left hand:
  xr.input.onControllerAddedObservable.add((controller) => {
    controller.onMotionControllerInitObservable.add((motionController) => {
      if (motionController.handness === 'left') {
        motionController.getMainComponent().onButtonStateChangedObservable.add((component) => {
          if (component.changes.pressed) {
            if (component.pressed) {
              for (var x = 0; x < 7; x++) {
                for (var z = 0; z < 7; z++) {
                  const box1 = towerMeshes[x * 7 + z]
                  box1.position.x = (x - 4) * 6
                  box1.position.y = 2 + z * 2
                  box1.position.z = 100
                  box1.rotationQuaternion = new Quaternion()
                  box1.physicsImpostor?.setLinearVelocity(Vector3.Zero())
                  box1.physicsImpostor?.setAngularVelocity(Vector3.Zero())
                }
              }
              let bullt
              while (bullt = bullets.pop()) {
                bullt.dispose()
              }
              Object.keys(observers).forEach(id => {
                xr.baseExperience.sessionManager.onXRFrameObservable.remove(observers[id])
                observers[id] = null
              })
            }
          }
        })
        // is squeeze available?
        const squeeze = motionController.getComponentOfType('squeeze')
        if (squeeze) {
          // check its state and handle state changes
          squeeze.onButtonStateChangedObservable.add(() => {
            // pressed was changed
            if (squeeze.changes.pressed) {
              // is it pressed?
              if (squeeze.pressed) {
                // animate position
                controller.getWorldPointerRayToRef(tmpRay, true)
                tmpRay.direction.scaleInPlace(1.5)
                const position = controller.grip ? controller.grip.position : controller.pointer.position

                let mesh = scene.meshUnderPointer
                if (xr.pointerSelection.getMeshUnderPointer) {
                  mesh = xr.pointerSelection.getMeshUnderPointer(controller.uniqueId)
                }
                if (mesh && mesh !== ground && mesh.physicsImpostor) {
                  const animatable = Animation.CreateAndStartAnimation('meshmove',
                    mesh, 'position', 30, 15, mesh.position.clone(),
                    position.add(tmpRay.direction),
                    Animation.ANIMATIONLOOPMODE_CONSTANT,
                    new BezierCurveEase(0.3, -0.75, 0.7, 1.6), () => {
                      if (!mesh) return
                      meshesUnderPointer[controller.uniqueId] = mesh
                      observers[controller.uniqueId] = xr.baseExperience.sessionManager.onXRFrameObservable.add(() => {
                        const delta = (xr.baseExperience.sessionManager.currentTimestamp - lastTimestamp)
                        lastTimestamp = xr.baseExperience.sessionManager.currentTimestamp
                        controller.getWorldPointerRayToRef(tmpRay, true)
                        tmpRay.direction.scaleInPlace(1.5)
                        const position = controller.grip ? controller.grip.position : controller.pointer.position
                        tmpVec.copyFrom(position)
                        tmpVec.addInPlace(tmpRay.direction)
                        tmpVec.subtractToRef(oldPos, tmpVec)
                        tmpVec.scaleInPlace(1000 / delta)
                        meshesUnderPointer[controller.uniqueId].position.copyFrom(position)
                        meshesUnderPointer[controller.uniqueId].position.addInPlace(tmpRay.direction)
                        oldPos.copyFrom(meshesUnderPointer[controller.uniqueId].position)
                        meshesUnderPointer[controller.uniqueId].physicsImpostor?.setLinearVelocity(Vector3.Zero())
                        meshesUnderPointer[controller.uniqueId].physicsImpostor?.setAngularVelocity(Vector3.Zero())
                      })
                    })
                }
              } else {
                // throw the object
                if (observers[controller.uniqueId] && meshesUnderPointer[controller.uniqueId]) {
                  xr.baseExperience.sessionManager.onXRFrameObservable.remove(observers[controller.uniqueId])
                  observers[controller.uniqueId] = null
                  meshesUnderPointer[controller.uniqueId].physicsImpostor?.setLinearVelocity(tmpVec)
                }
              }
            }
          })
        }
      }
    })
  })

  return scene
}
