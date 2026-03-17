export class Player {
    constructor(id, teamId, x, y, color) {
        this.id = id;
        this.teamId = teamId; // 0 or 1
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.color = color;

        this.vx = 0;
        this.vy = 0;
        this.maxSpeed = 3;
        this.acceleration = 0.5;
        this.friction = 0.8;

        // Direction facing (in radians or vector)
        this.facing = { x: 0, y: 1 };

        this.hasBall = false;

        // For drawing shirt numbers or highlights
        this.isHighlighted = false;
        this.actionCooldown = 0;

        // AI properties
        this.baseX = x;
        this.baseY = y;
        this.role = 'FIELD'; // 'FIELD' or 'GK'

        // Animation
        this.animFrame = 0;
        this.animTimer = 0;

        // Tackle state
        this.isTackling = false;
        this.tackleTimer = 0;
        this.tackleDuration = 25;
        this.tackleSpeed = 6;
    }

    startTackle() {
        if (this.isTackling || this.actionCooldown > 0) return;
        this.isTackling = true;
        this.tackleTimer = this.tackleDuration;

        // Boost velocity in facing direction
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 0.1) {
            this.vx = (this.vx / speed) * this.tackleSpeed;
            this.vy = (this.vy / speed) * this.tackleSpeed;
        } else {
            this.vx = this.facing.x * this.tackleSpeed;
            this.vy = this.facing.y * this.tackleSpeed;
        }
    }

    update(inputManager, isHumanControlled, gameState) {
        if (this.actionCooldown > 0) this.actionCooldown--;

        if (this.isTackling) {
            this.tackleTimer--;
            if (this.tackleTimer <= 0) {
                this.isTackling = false;
                this.actionCooldown = 30; // Recovery time
            }
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.95; // Slide friction
            this.vy *= 0.95;
            this.animFrame = 2; // Locked animation frame for sliding
            return;
        }

        const prevX = this.x;
        const prevY = this.y;

        if (isHumanControlled) {
            this.handleHumanInput(inputManager);
        } else {
            this.handleAI(gameState);
        }

        this.applyPhysics();

        // Update animation
        const moved = Math.abs(this.x - prevX) > 0.1 || Math.abs(this.y - prevY) > 0.1;
        if (moved) {
            this.animTimer += Math.sqrt((this.x - prevX) ** 2 + (this.y - prevY) ** 2);
            this.animFrame = Math.floor(this.animTimer / 5) % 4;
        } else {
            this.animFrame = 0;
        }
    }

    handleHumanInput(inputManager) {
        const dx = inputManager.x;
        const dy = inputManager.y;

        if (dx !== 0 || dy !== 0) {
            this.vx += dx * this.acceleration;
            this.vy += dy * this.acceleration;
            this.facing = { x: dx, y: dy };
        }
    }

    handleAI(gameState) {
        if (!gameState) return;
        const { ball, pitch, teammates, opponents } = gameState;

        if (this.role === 'GK') {
            this.handleGoalkeeperAI(ball, pitch);
            return;
        }

        const distToBall = Math.sqrt((this.x - ball.x)**2 + (this.y - ball.y)**2);
        const distToBase = Math.sqrt((this.x - this.baseX)**2 + (this.y - this.baseY)**2);

        // 1. If I have the ball, move towards the opponent's goal or look for a pass
        if (this.hasBall) {
            this.handleBallCarrierAI(gameState);
            return;
        }

        // 2. Support/Defend Logic based on who has the ball
        if (ball.controlledBy) {
            if (ball.controlledBy.teamId === this.teamId) {
                // SUPPORT: A teammate has the ball. Make a run!
                this.handleSupportAI(ball, pitch);
                return;
            } else {
                // DEFEND: An opponent has the ball. Mark or block!
                this.handleDefensiveAI(ball, pitch);
                
                // Trigger tackle if close to opponent
                if (distToBall < 50 && distToBall > 20 && Math.random() < 0.05) {
                    this.startTackle();
                }
                return;
            }
        }

        // 3. Loose ball logic
        const isChaser = this.isAIChaser; 
        if (isChaser || distToBall < 100) {
            this.moveTo(ball.x, ball.y, 0.7);
        } else {
            // Return to formation
            if (distToBase > 20) {
                this.moveTo(this.baseX, this.baseY, 0.4);
            }
        }
    }

    handleSupportAI(ball, pitch) {
        // Find a position ahead of the ball carrier
        const attackDir = this.teamId === 0 ? -1 : 1;
        
        // Target a position that is:
        // - Ahead of the ball carrier (y-axis)
        // - Near the player's natural horizontal lane (baseX)
        // - Slightly offset towards the ball's X to be available
        const targetY = ball.y + attackDir * 150;
        const targetX = (this.baseX * 0.7) + (ball.x * 0.3);

        // Clamp target within pitch
        const clampedY = Math.max(pitch.bounds.top + 50, Math.min(pitch.bounds.bottom - 50, targetY));
        
        this.moveTo(targetX, clampedY, 0.6);
    }

    handleDefensiveAI(ball, pitch) {
        // Position self between the ball and our own goal
        const ourGoalY = this.teamId === 0 ? pitch.bounds.bottom : pitch.bounds.top;
        const ourGoalX = pitch.width / 2;

        // Target point is 30% of the way from player's base to the ball, 
        // but weighted towards staying "goal-side"
        const targetX = (this.baseX * 0.5) + (ball.x * 0.5);
        const targetY = (this.baseY * 0.5) + (ball.y * 0.5);

        // Ensure we are always "below" the ball if defending bottom goal (team 0)
        // or "above" it if defending top goal (team 1)
        const defendDir = this.teamId === 0 ? 1 : -1;
        let finalY = targetY;
        if ((ball.y - finalY) * defendDir < 0) {
            finalY = ball.y + defendDir * 40;
        }

        this.moveTo(targetX, finalY, 0.5);
    }

    handleBallCarrierAI(gameState) {
        const { pitch } = gameState;
        // Target is the center of the opponent's goal
        const targetY = this.teamId === 0 ? pitch.bounds.top : pitch.bounds.bottom;
        const targetX = pitch.width / 2;

        this.moveTo(targetX, targetY, 0.8);

        // Shooting logic is handled in Game.js for now, 
        // but we could add passing logic here later.
    }

    moveTo(tx, ty, speedMult) {
        let dx = tx - this.x;
        let dy = ty - this.y;
        let len = Math.sqrt(dx*dx + dy*dy);
        if (len > 0) {
            this.vx += (dx / len) * this.acceleration * speedMult;
            this.vy += (dy / len) * this.acceleration * speedMult;
            this.facing = { x: dx / len, y: dy / len };
        }
    }

    handleGoalkeeperAI(ball, pitch) {
        // Stay between ball and goal, but stay within goal area
        let targetX = ball.x;
        let targetY = this.baseY;

        // Clamp targetX to goal width
        const margin = 20;
        targetX = Math.max(pitch.topGoal.left + margin, Math.min(pitch.topGoal.right - margin, targetX));

        let dx = targetX - this.x;
        let dy = targetY - this.y;
        let len = Math.sqrt(dx * dx + dy * dy);

        if (len > 5) {
            this.vx += (dx / len) * this.acceleration * 0.5;
            this.vy += (dy / len) * this.acceleration * 0.5;
            this.facing = { x: dx / len, y: dy / len };
        }
    }

    applyPhysics() {
        this.vx *= this.friction;
        this.vy *= this.friction;

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }

        this.x += this.vx;
        this.y += this.vy;
    }
}
