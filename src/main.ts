import Game from './game/Game';
import SaveSystem from './persistence/SaveSystem';

async function bootstrap() {
  const container = document.getElementById('app');
  const overlay = document.getElementById('overlay');
  const startButton = document.getElementById('start-button');

  if (!container || !overlay || !startButton) {
    throw new Error('Missing required DOM elements');
  }

  const saveSystem = new SaveSystem();
  await saveSystem.initialize();

  const game = new Game(container, saveSystem);

  startButton.addEventListener('click', async () => {
    overlay.classList.remove('visible');
    await game.start();
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
