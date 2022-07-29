import {
  AbstractMesh,
  ArcRotateCamera,
  Color3,
  Engine,
  Mesh,
  PointLight,
  Ray,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core'

const createComplexScene = async (engine: Engine, canvas: HTMLCanvasElement): Promise<Scene> => {

  const scene = new Scene(engine)

  const light = new PointLight('Omni', new Vector3(0, 100, 100), scene)
  const camera = new ArcRotateCamera('Camera', 0, 0.8, 50, Vector3.Zero(), scene)
  camera.attachControl(canvas, true)

  const ground = Mesh.CreateGround('ground', 500, 500, 10, scene)

  const box = Mesh.CreateBox('box', 4.0, scene)
  box.position.y = 2
  box.scaling.z = 2
  const matBox = new StandardMaterial('matBox', scene)
  matBox.diffuseColor = new Color3(1.0, 0.1, 0.1)
  box.material = matBox
  box.isPickable = true

  const box2 = Mesh.CreateBox('box2', 8.0, scene)
  box2.position = new Vector3(-20, 4, 0)
  const matBox2 = new StandardMaterial('matBox2', scene)
  matBox2.diffuseColor = new Color3(0.1, 0.1, 1)
  box2.material = matBox2

  //  const environment = scene.createDefaultEnvironment();

  // XR
  const xrHelper = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [ground],
  })

  const tmpRay = new Ray(new Vector3(), new Vector3())
  tmpRay.length = 3
  let tmpMesh: AbstractMesh | undefined

//controller input

  xrHelper.input.onControllerAddedObservable.add((controller) => {
    controller.onMotionControllerInitObservable.add((motionController) => {
      if (motionController.handness === 'left') {
        const xr_ids = motionController.getComponentIds()
        let triggerComponent = motionController.getComponent(xr_ids[0])//xr-standard-trigger
        triggerComponent.onButtonStateChangedObservable.add(() => {
          if (triggerComponent.value > 0.5) {
            controller.getWorldPointerRayToRef(tmpRay, true)

            const hit = scene.pickWithRay(tmpRay)

            if (hit != null && hit.pickedMesh != undefined) {
              tmpMesh = hit.pickedMesh
              console.log('name:' + hit.pickedMesh.name)
              //tmpMesh.parent= controller.grip;//tmpMesh is set on inappropriate position.
              tmpMesh.setParent(motionController.rootMesh)
            }

            //released button
          } else if (triggerComponent.value < 0.5) {
            if (tmpMesh != undefined) {
              // tmpMesh.parent= null;
              tmpMesh.setParent(null)
            }

          }
        })

      }

    })

  })

  return scene

}

export const createScene = createComplexScene