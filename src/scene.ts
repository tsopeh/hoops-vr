import { Engine } from '@babylonjs/core'
import { IPhysicsEnginePlugin } from '@babylonjs/core/Physics/IPhysicsEngine'

export interface SceneParams {
  engine: Engine
  physicsPlugin: IPhysicsEnginePlugin
  canvas: HTMLCanvasElement
}