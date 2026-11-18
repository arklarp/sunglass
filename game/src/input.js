// Input for a keyboard-and-mouse game: WASD to sail, the mouse to aim the lens, the button to
// sinter glass, 1-3 for the lens colour, plus the menu keys.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: 640, y: 400 };
    this.firing = false;
    this.pressed = new Set();      // keys that went down this frame
    this.clicked = false;
    this.released = false;
    this.anyKey = false;

    const map = (code) => {
      if (code === 'KeyW' || code === 'ArrowUp') return 'up';
      if (code === 'KeyS' || code === 'ArrowDown') return 'down';
      if (code === 'KeyA' || code === 'ArrowLeft') return 'left';
      if (code === 'KeyD' || code === 'ArrowRight') return 'right';
      if (code === 'Digit1') return 'lens1';
      if (code === 'Digit2') return 'lens2';
      if (code === 'Digit3') return 'lens3';
      if (code === 'KeyR') return 'restart';
      if (code === 'KeyM') return 'mute';
      if (code === 'KeyP' || code === 'Escape') return 'pause';
      if (code === 'Space' || code === 'Enter') return 'go';
      return null;
    };

    window.addEventListener('keydown', (event) => {
      const name = map(event.code);
      this.anyKey = true;
      if (!name) return;
      event.preventDefault();
      if (!this.keys.has(name)) this.pressed.add(name);
      this.keys.add(name);
    });
    window.addEventListener('keyup', (event) => {
      const name = map(event.code);
      if (name) this.keys.delete(name);
    });
    canvas.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 1280;
      this.mouse.y = ((event.clientY - rect.top) / rect.height) * 800;
    });
    canvas.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.anyKey = true;
      if (event.button === 2) {
        this.pulsePressed = true;
        return;
      }
      this.firing = true;
      this.clicked = true;
    });
    window.addEventListener('pointerup', () => {
      if (this.firing) this.released = true;
      this.firing = false;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.firing = false;
    });
  }

  down(name) {
    return this.keys.has(name);
  }

  hit(name) {
    return this.pressed.has(name);
  }

  // The arrow/WASD vector, normalised so diagonals are not faster.
  axis() {
    let x = 0;
    let y = 0;
    if (this.down('left')) x -= 1;
    if (this.down('right')) x += 1;
    if (this.down('up')) y -= 1;
    if (this.down('down')) y += 1;
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
  }

  endFrame() {
    this.pressed.clear();
    this.clicked = false;
    this.released = false;
    this.pulsePressed = false;
    this.anyKey = false;
  }
}