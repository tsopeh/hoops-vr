import { AbstractMesh, Scene, Vector3 } from '@babylonjs/core'
import * as MESHWRITER_REQUIRED_METHODS from '@babylonjs/core/Legacy/legacy'
// @ts-ignore
import { MeshWriter } from 'meshwriter'

interface BetterMeshWriterParams {
  scene: Scene
  value: number
  scale: number
  position: Vector3
  rotation: Vector3
}

interface CreateTextMesh {
  scene: Scene,
  value: number,
  scale: number,
  position: Vector3,
  rotation: Vector3
}

interface Writer {
  new (value: string, options: any): this

  getMesh (): AbstractMesh

  dispose (): void
}

export class BetterMeshWriter {

  private readonly _scene: Scene
  private _value: number
  private _scale: number
  private _position: Vector3
  private _rotation: Vector3

  private _writer!: Writer

  public constructor (params: BetterMeshWriterParams) {
    this._scene = params.scene
    this._value = params.value
    this._scale = params.scale
    this._position = params.position
    this._rotation = params.rotation
    this.recreateWriter()
  }

  public get value (): number {
    return this._value
  }

  public get scale (): number {
    return this._scale
  }

  public update (payload: Partial<Pick<BetterMeshWriterParams, 'value' | 'scale' | 'position' | 'rotation'>>): void {
    const { value, scale, position, rotation } = payload
    this._value = value ?? this._value
    this._scale = scale ?? this._scale
    this._position = position ?? this._position
    this._rotation = rotation ?? this._rotation
    this.recreateWriter()
  }

  private createWriter (params: CreateTextMesh): Writer {
    const {
      scene,
      value,
      scale,
      position,
      rotation,
    } = params
    const WriterFactory = MeshWriter(scene, { scale, methods: MESHWRITER_REQUIRED_METHODS })
    const writer: Writer = new WriterFactory(String(value), {
      'font-family': 'Arial',
      'letter-height': 30,
      'letter-thickness': 12,
      color: '#1C3870',
      anchor: 'center',
      colors: {
        diffuse: '#F0F0F0',
        specular: '#000000',
        ambient: '#F0F0F0',
        emissive: '#00ff04',
      },
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
    })
  }

}

