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
        
        this.scores = { 0: 0, 1: 0 }; // Separate score management

        this.inputManager = new InputManager();
        this.renderer = new Renderer(this.ctx, this.width, this.height);
        
        this.state = 'START'; // START, PLAYING, GOAL, OUT
        
        this.lastTime = 0;
        this.dribbleDistance = 12;
        this.ballSnatchCooldown = 0;
        this.aftertouchTimer = 0;
        this.aftertouchDuration = 60; // 1 second of control
        this.isPaused = false;
        this.gameMinutes = 0;
        this.elapsedRealTime = 0;
    }

    start() {
        requestAnimationFrame((t) => {
            this.lastTime = t;
            this.loop(t);
        });
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();
        
        this.inputManager.postUpdate();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.inputManager.update();

        // Pause Toggle
        if (this.inputManager.justPressedKeys['KeyP']) {
            this.togglePause();
            return;
        }

        if (this.isPaused) return;

        if (this.ballSnatchCooldown > 0) this.ballSnatchCooldown--;

        if (this.inputManager.keys['KeyR']) {
            this.resetMatch();
            return;
        }

        if (this.state === 'START' && this.inputManager.anyInput) {
            this.state = 'PLAYING';
            document.getElementById('message-overlay').style.display = 'none';
        }

        if (this.state === 'PLAYING') {
            this.elapsedRealTime += dt;
            if (this.elapsedRealTime >= 1000) {
                this.gameMinutes += 1;
                this.elapsedRealTime -= 1000;
                
                // Update timer UI
                const timerEl = document.getElementById('timer');
                if (timerEl) {
                    timerEl.innerText = `${this.gameMinutes.toString().padStart(2, '0')}:00`;
                }

                if (this.gameMinutes >= 90) {
                    this.state = 'ENDED';
                    const msg = document.getElementById('message-overlay');
                    msg.innerText = "FULL TIME!";
                    msg.style.display = 'block';
                    return;
                }
            }
        }

        if (this.state !== 'PLAYING') {
            // If in GOAL state, let the ball update its physics so it rolls into net,
            // but keep players from interacting with it.
            if (this.state === 'GOAL') {
                this.ball.update(this.pitch);
                // Extra boundary check to keep ball inside net
                if (this.ball.y < this.pitch.topGoal.top || this.ball.y > this.pitch.bottomGoal.bottom) {
                    this.ball.vx = 0;
                    this.ball.vy = 0;
                }
            } else if (this.state === 'ENDED') {
                // Final whistle logic
                this.ball.vx = 0;
                this.ball.vy = 0;
            } else {
                // START state - ball definitely stopped
                if (this.ball) {
                    this.ball.vx = 0;
                    this.ball.vy = 0;
                    this.ball.curve = { x: 0, y: 0 };
                }
            }
            return;
        }

        const gameState = { ball: this.ball, pitch: this.pitch };
        const controlledPlayer = this.team1.players[this.team1.controlledPlayerIndex];

        // Assign chasers for both teams
        this.assignChaser(this.team1);
        this.assignChaser(this.team2);

        // Team 1 (Human & AI Teammates)
        this.team1.players.forEach((p, index) => {
            const isHuman = index === this.team1.controlledPlayerIndex;
            p.update(this.inputManager, isHuman, { ...gameState, teammates: this.team1.players, opponents: this.team2.players });
            this.handlePlayerBallCollision(p);

            // If an AI teammate has the ball, let them act
            if (!isHuman && this.ball.controlledBy === p) {
                const goalY = this.pitch.bounds.top;
                const distToGoal = Math.sqrt((p.x - this.width / 2)**2 + (p.y - goalY)**2);
                if (distToGoal < 280) {
                    this.aiShoot(p, this.width / 2, goalY);
                } else if (Math.random() < 0.015) {
                    this.aiPass(p);
                }
            }
        });

        // Team 2 (AI Opponents)
        this.team2.players.forEach(p => {
            p.update(null, false, { ...gameState, teammates: this.team2.players, opponents: this.team1.players });
            this.handlePlayerBallCollision(p);

            // Opponent action: Shoot or Pass
            if (this.ball.controlledBy === p) {
                const goalY = this.pitch.bounds.bottom;
                const distToGoal = Math.sqrt((p.x - this.width / 2)**2 + (p.y - goalY)**2);
                
                if (distToGoal < 280) {
                    this.aiShoot(p, this.width / 2, goalY);
                } else if (Math.random() < 0.02) {
                    this.aiPass(p);
                }
            }
        });

        this.ball.update(this.pitch);

        // Aftertouch - allow human to curve ball after kick
        if (this.aftertouchTimer > 0 && !this.ball.controlledBy) {
            this.aftertouchTimer--;
            const curveStrength = 0.1;
            this.ball.curve.x = this.inputManager.x * curveStrength;
            this.ball.curve.y = this.inputManager.y * curveStrength;
        } else {
            // Decay curve if not being steered
            this.ball.curve.x *= 0.9;
            this.ball.curve.y *= 0.9;
            if (Math.abs(this.ball.curve.x) < 0.001) {
                this.ball.curve.x = 0;
                this.ball.curve.y = 0;
            }
        }
        
        this.checkInputActions(controlledPlayer);
        this.checkGoal();
    }
    
    assignChaser(team) {
        let minDist = Infinity;
        let bestIndex = -1;

        team.players.forEach((p, i) => {
            p.isAIChaser = false;
            if (p.role === 'GK' || p.isTackling) return;
            
            // For Team 1, don't assign chaser to human controlled player
            if (team.id === 0 && i === team.controlledPlayerIndex) return;

            const dist = Math.sqrt((p.x - this.ball.x)**2 + (p.y - this.ball.y)**2);
            if (dist < minDist) {
                minDist = dist;
                bestIndex = i;
            }
        });

        if (bestIndex !== -1) {
            team.players[bestIndex].isAIChaser = true;
        }
    }

    aiShoot(p, tx, ty) {
        const dx = tx - p.x;
        const dy = ty - p.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        this.ball.kick((dx/len)*8, (dy/len)*8);
        p.hasBall = false;
        p.actionCooldown = 60;
    }

    aiPass(p) {
        const team = p.teamId === 0 ? this.team1 : this.team2;
        // Find a teammate ahead of us
        const direction = p.teamId === 0 ? -1 : 1;
        const targets = team.players.filter(t => t !== p && t.role !== 'GK' && (t.y - p.y) * direction > 0);
        
        if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            const dx = target.x - p.x;
            const dy = target.y - p.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            this.ball.kick((dx/len)*6, (dy/len)*6);
            p.hasBall = false;
            p.actionCooldown = 40;
            this.ballSnatchCooldown = 10;
        }
    }

    handlePlayerBallCollision(player) {
        if (this.ballSnatchCooldown > 0) return;
        if (this.ball.controlledBy === player) return; 
        
        let dx = this.ball.x - player.x;
        let dy = this.ball.y - player.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        // Increased radius and priority for winning ball during tackle
        const interactionRadius = player.isTackling ? (player.radius + 15) : (player.radius + this.ball.radius + 2);
        
        if (dist < interactionRadius && player.actionCooldown <= 0) {
            // If opponent has ball, tackle steals it
            if (this.ball.controlledBy && this.ball.controlledBy.teamId !== player.teamId) {
                this.ball.controlledBy.hasBall = false;
                this.ball.controlledBy.actionCooldown = 50; // Delay for victim
            }

            // Steal or take control of the ball
            this.ball.controlledBy = player;
            player.hasBall = true;
            this.ballSnatchCooldown = 15; // Global delay before another steal to prevent "jitter"
            
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
                
                // Set aftertouch timer for human
                this.aftertouchTimer = this.aftertouchDuration;

                this.ball.kick(kickVx, kickVy, 0, 0);
                player.hasBall = false;
                player.actionCooldown = 30; // Frames before can touch ball again
                this.ballSnatchCooldown = 5; // Slight delay so kicker doesn't immediately retake
            }
        } else {
            // If don't have ball, trigger tackle or switch player
            if (this.inputManager.actionJustPressed) {
                const isMoving = Math.abs(this.inputManager.x) > 0.1 || Math.abs(this.inputManager.y) > 0.1;
                if (isMoving) {
                    player.startTackle();
                } else {
                    this.switchPlayer();
                }
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
        this.ball.controlledBy = null; // Release ball to fly into net

        this.scores[scoringTeamId]++;
        
        document.getElementById('team1-score').innerText = this.scores[0];
        document.getElementById('team2-score').innerText = this.scores[1];
        
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
        // Re-init team positions (new Players start with 0 velocity)
        this.team1 = new Team(0, 'Home', '#ff0000', this.width, this.height, true);
        this.team2 = new Team(1, 'Away', '#0000ff', this.width, this.height, false);
        
        // Re-create the ball to be 100% sure all state is cleared
        this.ball = new Ball(this.width / 2, this.height / 2);
    }

    resetMatch() {
        this.resetPositions();
        this.scores[0] = 0;
        this.scores[1] = 0;
        this.gameMinutes = 0;
        this.elapsedRealTime = 0;
        document.getElementById('team1-score').innerText = '0';
        document.getElementById('team2-score').innerText = '0';
        document.getElementById('timer').innerText = '00:00';
        this.state = 'START';
        document.getElementById('message-overlay').innerText = "Press Any Key or Gamepad Button to Start";
        document.getElementById('message-overlay').style.display = 'block';
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const msg = document.getElementById('message-overlay');
        if (this.isPaused) {
            msg.innerText = "PAUSED";
            msg.style.display = 'block';
        } else {
            if (this.state === 'PLAYING') {
                msg.style.display = 'none';
            } else if (this.state === 'START') {
                msg.innerText = "Press Any Key or Gamepad Button to Start";
                msg.style.display = 'block';
            } else if (this.state === 'GOAL') {
                msg.innerText = "GOAL!";
                msg.style.display = 'block';
            }
        }
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
