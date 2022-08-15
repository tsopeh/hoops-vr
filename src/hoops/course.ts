import { AbstractMesh, Color3, Scene, Sound, StandardMaterial } from '@babylonjs/core'
import { BetterMeshWriter, BetterMeshWriterParams, WriterColors } from '../better-mesh-writer'
import { createHoop, CreateHoopParams, Hoop } from './hoop'

export interface CourseParams {
  scene: Scene
  targets: ReadonlyArray<Target>
  score: CourseScore
}

export interface Target {
  hoop: Omit<CreateHoopParams, 'scene' | 'sensor1Material' | 'sensor2Material'>
}

export type CourseScore =
  Omit<BetterMeshWriterParams, 'scene' | 'value' | 'colors'>
  & { scoreColors: WriterColors, winColors: WriterColors }

export class Course {

  private readonly scene: Scene

  private readonly targets: ReadonlyArray<Target>
  private readonly score: BetterMeshWriter

  private activeHoop: Hoop | null = null
  private currentTargetIndex: number = 0

  private readonly bulletMaterial: StandardMaterial
  private readonly scoreWinColors: WriterColors
  private readonly sensorMaterials: ReadonlyArray<StandardMaterial>

  private scoreValue: number = 0

  private readonly audio: { background: Sound, shoot: Sound, hit: Sound, win: Sound, }

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

    this.audio = {
      background: new Sound('background', 'assets/background.mp3', this.scene, null, { loop: true, autoplay: true }),
      shoot: new Sound('shoot', 'assets/shoot.wav', this.scene, null, { loop: false, autoplay: false }),
      hit: new Sound('hit', 'assets/hit.wav', this.scene, null, { loop: false, autoplay: false }),
      win: new Sound('win', 'assets/win.wav', this.scene, null, { loop: false, autoplay: false }),
    }

  }

  public registerBullet (bullet: AbstractMesh): void {

    this.audio.shoot.play()

    if (this.activeHoop == null) return

    const activeHoop = this.activeHoop

    const { sensor1, sensor2 } = activeHoop

    let didHitSensor1: boolean = false
    let didHitSensor2: boolean = false
    const handler = () => {
      if (bullet.intersectsMesh(sensor1, true)) {
        didHitSensor1 = true
      }
      if (bullet.intersectsMesh(sensor2, true)) {
        didHitSensor2 = true
      }
      const isSameActiveHoop = activeHoop == this.activeHoop
      if (didHitSensor1 && didHitSensor2 && isSameActiveHoop) {
        this.onTargetHit(bullet)
      }
      if (!isSameActiveHoop) {
        this.scene.unregisterBeforeRender(handler)
      }
    }
    this.scene.registerBeforeRender(handler)
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
    this.audio.hit.play()
    this.activeHoop?.dispose()
    this.scoreValue++
    this.currentTargetIndex++
    if (this.currentTargetIndex < this.targets.length) {
      this.score.update({
        value: this.scoreValue.toString(),
      })
      this.renderTarget(this.targets[this.currentTargetIndex])
    } else {
      this.audio.background.setVolume(0.3)
      this.audio.win.onended = () => {
        this.audio.background.setVolume(1)
      }
      this.audio.win.play()

      this.score.update({
        value: `CONGRATULATIONS`, // TODO: This should come from input params.
        scale: 0.3, // TODO: This should come from input params.
        colors: this.scoreWinColors,
      })
      this.activeHoop = null
    }

  }

}
