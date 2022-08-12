import { AbstractMesh, ActionManager, Color3, ExecuteCodeAction, Scene, StandardMaterial } from '@babylonjs/core'
import { BetterMeshWriter, BetterMeshWriterParams } from '../better-mesh-writer'
import { CreatedHoop, createHoop, CreateHoopParams } from './hoop'

export interface CourseParams {
  scene: Scene
  targets: ReadonlyArray<Target>
  score: Omit<BetterMeshWriterParams, 'scene'>
}

export interface Target {
  hoop: Omit<CreateHoopParams, 'scene' | 'sensor1Material' | 'sensor2Material'>
}

export class Course {

  private readonly scene: Scene
  private readonly targets: ReadonlyArray<Target>
  private readonly score: BetterMeshWriter
  private activeHoop!: CreatedHoop
  private currentTargetIndex: number = 0
  private readonly bulletMaterial: StandardMaterial

  private readonly sensorMaterials: ReadonlyArray<StandardMaterial>

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
    this.score = new BetterMeshWriter({ ...params.score, scene: this.scene })
    this.renderTarget(this.targets[this.currentTargetIndex])
  }

  public registerBullet (bullet: AbstractMesh): void {

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
  }

  private onTargetHit (bullet: AbstractMesh): void {
    bullet.material = this.bulletMaterial
    this.activeHoop?.hoop.dispose()
    this.currentTargetIndex++
    if (this.currentTargetIndex < this.targets.length) {
      this.score.update({
        value: this.score.value + 1,
      })
      this.renderTarget(this.targets[this.currentTargetIndex])
    } else {
      this.score.update({
        value: 666,
      })
    }

  }

}