export class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.z = 0; // Height (for lob passes/shots if we add them later)
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.radius = 4;
        this.friction = 0.98; // Ground friction
        this.curve = { x: 0, y: 0 }; // Aftertouch
        
        this.controlledBy = null; // Reference to player
    }

    update(pitch) {
        // If controlled by a player, ball position is locked to player
        if (this.controlledBy) {
            return;
        }

        // Apply curve (aftertouch)
        this.vx += this.curve.x;
        this.vy += this.curve.y;

        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Boundaries check (bouncing off pitch walls if not a goal)
        // Simplistic bound checks
        if (this.x - this.radius < pitch.bounds.left) {
            this.x = pitch.bounds.left + this.radius;
            this.vx *= -0.8;
        } else if (this.x + this.radius > pitch.bounds.right) {
            this.x = pitch.bounds.right - this.radius;
            this.vx *= -0.8;
        }

        // Top/Bottom boundaries (Need to check if inside goal width)
        let isGoalBoundX = this.x > pitch.topGoal.left && this.x < pitch.topGoal.right;
        
        if (!isGoalBoundX) {
            if (this.y - this.radius < pitch.bounds.top) {
                this.y = pitch.bounds.top + this.radius;
                this.vy *= -0.8;
            } else if (this.y + this.radius > pitch.bounds.bottom) {
                this.y = pitch.bounds.bottom - this.radius;
                this.vy *= -0.8;
            }
        }
    }

    kick(vx, vy, curveX = 0, curveY = 0) {
        this.vx = vx;
        this.vy = vy;
        this.curve = { x: curveX, y: curveY };
        this.controlledBy = null;
    }
}