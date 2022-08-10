import { Engine } from '@babylonjs/core'
import '@babylonjs/loaders'
import { createBasketballScene } from './scenes/basketball'
import { createGrabScene } from './scenes/grab-scene'
import { createHoopsScene } from './scenes/hoops' // Needed for loading the proper controller model.
import { createShootingScene } from './scenes/shooting-scene'
import { getPhysicsPlugin, PhysicsEngine } from './setup-physics-plugin'

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement // Get the canvas element
const engine = new Engine(canvas, true)

const myScenes = {
  createGrabScene,
  createShootingScene,
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
  })
})

window.addEventListener('resize', function () {
  engine.resize()
})

