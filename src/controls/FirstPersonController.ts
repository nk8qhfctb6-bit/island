import { Camera, EventDispatcher, Vector3 } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

type MovementState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
};

const MOVE_SPEED = 8;
const GRAVITY = 30;
const JUMP_VELOCITY = 8;

type PointerLockEvents = {
  lock: { target?: unknown };
  unlock: { target?: unknown };
};

export default class FirstPersonController extends EventDispatcher<PointerLockEvents> {
  private readonly controls: PointerLockControls;
  private readonly velocity = new Vector3();
  private readonly direction = new Vector3();
  private readonly movement: MovementState = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };
  private canJump = false;
  private yaw = 0;
  private pitch = 0;

  constructor(camera: Camera, domElement: HTMLElement) {
    super();

    this.controls = new PointerLockControls(camera, domElement);
    domElement.addEventListener('click', () => this.controls.lock());

    this.controls.addEventListener('lock', () => this.dispatchEvent({ type: 'lock' }));
    this.controls.addEventListener('unlock', () => this.dispatchEvent({ type: 'unlock' }));

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
  }

  public update(delta: number): void {
    if (!this.controls.isLocked) {
      return;
    }

    this.velocity.x -= this.velocity.x * 10 * delta;
    this.velocity.z -= this.velocity.z * 10 * delta;

    this.direction.z = Number(this.movement.forward) - Number(this.movement.backward);
    this.direction.x = Number(this.movement.right) - Number(this.movement.left);
    this.direction.normalize();

    if (this.movement.forward || this.movement.backward) {
      this.velocity.z -= this.direction.z * MOVE_SPEED;
    }
    if (this.movement.left || this.movement.right) {
      this.velocity.x -= this.direction.x * MOVE_SPEED;
    }

    this.velocity.y -= GRAVITY * delta;

    this.controls.moveRight(-this.velocity.x * delta);
    this.controls.moveForward(-this.velocity.z * delta);

    const object = this.controls.getObject();
    object.position.y += this.velocity.y * delta;

    if (object.position.y < 1.7) {
      this.velocity.y = 0;
      object.position.y = 1.7;
      this.canJump = true;
    }

    this.yaw = object.rotation.y;
    this.pitch = object.rotation.x;
  }

  public getYawPitch() {
    return { yaw: this.yaw, pitch: this.pitch };
  }

  public setYawPitch(yaw: number, pitch: number) {
    const object = this.controls.getObject();
    object.rotation.set(pitch, yaw, 0, 'YXZ');
    this.yaw = yaw;
    this.pitch = pitch;
  }

  public lockPointer(): void {
    this.controls.lock();
  }

  public unlockPointer(): void {
    this.controls.unlock();
  }

  public dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    this.controls.dispose();
  }

  private onKeyDown = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.movement.forward = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.movement.left = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.movement.backward = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.movement.right = true;
        break;
      case 'Space':
        if (this.canJump) {
          this.velocity.y += JUMP_VELOCITY;
          this.canJump = false;
        }
        break;
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.movement.forward = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.movement.left = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.movement.backward = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.movement.right = false;
        break;
    }
  };
}
