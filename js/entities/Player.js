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
        const { ball, pitch } = gameState;

        if (this.role === 'GK') {
            this.handleGoalkeeperAI(ball, pitch);
            return;
        }

        // Basic Field Player AI
        const distToBall = Math.sqrt((this.x - ball.x) ** 2 + (this.y - ball.y) ** 2);
        const distToBase = Math.sqrt((this.x - this.baseX) ** 2 + (this.y - this.baseY) ** 2);

        // If ball is close, chase it
        if (distToBall < 180) {
            let dx = ball.x - this.x;
            let dy = ball.y - this.y;
            let len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
                this.vx += (dx / len) * this.acceleration * 0.6;
                this.vy += (dy / len) * this.acceleration * 0.6;
                this.facing = { x: dx / len, y: dy / len };
            }
        } else if (distToBase > 20) {
            // Otherwise, return to base position
            let dx = this.baseX - this.x;
            let dy = this.baseY - this.y;
            let len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
                this.vx += (dx / len) * this.acceleration * 0.4;
                this.vy += (dy / len) * this.acceleration * 0.4;
                this.facing = { x: dx / len, y: dy / len };
            }
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
