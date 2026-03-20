import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import './style.css';

/** Instantiate the Phaser game – this is the application entry-point. */
const game = new Phaser.Game(gameConfig);

// Expose the game instance in dev mode for debugging
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>)['__PHASER_GAME__'] = game;
}
