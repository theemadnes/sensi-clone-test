import { Pitch } from './entities/Pitch.js';
import { Ball } from './entities/Ball.js';
import { Team } from './entities/Team.js';
import { InputManager } from './InputManager.js';
import { Renderer } from './Renderer.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Logical resolution
        this.width = 800;
        this.height = 1200; // Sensible soccer is often played top down
        
        this.pitch = new Pitch(this.width, this.height);
        this.ball = new Ball(this.width / 2, this.height / 2);
        
        this.team1 = new Team(0, 'Home', '#ff0000', this.width, this.height, true);
        this.team2 = new Team(1, 'Away', '#0000ff', this.width, this.height, false);
        
        this.inputManager = new InputManager();
        this.renderer = new Renderer(this.ctx, this.width, this.height);
        
        this.state = 'START'; // START, PLAYING, GOAL, OUT
        
        this.lastTime = 0;
        this.dribbleDistance = 12;
    }

    start() {
        requestAnimationFrame((t) => {
            this.lastTime = t;
            this.loop(t);
        });
    }

    loop(timestamp) {
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.inputManager.update();

        if (this.state === 'START' && this.inputManager.anyInput) {
            this.state = 'PLAYING';
            document.getElementById('message-overlay').style.display = 'none';
        }

        if (this.state !== 'PLAYING') return;

        // Player to update based on input
        let controlledPlayer = this.team1.players[this.team1.controlledPlayerIndex];
        
        // Let's implement auto-switching later, for now just update
        this.team1.players.forEach((p, index) => {
            p.update(this.inputManager, index === this.team1.controlledPlayerIndex);
            this.handlePlayerBallCollision(p);
        });

        this.team2.players.forEach(p => {
            // Very basic AI for team 2: follow ball slowly if nearby
            let dx = this.ball.x - p.x;
            let dy = this.ball.y - p.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 150) {
                p.vx += (dx / dist) * 0.1;
                p.vy += (dy / dist) * 0.1;
                p.facing = { x: dx / dist, y: dy / dist };
            }
            
            p.update({ x: 0, y: 0, anyInput: false }, false); // Update with no input to apply friction
            this.handlePlayerBallCollision(p);
        });

        this.ball.update(this.pitch);
        
        this.checkInputActions(controlledPlayer);
        this.checkGoal();
    }
    
    handlePlayerBallCollision(player) {
        // If ball is already controlled by another player, maybe allow tackling? 
        // For now, simpler dribbling:
        
        if (this.ball.controlledBy === player) return; // Handled in checkInputActions
        
        let dx = this.ball.x - player.x;
        let dy = this.ball.y - player.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < player.radius + this.ball.radius + 4 && player.actionCooldown <= 0) {
            // Steal or take control of the ball
            this.ball.controlledBy = player;
            player.hasBall = true;
            
            // Switch control to this player if on team 1
            if (player.teamId === 0) {
                this.team1.players.forEach(p => p.isHighlighted = false);
                this.team1.controlledPlayerIndex = this.team1.players.indexOf(player);
                player.isHighlighted = true;
            }
        }
    }
    
    checkInputActions(player) {
        if (!player) return;
        
        if (this.ball.controlledBy === player) {
            // Keep ball at feet
            let angle = Math.atan2(player.vy, player.vx);
            if (player.vx === 0 && player.vy === 0) {
                 angle = Math.atan2(player.facing.y, player.facing.x);
            }
            
            this.ball.x = player.x + Math.cos(angle) * this.dribbleDistance;
            this.ball.y = player.y + Math.sin(angle) * this.dribbleDistance;
            this.ball.vx = player.vx;
            this.ball.vy = player.vy;

            // Kick
            if (this.inputManager.actionJustPressed) {
                // Shoot or pass
                let kickSpeed = 8;
                let kickVx = Math.cos(angle) * kickSpeed;
                let kickVy = Math.sin(angle) * kickSpeed;
                
                // Aftertouch calculation (based on input immediately after kick, simple implementation for now)
                let curveX = this.inputManager.x * 0.2;
                let curveY = this.inputManager.y * 0.2;

                this.ball.kick(kickVx, kickVy, curveX, curveY);
                player.hasBall = false;
                player.actionCooldown = 30; // Frames before can touch ball again
            }
        } else {
            // If don't have ball, maybe switch player or tackle (slide tackle not implemented yet)
            if (this.inputManager.actionJustPressed) {
                this.switchPlayer();
            }
        }
    }
    
    switchPlayer() {
        // Find closest player to ball
        let closestIndex = 0;
        let minDist = Infinity;
        
        this.team1.players.forEach((p, i) => {
            p.isHighlighted = false;
            let dist = Math.sqrt((p.x - this.ball.x)**2 + (p.y - this.ball.y)**2);
            if (dist < minDist) {
                minDist = dist;
                closestIndex = i;
            }
        });
        
        this.team1.controlledPlayerIndex = closestIndex;
        this.team1.players[closestIndex].isHighlighted = true;
    }

    checkGoal() {
        // Check if ball crossed goal line
        if (this.ball.y < this.pitch.bounds.top) {
            if (this.ball.x > this.pitch.topGoal.left && this.ball.x < this.pitch.topGoal.right) {
                this.scoreGoal(1); // Team 2 scores
            }
        } else if (this.ball.y > this.pitch.bounds.bottom) {
            if (this.ball.x > this.pitch.bottomGoal.left && this.ball.x < this.pitch.bottomGoal.right) {
                this.scoreGoal(0); // Team 1 scores
            }
        }
    }
    
    scoreGoal(scoringTeamId) {
        if (this.state === 'GOAL') return;
        
        this.state = 'GOAL';
        if (scoringTeamId === 0) this.team1.score++;
        else this.team2.score++;
        
        document.getElementById('team1-score').innerText = this.team1.score;
        document.getElementById('team2-score').innerText = this.team2.score;
        
        let msg = document.getElementById('message-overlay');
        msg.innerText = "GOAL!";
        msg.style.display = 'block';
        
        setTimeout(() => {
            this.resetPositions();
            this.state = 'PLAYING';
            msg.style.display = 'none';
        }, 2000);
    }
    
    resetPositions() {
        // Re-init team positions
        this.team1 = new Team(0, 'Home', '#ff0000', this.width, this.height, true);
        this.team2 = new Team(1, 'Away', '#0000ff', this.width, this.height, false);
        this.ball.x = this.width / 2;
        this.ball.y = this.height / 2;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.controlledBy = null;
    }

    draw() {
        // Handle scaling aspect ratio
        const scaleX = this.canvas.width / this.width;
        const scaleY = this.canvas.height / this.height;
        const scale = Math.min(scaleX, scaleY);
        
        const offsetX = (this.canvas.width - this.width * scale) / 2;
        const offsetY = (this.canvas.height - this.height * scale) / 2;

        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(offsetX, offsetY);
        this.ctx.scale(scale, scale);

        this.renderer.render(this.pitch, this.team1, this.team2, this.ball);

        this.ctx.restore();
    }
}
