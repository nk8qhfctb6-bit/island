import { PlaneGeometry, RepeatWrapping, TextureLoader, Vector3 } from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';

export default class Ocean {
  public readonly mesh: Water;

  constructor() {
    const geometry = new PlaneGeometry(2000, 2000);

    const waterNormals = new TextureLoader().load(
      '/textures/water_normals.jpg',
      (texture) => {
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
      }
    );

    this.mesh = new Water(geometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new Vector3(0, 1, 0),
      sunColor: 0xffffff,
      waterColor: 0x29a7ff,
      distortionScale: 6,
      fog: true
    });

    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0;
    this.mesh.receiveShadow = true;
  }

  public update(delta: number): void {
    const { uniforms } = this.mesh.material;
    if (uniforms.time) {
      uniforms.time.value += delta;
    }
  }
}
