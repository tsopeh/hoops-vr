import { CannonJSPlugin, OimoJSPlugin } from '@babylonjs/core'
import { IPhysicsEnginePlugin } from '@babylonjs/core/Physics/IPhysicsEngine'
import * as CANNON from 'cannon'
// @ts-ignore
import * as OIMO from 'oimo'

window.CANNON = CANNON

// @ts-ignore
window.OIMO = OIMO

export const physicsPlugin: IPhysicsEnginePlugin = true
  ? new CannonJSPlugin(undefined, 5)
  : new OimoJSPlugin(undefined, 10)
