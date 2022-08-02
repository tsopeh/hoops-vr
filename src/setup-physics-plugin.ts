import { CannonJSPlugin, OimoJSPlugin } from '@babylonjs/core'
import * as CANNON from 'cannon'
// @ts-ignore
import * as OIMO from 'oimo'

window.CANNON = CANNON

// @ts-ignore
window.OIMO = OIMO

export const physicsPlugin = true
  ? new CannonJSPlugin()
  : new OimoJSPlugin()
