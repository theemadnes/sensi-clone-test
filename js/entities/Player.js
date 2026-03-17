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
    }

    update(inputManager, isHumanControlled) {
        if (this.actionCooldown > 0) this.actionCooldown--;

        if (isHumanControlled) {
            // Player movement controlled by input
            const dx = inputManager.x;
            const dy = inputManager.y;
            
            if (dx !== 0 || dy !== 0) {
                // Accelerate
                this.vx += dx * this.acceleration;
                this.vy += dy * this.acceleration;
                
                // Update facing
                this.facing = { x: dx, y: dy };
            }
        } else {
            // Basic AI: idle or simple follow (to be enhanced)
        }
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Cap speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }

        // Apply movement
        this.x += this.vx;
        this.y += this.vy;
    }
}