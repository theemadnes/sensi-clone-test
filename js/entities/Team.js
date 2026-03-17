import { Player } from './Player.js';

export class Team {
    constructor(id, name, color, pitchWidth, pitchHeight, isBottomHalf) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.players = [];
        this.controlledPlayerIndex = 0; // The active player

        // Simple 4-4-2 formation
        const startY = isBottomHalf ? pitchHeight * 0.75 : pitchHeight * 0.25;
        const dir = isBottomHalf ? -1 : 1;

        // Goalkeeper
        const gk = new Player(0, id, pitchWidth / 2, isBottomHalf ? pitchHeight - 60 : 60, color);
        gk.role = 'GK';
        this.players.push(gk);
        
        // Defenders
        this.players.push(new Player(1, id, pitchWidth * 0.2, startY + dir * 100, color));
        this.players.push(new Player(2, id, pitchWidth * 0.4, startY + dir * 120, color));
        this.players.push(new Player(3, id, pitchWidth * 0.6, startY + dir * 120, color));
        this.players.push(new Player(4, id, pitchWidth * 0.8, startY + dir * 100, color));
        
        // Midfielders
        this.players.push(new Player(5, id, pitchWidth * 0.2, startY + dir * 40, color));
        this.players.push(new Player(6, id, pitchWidth * 0.4, startY + dir * 20, color));
        this.players.push(new Player(7, id, pitchWidth * 0.6, startY + dir * 20, color));
        this.players.push(new Player(8, id, pitchWidth * 0.8, startY + dir * 40, color));
        
        // Forwards
        this.players.push(new Player(9, id, pitchWidth * 0.35, startY - dir * 40, color));
        this.players.push(new Player(10, id, pitchWidth * 0.65, startY - dir * 40, color));
    }
}