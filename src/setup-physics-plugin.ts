import { AmmoJSPlugin, CannonJSPlugin, OimoJSPlugin } from '@babylonjs/core'
import { IPhysicsEnginePlugin } from '@babylonjs/core/Physics/IPhysicsEngine'
import * as CANNON from 'cannon'
// @ts-ignore
import * as OIMO from 'oimo'

export enum PhysicsEngine {
  CANNON = 'cannon',
  OIMO = 'oimo',
  Ammo = 'ammo'
}

export const getPhysicsPlugin = async (plugin: PhysicsEngine, iterations?: number): Promise<IPhysicsEnginePlugin> => {
  switch (plugin) {
    case PhysicsEngine.CANNON:
      window.CANNON = CANNON
      return new CannonJSPlugin(undefined, iterations)
    case PhysicsEngine.OIMO:
      // @ts-ignore
      window.OIMO = OIMO
      return new OimoJSPlugin(undefined, iterations)
    case PhysicsEngine.Ammo:
      // @ts-ignore
      await Ammo()
      return new AmmoJSPlugin(undefined, iterations)
  }
}
