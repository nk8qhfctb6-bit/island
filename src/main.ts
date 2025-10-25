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

    if (hasStarted || isStarting) {
      return;
    }

    isStarting = true;
    game
      .start()
      .then(() => {
        hasStarted = true;
      })
      .catch((error) => {
        console.error('Failed to start Tropical Lagoon', error);
        overlay.classList.add('visible');
        startButton.disabled = false;
      })
      .finally(() => {
        isStarting = false;
      });
  };

  const handlePointerUnlock = () => {
    overlay.classList.add('visible');
    startButton.disabled = false;
  };

  game.onPointerLockChange(handlePointerLock, handlePointerUnlock);

  startButton.addEventListener('click', () => {
    game.requestPointerLock();
  });

  window.addEventListener('beforeunload', () => {
    game.dispose();
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
