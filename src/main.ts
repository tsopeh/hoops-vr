import { Engine } from '@babylonjs/core'
import '@babylonjs/gui'
import '@babylonjs/gui-editor'
import '@babylonjs/inspector'
import '@babylonjs/loaders' // Needed for loading the proper controller model.
import '@babylonjs/serializers'
import { createBasketballScene } from './demos/basketball'
import { createGrabScene } from './demos/grab-scene'
import { createTowersScene } from './demos/towers'
import { createHoopsScene } from './hoops/scene'
import { getPhysicsPlugin, PhysicsEngine } from './setup-physics-plugin'

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement // Get the canvas element
const engine = new Engine(canvas, true)

const myScenes = {
  createGrabScene,
  createTowersScene,
  createBasketballScene,
  createHoopsScene,
}

getPhysicsPlugin(PhysicsEngine.CANNON)
  .then(physicsPlugin => {
    return myScenes.createHoopsScene({
      engine,
      physicsPlugin,
      canvas,
    })
  })
  .then(scene => {
    engine.runRenderLoop(function () {
      scene.render()
    })
    scene.debugLayer.show()
  })

window.addEventListener('resize', function () {
  engine.resize()
})

