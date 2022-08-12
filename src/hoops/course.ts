import {
  AbstractMesh,
  ActionManager,
  Animation,
  Color3,
  ExecuteCodeAction,
  IAnimationKey,
  Scene,
  StandardMaterial,
} from '@babylonjs/core'
import { BetterMeshWriter, BetterMeshWriterParams, WriterColors } from '../better-mesh-writer'
import { CreatedHoop, createHoop, CreateHoopParams } from './hoop'

export interface CourseParams {
  scene: Scene
  targets: ReadonlyArray<Target>
  score: CourseScore
}

export interface Target {
  hoop: Omit<CreateHoopParams, 'scene' | 'sensor1Material' | 'sensor2Material'>
  animation?: TargetAnimation
}

interface TargetAnimation {
  framerate: number
  affectedProperty: 'position.x' | 'position.y' | 'position.z' | 'rotation.x' | 'rotation.y' | 'rotation.z'
  loopMode: 'relative' | 'cycle' | 'constant'
  keyFrames: ReadonlyArray<IAnimationKey>
  fromFrame: number
  toFrame: number
}

export type CourseScore =
  Omit<BetterMeshWriterParams, 'scene' | 'value' | 'colors'>
  & { scoreColors: WriterColors, winColors: WriterColors }

export class Course {

  private readonly scene: Scene

  private readonly targets: ReadonlyArray<Target>
  private readonly score: BetterMeshWriter

  private activeHoop: CreatedHoop | null = null
  private currentTargetIndex: number = 0

  private readonly bulletMaterial: StandardMaterial
  private readonly scoreWinColors: WriterColors
  private readonly sensorMaterials: ReadonlyArray<StandardMaterial>

  private scoreValue: number = 0

  public constructor (params: CourseParams) {
    this.scene = params.scene
    this.targets = params.targets

    this.sensorMaterials = [
      (() => {
        const mat = new StandardMaterial('sensor1Mat', this.scene)
        mat.diffuseColor = new Color3(0, 1, 0)
        mat.alpha = 0.2
        return mat
      })(),
      (() => {
        const mat = new StandardMaterial('sensor2Mat', this.scene)
        mat.diffuseColor = new Color3(0, 0, 1)
        mat.alpha = 0.2
        return mat
      })(),
    ]
    this.bulletMaterial = new StandardMaterial('bulletMaterial', this.scene)
    this.bulletMaterial.diffuseColor = new Color3(1, 0, 0)
    this.score = new BetterMeshWriter({
      scene: this.scene,
      value: this.scoreValue.toString(),
      scale: params.score.scale,
      position: params.score.position,
      rotation: params.score.rotation,
      colors: params.score.scoreColors,
    })
    this.scoreWinColors = params.score.winColors
    this.renderTarget(this.targets[this.currentTargetIndex])
  }

  public registerBullet (bullet: AbstractMesh): void {

    if (this.activeHoop == null) return

    const { sensor1, sensor2 } = this.activeHoop

    bullet.actionManager = new ActionManager(this.scene)

    bullet.actionManager.registerAction(new ExecuteCodeAction(
      { trigger: ActionManager.OnIntersectionExitTrigger, parameter: sensor1 },
      (event) => {
        event.source.passthrough = 1
      },
    ))

    bullet.actionManager.registerAction(new ExecuteCodeAction(
      { trigger: ActionManager.OnIntersectionExitTrigger, parameter: sensor2 },
      (event) => {
        if (event.source.passthrough == 1) {
          this.onTargetHit(event.source)
        }
      },
    ))

  }

  private renderTarget (target: Target): void {
    this.activeHoop = createHoop({
      ...target.hoop,
      scene: this.scene,
      sensor1Material: this.sensorMaterials[0],
      sensor2Material: this.sensorMaterials[1],
    })
    if (target.animation == null) return
    const { framerate, affectedProperty, loopMode, keyFrames, fromFrame, toFrame } = target.animation
    const hoopMesh = this.activeHoop.hoop
    const animation = new Animation(`hoop-animation--${target.hoop.id}`, affectedProperty, framerate, Animation.ANIMATIONTYPE_FLOAT, getConcreteLoopMode(loopMode))
    animation.setKeys([...keyFrames])
    this.scene.beginDirectAnimation(hoopMesh, [animation], fromFrame, toFrame, true)
  }

  private onTargetHit (bullet: AbstractMesh): void {
    bullet.material = this.bulletMaterial
    this.activeHoop?.sensor1.dispose()
    this.activeHoop?.sensor2.dispose()
    this.activeHoop?.hoop.dispose()
    this.scoreValue++
    this.currentTargetIndex++
    if (this.currentTargetIndex < this.targets.length) {
      this.score.update({
        value: this.scoreValue.toString(),
      })
      this.renderTarget(this.targets[this.currentTargetIndex])
    } else {
      this.score.update({
        value: `CONGRATULATIONS`, // TODO: This should come from input params.
        scale: 0.3, // TODO: This should come from input params.
        colors: this.scoreWinColors,
      })
      this.activeHoop = null
    }

  }

}

function getConcreteLoopMode (loopMode: 'relative' | 'cycle' | 'constant'): number {
  switch (loopMode) {
    case 'relative':
      return Animation.ANIMATIONLOOPMODE_RELATIVE
    case 'cycle':
      return Animation.ANIMATIONLOOPMODE_CYCLE
    case 'constant':
      return Animation.ANIMATIONLOOPMODE_CONSTANT
    default:
      return Animation.ANIMATIONLOOPMODE_RELATIVE
  }
}