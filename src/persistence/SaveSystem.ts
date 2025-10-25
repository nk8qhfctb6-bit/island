import localForage from 'localforage';
import { Vector3 } from 'three';

export type PlayerState = {
  position: Vector3;
  rotation: {
    yaw: number;
    pitch: number;
  };
};

const PLAYER_STATE_KEY = 'playerState';
const SAVE_DEBOUNCE_MS = 250;

export default class SaveSystem {
  private pendingSave: number | null = null;

  public async initialize(): Promise<void> {
    localForage.config({
      name: 'tropical-lagoon',
      storeName: 'game-state',
      description: 'Persistent offline storage for Tropical Lagoon'
    });
  }

  public async loadPlayerState(): Promise<PlayerState | null> {
    const raw = await localForage.getItem<{
      position: { x: number; y: number; z: number };
      rotation: { yaw: number; pitch: number };
    }>(PLAYER_STATE_KEY);

    if (!raw) {
      return null;
    }

    return {
      position: new Vector3(raw.position.x, raw.position.y, raw.position.z),
      rotation: raw.rotation
    };
  }

  public queueSave(state: PlayerState): void {
    if (this.pendingSave !== null) {
      window.clearTimeout(this.pendingSave);
    }

    const payload = {
      position: { x: state.position.x, y: state.position.y, z: state.position.z },
      rotation: state.rotation
    };

    this.pendingSave = window.setTimeout(() => {
      localForage.setItem(PLAYER_STATE_KEY, payload).catch((error) => {
        console.error('Failed to persist player state', error);
      });
      this.pendingSave = null;
    }, SAVE_DEBOUNCE_MS);
  }
}
