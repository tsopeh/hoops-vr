import { Engine } from '@babylonjs/core'
import { createGrabScene } from './scenes/grab-scene'
import { createShootingScene } from './scenes/shooting-scene'
import { physicsPlugin } from './setup-physics-plugin'

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement // Get the canvas element
const engine = new Engine(canvas, true) // Generate the BABYLON 3D engine

const createScene = true
  ? createGrabScene
  : createShootingScene

const scenePromise = createScene({engine, physicsPlugin, canvas}) //Call the createScene function

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
  scenePromise.then((scene) => {
    scene.render()
  })
})

// Watch for browser/canvas resize events
window.addEventListener('resize', function () {
  engine.resize()
})

