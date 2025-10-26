import Game from './game/Game';
import SaveSystem from './persistence/SaveSystem';

async function bootstrap() {
  const container = document.getElementById('app');
  const overlay = document.getElementById('overlay');
  const startButton = document.getElementById('start-button');

  if (!container || !overlay || !(startButton instanceof HTMLButtonElement)) {
    throw new Error('Missing required DOM elements');
  }

  const saveSystem = new SaveSystem();
  await saveSystem.initialize();

  const game = new Game(container, saveSystem);
  let hasStarted = false;
  let isStarting = false;

  const handlePointerLock = () => {
    overlay.classList.remove('visible');
    startButton.disabled = true;
  };

  const handlePointerUnlock = () => {
    if (!hasStarted) {
      return;
    }

    overlay.classList.add('visible');
    startButton.disabled = false;
  };

  const handlePointerLockError = () => {
    if (!hasStarted) {
      return;
    }

    overlay.classList.add('visible');
    startButton.disabled = false;
  };

  const beginGame = async () => {
    isStarting = true;
    startButton.disabled = true;

    try {
      await game.start();
      hasStarted = true;
      overlay.classList.remove('visible');
    } catch (error) {
      console.error('Failed to start Tropical Lagoon', error);
      overlay.classList.add('visible');
      startButton.disabled = false;
      throw error;
    } finally {
      isStarting = false;
    }
  };

  game.onPointerLockChange(handlePointerLock, handlePointerUnlock);
  document.addEventListener('pointerlockerror', handlePointerLockError);

  startButton.addEventListener('click', async () => {
    if (isStarting) {
      return;
    }

    if (!hasStarted) {
      try {
        await beginGame();
      } catch {
        return;
      }
    }

    game.requestPointerLock();
  });

  window.addEventListener('beforeunload', () => {
    game.dispose();
    document.removeEventListener('pointerlockerror', handlePointerLockError);
  });

  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      console.info('Service worker registered');
    } catch (error) {
      console.warn('Failed to register service worker', error);
    }
  }
}

bootstrap().catch((error) => {
  console.error('Failed to initialize Tropical Lagoon', error);
});
