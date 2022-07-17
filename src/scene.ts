import { Engine, FreeCamera, HemisphericLight, MeshBuilder, Scene, Vector3 } from '@babylonjs/core'

export const createScene = async (engine: Engine, canvas: HTMLCanvasElement): Promise<Scene> => {

  // This creates a basic Babylon Scene object (non-mesh)
  var scene = new Scene(engine)

  // This creates and positions a free camera (non-mesh)
  var camera = new FreeCamera('camera1', new Vector3(0, 5, -10), scene)

  // This targets the camera to scene origin
  camera.setTarget(Vector3.Zero())

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true)

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7

  // Our built-in 'sphere' shape.
  var sphere = MeshBuilder.CreateSphere('sphere', {diameter: 2, segments: 32}, scene)

  // Move the sphere upward 1/2 its height
  sphere.position.y = 1

  const environment = scene.createDefaultEnvironment()

  if (environment == null || environment.ground == null) {
    throw new Error('Failed to create the default environment or its ground.')
  }

  // XR
  const xrHelper = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [environment.ground],
  })

  return scene

}