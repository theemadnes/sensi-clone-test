import { Game } from './Game.js';

window.onload = () => {
    const canvas = document.getElementById('gameCanvas');
    
    // Set internal resolution based on a standard aspect ratio
    // We let CSS handle the visual scaling but we need to set the canvas pixel size
    const resizeCanvas = () => {
        const container = document.getElementById('game-container');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial call
    
    const game = new Game(canvas);
    game.start();
};