export class Pitch {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.margin = 50;
        
        // Playing area bounds
        this.bounds = {
            left: this.margin,
            right: this.width - this.margin,
            top: this.margin,
            bottom: this.height - this.margin
        };
        
        // Goals (top and bottom)
        this.goalWidth = 140;
        this.goalDepth = 40;
        
        this.topGoal = {
            left: this.width / 2 - this.goalWidth / 2,
            right: this.width / 2 + this.goalWidth / 2,
            top: this.bounds.top - this.goalDepth,
            bottom: this.bounds.top
        };
        
        this.bottomGoal = {
            left: this.width / 2 - this.goalWidth / 2,
            right: this.width / 2 + this.goalWidth / 2,
            top: this.bounds.bottom,
            bottom: this.bounds.bottom + this.goalDepth
        };
    }
}
