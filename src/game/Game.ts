import {
  Clock,
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  LoadingManager,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from 'three';
import FirstPersonController from '../controls/FirstPersonController';
import AssetLoader from '../loaders/AssetLoader';
import Ocean from '../environment/Ocean';
import SkyDome from '../environment/SkyDome';
import InteractionManager from '../systems/InteractionManager';
import SaveSystem, { PlayerState } from '../persistence/SaveSystem';

export default class Game {
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly controller: FirstPersonController;
  private readonly interactionManager: InteractionManager;
  private readonly clock: Clock;
  private readonly assetLoader: AssetLoader;
  private readonly ocean: Ocean;
  private readonly sky: SkyDome;
  private readonly saveSystem: SaveSystem;
  private pointerLockHandlers: Array<{ onLock: () => void; onUnlock: () => void }> = [];

  constructor(private readonly container: HTMLElement, saveSystem: SaveSystem) {
    this.saveSystem = saveSystem;

    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: false
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(new Color('#62c0ff'));
    this.container.appendChild(this.renderer.domElement);

    this.scene = new Scene();
    this.scene.fog = new FogExp2(0x88c9ff, 0.0008);

    this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(0, 1.7, 5);

    this.controller = new FirstPersonController(this.camera, this.renderer.domElement);
    this.interactionManager = new InteractionManager(this.camera, this.scene, this.renderer.domElement);

    this.clock = new Clock();

    const loadingManager = new LoadingManager();
    this.assetLoader = new AssetLoader(loadingManager, this.scene);

    this.ocean = new Ocean();
    this.sky = new SkyDome();

    window.addEventListener('resize', this.onResize);
  }

  public async start(): Promise<void> {
    await this.loadEnvironment();
    await this.restorePlayerState();

    this.renderer.setAnimationLoop(this.update);
  }

  public dispose(): void {
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
    this.controller.dispose();
    this.interactionManager.dispose();
    window.removeEventListener('resize', this.onResize);

    this.pointerLockHandlers.forEach(({ onLock, onUnlock }) => {
      this.controller.removeEventListener('lock', onLock);
      this.controller.removeEventListener('unlock', onUnlock);
    });
    this.pointerLockHandlers = [];
  }

  public requestPointerLock(): void {
    this.controller.lockPointer();
  }

  public onPointerLockChange(onLock: () => void, onUnlock: () => void): void {
    const lockHandler = () => onLock();
    const unlockHandler = () => onUnlock();

    this.pointerLockHandlers.push({ onLock: lockHandler, onUnlock: unlockHandler });
    this.controller.addEventListener('lock', lockHandler);
    this.controller.addEventListener('unlock', unlockHandler);
  }

  private loadEnvironment = async () => {
    this.scene.add(this.ocean.mesh);
    this.scene.add(this.sky.mesh);

    this.addLighting();

    await this.assetLoader.loadIslandChunks([
      { path: '/models/island_chunk_01.glb', position: new Vector3(0, 0, 0) },
      { path: '/models/island_chunk_02.glb', position: new Vector3(50, 0, -25) },
      { path: '/models/island_chunk_03.glb', position: new Vector3(-45, 0, -10) }
    ]);

    this.interactionManager.registerInteractableGroup('default', this.assetLoader.getLoadedMeshes());
  };

  private restorePlayerState = async () => {
    const state = await this.saveSystem.loadPlayerState();
    if (!state) {
      return;
    }

    this.camera.position.copy(state.position);
    this.controller.setYawPitch(state.rotation.yaw, state.rotation.pitch);
  };

  private addLighting(): void {
    const hemiLight = new HemisphereLight(0xbdd8ff, 0x1a3b2a, 0.6);
    this.scene.add(hemiLight);

    const sunLight = new DirectionalLight(0xffffff, 1.1);
    sunLight.position.set(10, 30, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 200;
    this.scene.add(sunLight);
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private update = () => {
    const delta = this.clock.getDelta();

    this.controller.update(delta);
    this.interactionManager.update();

    this.ocean.update(delta);
    this.sky.updateSunPosition(35);

    this.renderer.render(this.scene, this.camera);

    this.saveSystem.queueSave(this.capturePlayerState());
  };

  private capturePlayerState(): PlayerState {
    return {
      position: this.camera.position.clone(),
      rotation: this.controller.getYawPitch()
    };
  }
}
