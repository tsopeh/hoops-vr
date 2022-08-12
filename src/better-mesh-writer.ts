import { AbstractMesh, Scene, Vector3 } from '@babylonjs/core'
import * as MESHWRITER_REQUIRED_METHODS from '@babylonjs/core/Legacy/legacy'
// @ts-ignore
import { MeshWriter } from 'meshwriter'

export interface BetterMeshWriterParams {
  scene: Scene
  value: string
  scale: number
  position: Vector3
  rotation: Vector3
  colors: WriterColors
}

interface CreateTextMesh {
  scene: Scene,
  value: string,
  scale: number,
  position: Vector3,
  rotation: Vector3
  colors: WriterColors
}

interface Writer {
  new (value: string, options: any): this

  getMesh (): AbstractMesh

  dispose (): void
}

export interface WriterColors {
  diffuse: string,
  specular: string,
  ambient: string,
  emissive: string,
}

export class BetterMeshWriter {

  private readonly _scene: Scene
  private _value: string
  private _scale: number
  private _position: Vector3
  private _rotation: Vector3
  private _colors: WriterColors

  private _writer!: Writer

  public constructor (params: BetterMeshWriterParams) {
    this._scene = params.scene
    this._value = params.value
    this._scale = params.scale
    this._position = params.position
    this._rotation = params.rotation
    this._colors = params.colors
    this.recreateWriter()
  }

  public update (payload: Partial<Pick<BetterMeshWriterParams, 'value' | 'scale' | 'position' | 'rotation' | 'colors'>>): void {
    const { value, scale, position, rotation, colors } = payload
    this._value = value ?? this._value
    this._scale = scale ?? this._scale
    this._position = position ?? this._position
    this._rotation = rotation ?? this._rotation
    this._colors = colors ?? this._colors
    this.recreateWriter()
  }

  private createWriter (params: CreateTextMesh): Writer {
    const {
      scene,
      value,
      scale,
      position,
      rotation,
      colors,
    } = params
    const WriterFactory = MeshWriter(scene, { scale, methods: MESHWRITER_REQUIRED_METHODS })
    const writer: Writer = new WriterFactory(value, {
      'font-family': 'Arial',
      'letter-height': 30,
      'letter-thickness': 12,
      color: '#1C3870',
      anchor: 'center',
      colors,
      position: position.scale(1 / scale),
    })
    const mesh = writer.getMesh()
    mesh.rotation = rotation
    return writer
  }

  private recreateWriter (): void {
    this._writer?.dispose()
    this._writer = this.createWriter({
      scene: this._scene,
      value: this._value,
      scale: this._scale,
      position: this._position,
      rotation: this._rotation,
      colors: this._colors,
    })
  }

}

