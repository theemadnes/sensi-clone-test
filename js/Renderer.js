export class Renderer {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
    }

    render(pitch, team1, team2, ball) {
        this.drawPitch(pitch);
        
        // Draw players
        team1.players.forEach(p => this.drawPlayer(p));
        team2.players.forEach(p => this.drawPlayer(p));
        
        this.drawBall(ball);
    }

    drawPitch(pitch) {
        // Grass base
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Stripes
        this.ctx.fillStyle = '#45a049';
        const stripeHeight = 50;
        for (let y = pitch.bounds.top; y < pitch.bounds.bottom; y += stripeHeight * 2) {
            this.ctx.fillRect(pitch.bounds.left, y, pitch.bounds.right - pitch.bounds.left, stripeHeight);
        }

        // Pitch Lines Setup
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        
        // Outer boundary
        this.ctx.beginPath();
        this.ctx.rect(pitch.bounds.left, pitch.bounds.top, pitch.bounds.right - pitch.bounds.left, pitch.bounds.bottom - pitch.bounds.top);
        this.ctx.stroke();
        
        // Halfway line
        this.ctx.beginPath();
        this.ctx.moveTo(pitch.bounds.left, this.height / 2);
        this.ctx.lineTo(pitch.bounds.right, this.height / 2);
        this.ctx.stroke();
        
        // Center circle
        this.ctx.beginPath();
        this.ctx.arc(this.width / 2, this.height / 2, 50, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Center dot
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.width / 2 - 2, this.height / 2 - 2, 4, 4);

        // Top Penalty Area
        this.ctx.beginPath();
        this.ctx.rect(this.width / 2 - 100, pitch.bounds.top, 200, 100);
        this.ctx.stroke();

        // Top Goal Area
        this.ctx.beginPath();
        this.ctx.rect(this.width / 2 - 50, pitch.bounds.top, 100, 30);
        this.ctx.stroke();

        // Top Penalty Arc
        this.ctx.beginPath();
        this.ctx.arc(this.width / 2, pitch.bounds.top + 80, 40, 0.2 * Math.PI, 0.8 * Math.PI);
        this.ctx.stroke();

        // Bottom Penalty Area
        this.ctx.beginPath();
        this.ctx.rect(this.width / 2 - 100, pitch.bounds.bottom - 100, 200, 100);
        this.ctx.stroke();

        // Bottom Goal Area
        this.ctx.beginPath();
        this.ctx.rect(this.width / 2 - 50, pitch.bounds.bottom - 30, 100, 30);
        this.ctx.stroke();

        // Bottom Penalty Arc
        this.ctx.beginPath();
        this.ctx.arc(this.width / 2, pitch.bounds.bottom - 80, 40, 1.2 * Math.PI, 1.8 * Math.PI);
        this.ctx.stroke();

        // Goals
        this.ctx.fillStyle = '#ccc';
        // Top Goal net
        this.ctx.fillRect(pitch.topGoal.left, pitch.topGoal.top, pitch.goalWidth, pitch.goalDepth);
        // Bottom Goal net
        this.ctx.fillRect(pitch.bottomGoal.left, pitch.bottomGoal.top, pitch.goalWidth, pitch.goalDepth);
        
        // Goal posts
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(pitch.topGoal.left, pitch.bounds.top, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(pitch.topGoal.right, pitch.bounds.top, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(pitch.bottomGoal.left, pitch.bounds.bottom, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(pitch.bottomGoal.right, pitch.bounds.bottom, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPlayer(player) {
        const pSize = 2; // Pixel size
        const px = Math.floor(player.x);
        const py = Math.floor(player.y);

        this.ctx.save();
        this.ctx.translate(px, py);
        
        if (player.isTackling) {
            // Rotate player for sliding look
            const angle = Math.atan2(player.vy, player.vx);
            this.ctx.rotate(angle);
        }

        // Highlight indicator
        if (player.isHighlighted) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        if (player.isTackling) {
            this.ctx.fillRect(-8, 4, 16, 4);
        } else {
            this.ctx.fillRect(-4, 6, 8, 4);
        }

        // Shirt / Torso (4x3 blocks)
        this.ctx.fillStyle = player.color;
        if (player.isTackling) {
            this.ctx.fillRect(-8, -2, 12, 4);
        } else {
            this.ctx.fillRect(-6, -4, 12, 6);
        }
        
        // Skin / Neck area (small 2x2 block)
        this.ctx.fillStyle = '#f1c27d'; // Skin tone
        if (player.isTackling) {
            this.ctx.fillRect(4, -2, 4, 4);
        } else {
            this.ctx.fillRect(-2, -6, 4, 4);
        }
        
        // Hair (4x2 block)
        this.ctx.fillStyle = '#4e342e'; // Dark hair
        if (player.isTackling) {
            this.ctx.fillRect(8, -2, 4, 4);
        } else {
            this.ctx.fillRect(-4, -8, 8, 4);
        }

        // Shorts (White)
        this.ctx.fillStyle = '#fff';
        if (player.isTackling) {
            this.ctx.fillRect(-12, -2, 4, 4);
        } else {
            this.ctx.fillRect(-5, 2, 10, 4);
        }

        // Legs & Animation
        if (!player.isTackling) {
            this.ctx.fillStyle = '#f1c27d'; // Skin tone legs
            let frameOffset = (player.animFrame === 1) ? 2 : (player.animFrame === 3) ? -2 : 0;
            
            // Left Leg
            this.ctx.fillRect(-4, 6, 3, 4 + frameOffset);
            // Right Leg
            this.ctx.fillRect(1, 6, 3, 4 - frameOffset);

            // Boots (Black)
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(-4, 10 + frameOffset, 3, 2);
            this.ctx.fillRect(1, 10 - frameOffset, 3, 2);
        } else {
            // Sliding legs (stretched out)
            this.ctx.fillStyle = '#f1c27d';
            this.ctx.fillRect(-16, -2, 4, 3);
            this.ctx.fillRect(-14, 0, 4, 3);
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(-18, -2, 2, 3);
            this.ctx.fillRect(-16, 0, 2, 3);
        }

        this.ctx.restore();
    }

    drawBall(ball) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.ctx.beginPath();
        this.ctx.arc(ball.x + 2, ball.y + 2, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Ball body
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#000';
        this.ctx.stroke();
        
        // Simple pixel pattern
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(ball.x - 1, ball.y - 1, 2, 2);
    }
}