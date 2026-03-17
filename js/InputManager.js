export class InputManager {
    constructor() {
        this.keys = {};
        this.actionPressed = false;
        this.actionJustPressed = false;
        
        this.x = 0; // -1 to 1
        this.y = 0; // -1 to 1

        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }

    update() {
        this.x = 0;
        this.y = 0;
        
        let actionWasPressed = this.actionPressed;
        this.actionPressed = false;

        // Keyboard
        if (this.keys['ArrowUp'] || this.keys['KeyW']) this.y -= 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) this.y += 1;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.x -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.x += 1;

        if (this.keys['Space'] || this.keys['KeyZ']) this.actionPressed = true;

        // Gamepad
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (gp) {
                // Axes
                if (Math.abs(gp.axes[0]) > 0.1) this.x += gp.axes[0];
                if (Math.abs(gp.axes[1]) > 0.1) this.y += gp.axes[1];
                
                // D-pad (buttons 12-15 usually)
                if (gp.buttons[12]?.pressed) this.y -= 1;
                if (gp.buttons[13]?.pressed) this.y += 1;
                if (gp.buttons[14]?.pressed) this.x -= 1;
                if (gp.buttons[15]?.pressed) this.x += 1;

                // Action Button (A or X usually)
                if (gp.buttons[0]?.pressed || gp.buttons[1]?.pressed) this.actionPressed = true;
            }
        }

        // Normalize
        if (this.x !== 0 && this.y !== 0) {
            const len = Math.sqrt(this.x * this.x + this.y * this.y);
            this.x /= len;
            this.y /= len;
        } else {
            // Clamp keyboard if needed
            this.x = Math.max(-1, Math.min(1, this.x));
            this.y = Math.max(-1, Math.min(1, this.y));
        }

        this.actionJustPressed = this.actionPressed && !actionWasPressed;
    }
    
    get anyInput() {
        return this.x !== 0 || this.y !== 0 || this.actionPressed;
    }
}
