import { Camera, Intersection, Object3D, Raycaster, Scene, Vector2 } from 'three';

type InteractionHandler = (hit: Intersection) => void;

export default class InteractionManager {
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly interactables = new Map<string, Object3D[]>();
  private readonly handlers: InteractionHandler[] = [];
  private hovered: Intersection | null = null;

  constructor(
    private readonly camera: Camera,
    private readonly scene: Scene,
    private readonly domElement: HTMLElement
  ) {
    this.domElement.addEventListener('pointermove', this.onPointerMove);
    this.domElement.addEventListener('click', this.onClick);
  }

  public registerInteractableGroup(key: string, objects: Object3D[]): void {
    this.interactables.set(key, objects);
  }

  public onInteract(handler: InteractionHandler): void {
    this.handlers.push(handler);
  }

  public update(): void {
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const interactableObjects = Array.from(this.interactables.values()).flat();
    const hits = interactableObjects.length
      ? this.raycaster.intersectObjects(interactableObjects, true)
      : this.raycaster.intersectObjects(this.scene.children, true);

    this.hovered = hits.length > 0 ? hits[0] : null;
  }

  public dispose(): void {
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('click', this.onClick);
  }

  private onPointerMove = (event: PointerEvent) => {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  private onClick = () => {
    if (!this.hovered) {
      return;
    }

    this.handlers.forEach((handler) => handler(this.hovered as Intersection));
  };
}
