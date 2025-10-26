import { MathUtils, Vector3 } from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export default class SkyDome {
  public readonly mesh: Sky;
  private readonly sunPosition = new Vector3();

  constructor() {
    this.mesh = new Sky();
    this.mesh.scale.setScalar(450000);

    const uniforms = this.mesh.material.uniforms;
    uniforms.turbidity.value = 8;
    uniforms.rayleigh.value = 2;
    uniforms.mieCoefficient.value = 0.005;
    uniforms.mieDirectionalG.value = 0.8;
  }

  public updateSunPosition(elevation: number): void {
    const azimuth = 180;
    const phi = MathUtils.degToRad(90 - elevation);
    const theta = MathUtils.degToRad(azimuth);

    this.sunPosition.setFromSphericalCoords(1, phi, theta);
    this.mesh.material.uniforms.sunPosition.value.copy(this.sunPosition);
  }
}
