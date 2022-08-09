import { Engine } from '@babylonjs/core'
import { createGrabScene } from './scenes/grab-scene'
import { createShootingScene } from './scenes/shooting-scene'
import { getPhysicsPlugin, PhysicsEngine } from './setup-physics-plugin'

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement // Get the canvas element
const engine = new Engine(canvas, true)

const createScene = false
  ? createGrabScene
  : createShootingScene

const scenePromise = createScene({engine, physicsPlugin: await getPhysicsPlugin(PhysicsEngine.Ammo), canvas})

engine.runRenderLoop(function () {
  scenePromise.then((scene) => {
    scene.render()
  })
})

window.addEventListener('resize', function () {
  engine.resize()
})

