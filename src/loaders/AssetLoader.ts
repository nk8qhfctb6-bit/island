import { Group, LoadingManager, Scene, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type IslandChunkConfig = {
  path: string;
  position: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
};

export default class AssetLoader {
  private readonly loader: GLTFLoader;
  private readonly loadedMeshes: Group[] = [];

  constructor(manager: LoadingManager, private readonly scene: Scene) {
    this.loader = new GLTFLoader(manager);
  }

  public async loadIslandChunks(chunks: IslandChunkConfig[]): Promise<void> {
    const promises = chunks.map((chunk) => this.loadChunk(chunk));
    await Promise.all(promises);
  }

  public getLoadedMeshes(): Group[] {
    return this.loadedMeshes;
  }

  private async loadChunk(config: IslandChunkConfig): Promise<void> {
    const gltf = await this.loader.loadAsync(config.path);
    const mesh = gltf.scene as Group;

    mesh.position.copy(config.position);
    if (config.rotation) {
      mesh.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
    }
    if (config.scale) {
      mesh.scale.copy(config.scale);
    }

    mesh.traverse((child) => {
      child.castShadow = true;
      child.receiveShadow = true;
    });

    this.loadedMeshes.push(mesh);
    this.scene.add(mesh);
  }
}
