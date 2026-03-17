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

        this.handleCollisions(pitch);
    }

    handleCollisions(pitch) {
        // 1. Goal Post Collisions (Circular)
        const posts = [
            { x: pitch.topGoal.left, y: pitch.bounds.top },
            { x: pitch.topGoal.right, y: pitch.bounds.top },
            { x: pitch.bottomGoal.left, y: pitch.bounds.bottom },
            { x: pitch.bottomGoal.right, y: pitch.bounds.bottom }
        ];

        posts.forEach(post => {
            const dx = this.x - post.x;
            const dy = this.y - post.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = this.radius + 4; // Post radius approx 4

            if (dist < minDist) {
                // Bounce off post
                const angle = Math.atan2(dy, dx);
                this.x = post.x + Math.cos(angle) * minDist;
                this.y = post.y + Math.sin(angle) * minDist;
                
                // Simple reflection
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                this.vx = Math.cos(angle) * speed * 0.7;
                this.vy = Math.sin(angle) * speed * 0.7;
            }
        });

        // 2. Pitch Boundary Collisions
        if (this.x - this.radius < pitch.bounds.left) {
            this.x = pitch.bounds.left + this.radius;
            this.vx *= -0.8;
        } else if (this.x + this.radius > pitch.bounds.right) {
            this.x = pitch.bounds.right - this.radius;
            this.vx *= -0.8;
        }

        // Top/Bottom Goal Logic
        const inTopGoalX = this.x > pitch.topGoal.left && this.x < pitch.topGoal.right;
        const inBottomGoalX = this.x > pitch.bottomGoal.left && this.x < pitch.bottomGoal.right;

        if (inTopGoalX) {
            // Check back/sides of top goal net
            if (this.y - this.radius < pitch.topGoal.top) {
                this.y = pitch.topGoal.top + this.radius;
                this.vy *= -0.3; // Net absorbs energy
            }
        } else {
            if (this.y - this.radius < pitch.bounds.top) {
                this.y = pitch.bounds.top + this.radius;
                this.vy *= -0.8;
            }
        }

        if (inBottomGoalX) {
            // Check back/sides of bottom goal net
            if (this.y + this.radius > pitch.bottomGoal.bottom) {
                this.y = pitch.bottomGoal.bottom - this.radius;
                this.vy *= -0.3;
            }
        } else {
            if (this.y + this.radius > pitch.bounds.bottom) {
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