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

        // Pitch Lines
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        // Outer boundary
        this.ctx.rect(pitch.bounds.left, pitch.bounds.top, pitch.bounds.right - pitch.bounds.left, pitch.bounds.bottom - pitch.bounds.top);
        
        // Halfway line
        this.ctx.moveTo(pitch.bounds.left, this.height / 2);
        this.ctx.lineTo(pitch.bounds.right, this.height / 2);
        
        // Center circle
        this.ctx.moveTo(this.width / 2 + 50, this.height / 2);
        this.ctx.arc(this.width / 2, this.height / 2, 50, 0, Math.PI * 2);
        
        // Center dot
        this.ctx.fillRect(this.width / 2 - 2, this.height / 2 - 2, 4, 4);

        // Top Penalty Area
        this.ctx.rect(this.width / 2 - 100, pitch.bounds.top, 200, 100);
        // Top Goal Area
        this.ctx.rect(this.width / 2 - 50, pitch.bounds.top, 100, 30);
        // Top Penalty Arc
        this.ctx.moveTo(this.width / 2 + 40, pitch.bounds.top + 100);
        this.ctx.arc(this.width / 2, pitch.bounds.top + 80, 40, 0.2 * Math.PI, 0.8 * Math.PI);

        // Bottom Penalty Area
        this.ctx.rect(this.width / 2 - 100, pitch.bounds.bottom - 100, 200, 100);
        // Bottom Goal Area
        this.ctx.rect(this.width / 2 - 50, pitch.bounds.bottom - 30, 100, 30);
        // Bottom Penalty Arc
        this.ctx.moveTo(this.width / 2 + 40, pitch.bounds.bottom - 100);
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
        this.ctx.arc(pitch.topGoal.right, pitch.bounds.top, 3, 0, Math.PI * 2);
        this.ctx.arc(pitch.bottomGoal.left, pitch.bounds.bottom, 3, 0, Math.PI * 2);
        this.ctx.arc(pitch.bottomGoal.right, pitch.bounds.bottom, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPlayer(player) {
        // Highlight indicator
        if (player.isHighlighted) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(player.x, player.y, player.radius + 4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Body
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Hair/Head (simple top down view)
        this.ctx.fillStyle = '#8B4513'; // Brown hair
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius * 0.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Direction indicator (nose or shoulders)
        this.ctx.strokeStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.moveTo(player.x, player.y);
        let facingLen = Math.sqrt(player.facing.x*player.facing.x + player.facing.y*player.facing.y);
        if (facingLen > 0) {
            this.ctx.lineTo(player.x + (player.facing.x / facingLen) * player.radius, 
                            player.y + (player.facing.y / facingLen) * player.radius);
            this.ctx.stroke();
        }
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