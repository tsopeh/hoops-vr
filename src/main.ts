import { Engine } from '@babylonjs/core'
import '@babylonjs/gui'
import '@babylonjs/gui-editor'
import '@babylonjs/inspector'
import '@babylonjs/loaders' // Needed for loading the proper controller model.
import '@babylonjs/serializers'
import { createBasketballScene } from './demos/basketball'
import { createGrabScene } from './demos/grab-scene'
import { createTowersScene } from './demos/towers'
import { createHoopsScene } from './hoops/hoops'
import { getPhysicsPlugin, PhysicsEngine } from './setup-physics-plugin'

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement // Get the canvas element
const engine = new Engine(canvas, true)

const myScenes = {
  createGrabScene,
  createTowersScene,
  createBasketballScene,
  createHoopsScene,
}

const scenePromise = myScenes.createHoopsScene({
  engine,
  physicsPlugin: await getPhysicsPlugin(PhysicsEngine.CANNON),
  canvas,
})

engine.runRenderLoop(function () {
  scenePromise.then((scene) => {
    scene.render()
    scene.debugLayer.show()
  })
})

window.addEventListener('resize', function () {
  engine.resize()
})

