import {
  ActionManager,
  Animation,
  ArcRotateCamera,
  Color3,
  ExecuteCodeAction,
  HardwareScalingOptimization,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  SceneOptimizer,
  SceneOptimizerOptions,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core'
import { SceneParams } from '../scene'

export const createPrecisionScene = async (params: SceneParams): Promise<Scene> => {

  const {engine, physicsPlugin, canvas} = params

  const scene = new Scene(engine)
  scene.collisionsEnabled = true
  const gravityVector = new Vector3(0, -9.81, 0)
  scene.enablePhysics(gravityVector, physicsPlugin)
  const t = 0

  const target_point = {
    x: 0,
    y: 3.3,
    z: -0.2,
  }

  const greenTrans = new StandardMaterial('greenTrans', scene)
  greenTrans.diffuseColor = new Color3(0, 1, 0)
  greenTrans.alpha = 0.5

  const greenMat = new StandardMaterial('greenMat', scene)
  greenMat.diffuseColor = new Color3(0, 1, 0)

  const sensor1 = MeshBuilder.CreateBox('sensor1',
    {'height': 0.05, 'width': 0.3, 'depth': 0.3}, scene)
  sensor1.position.z = -0.22
  sensor1.position.y = 3.2
  sensor1.material = greenTrans

  const sensor2 = MeshBuilder.CreateBox('sensor2',
    {'height': 0.05, 'width': 0.3, 'depth': 0.3}, scene)
  sensor2.position.z = -0.22
  sensor2.position.y = 2.8
  sensor2.material = greenTrans

  const person = MeshBuilder.CreateCylinder('person',
    {diameterBottom: 0.5, diameterTop: 0.5, height: 1.6, tessellation: 32}, scene)
  person.position.y = 0.8
  person.position.z = -3

  const frameRate = 15
  const xSlide = new Animation('xSlide', 'position.x', frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE)
  const keyFramesP = []
  keyFramesP.push({
    frame: 0,
    value: 2,
  })
  keyFramesP.push({
    frame: frameRate,
    value: -2,
  })
  keyFramesP.push({
    frame: 2 * frameRate,
    value: 2,
  })
  xSlide.setKeys(keyFramesP)
  scene.beginDirectAnimation(person, [xSlide], 0, 2 * frameRate, true)

  const balls = []
  setInterval(shoot, 250)

  function shoot () {
    if (balls.length < 100) {
      const sphere = MeshBuilder.CreateSphere('sphere', {segments: 32, diameter: 0.246}, scene)
      balls.push(sphere)
      sphere.position = person.getAbsolutePosition()

      const direction = new Vector3(
        target_point.x - sphere.position.x,
        target_point.y - sphere.position.y,
        target_point.z - sphere.position.z,
      )

      const force_scale = get_2dnorm(direction)
      const force = 3.2

      const sphere_imposor = new PhysicsImpostor(
        sphere, PhysicsImpostor.SphereImpostor, {mass: 1, restitution: 0.7}, scene,
      )

      sphere_imposor.applyImpulse(
        new Vector3(
          force / force_scale * direction.x,
          force * 2.3,
          force / force_scale * direction.z),
        sphere.getAbsolutePosition(),
      )
      sphere.physicsImpostor = sphere_imposor

      sphere.actionManager = new ActionManager(scene)
      sphere.actionManager.registerAction(new ExecuteCodeAction(
        {trigger: ActionManager.OnIntersectionExitTrigger, parameter: sensor1},
        function (evt) {
          evt.source.passthrough = 1
        },
      ))
      sphere.actionManager.registerAction(new ExecuteCodeAction(
        {trigger: ActionManager.OnIntersectionExitTrigger, parameter: sensor2},
        function (evt) {
          if (evt.source.passthrough == 1) {
            evt.source.material = greenMat
          }
        },
      ))
    }
  }

  const box = MeshBuilder.CreateBox('box',
    {'height': 1, 'width': 1, 'depth': 0.05}, scene)
  box.position.y = 3.2
  box.physicsImpostor = new PhysicsImpostor(box,
    PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 0.7}, scene)

  const bar1 = MeshBuilder.CreateBox('bar1',
    {'height': 0.05, 'width': 0.5, 'depth': 0.05}, scene)
  bar1.position.z = -0.45
  bar1.position.y = 3
  bar1.physicsImpostor = new PhysicsImpostor(bar1,
    PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 0.7}, scene)

  const bar2 = MeshBuilder.CreateBox('bar2',
    {'height': 0.05, 'width': 0.05, 'depth': 0.45}, scene)
  bar2.position.z = -0.225
  bar2.position.y = 3
  bar2.position.x = 0.225
  bar2.physicsImpostor = new PhysicsImpostor(bar2,
    PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 0.7}, scene)

  const bar3 = MeshBuilder.CreateBox('bar3',
    {'height': 0.05, 'width': 0.05, 'depth': 0.45}, scene)
  bar3.position.z = -0.225
  bar3.position.y = 3
  bar3.position.x = -0.225
  bar3.physicsImpostor = new PhysicsImpostor(bar3,
    PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 0.7}, scene)

  const ground = MeshBuilder.CreateGround('ground1',
    {height: 10, width: 10}, scene)
  ground.position.y = 0
  ground.physicsImpostor = new PhysicsImpostor(ground,
    PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 0.7}, scene)

  // Parameters: alpha, beta, radius, target position, scene
  const camera = new ArcRotateCamera('Camera', 320 / 180 * Math.PI, 70 / 180 * Math.PI, 15,
    new Vector3(0, 0, 0), scene)
  // Positions the camera overwriting alpha, beta, radius
  // This attaches the camera to the canvas
  camera.attachControl(canvas, true)

  scene.activeCamera = camera
  //scene.createDefaultCamera(true, true, true);
  scene.createDefaultLight()
  scene.createDefaultEnvironment({createGround: false})

  const options = new SceneOptimizerOptions()
  options.addOptimization(new HardwareScalingOptimization(0, 1))
  // Optimizer
  const optimizer = new SceneOptimizer(scene, options)

  return scene
}

function get_2dnorm (direction: Vector3) {
  return Math.sqrt(direction.x ** 2 + direction.z ** 2)
}

function get_3dnorm (direction: Vector3) {
  return Math.sqrt(direction.x ** 2 + direction.z ** 2 + direction.y ** 2)
}