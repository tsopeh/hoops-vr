import { Engine } from '@babylonjs/core'
import '@babylonjs/loaders' // Needed for loading the proper controller model.
import { createPrecisionScene } from './scenes/precision'
import { getPhysicsPlugin, PhysicsEngine } from './setup-physics-plugin'

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement // Get the canvas element
const engine = new Engine(canvas, true)

// const createScene = false
//   ? createGrabScene
//   : createShootingScene

const createScene = createPrecisionScene

const scenePromise = createScene({engine, physicsPlugin: await getPhysicsPlugin(PhysicsEngine.CANNON), canvas})

engine.runRenderLoop(function () {
  scenePromise.then((scene) => {
    scene.render()
  })
})

window.addEventListener('resize', function () {
  engine.resize()
})

