import { BlurRevealInput } from '../../../dist/blur-reveal-input.esm.js';

/**
 * <blur-reveal-password> Web Component
 *
 * Attributes:
 *   placeholder    - Input placeholder text
 *   blur-intensity - Blur strength in px (default: 4)
 *   reveal-radius  - Reveal window size in px (default: 30)
 *   fade-delay     - Delay before fade in ms (default: 500)
 *   name           - Form field name
 *
 * The component's value can be read/set via the .value property.
 */
class BlurRevealPassword extends HTMLElement {
  static get observedAttributes() {
    return ['placeholder', 'blur-intensity', 'reveal-radius', 'fade-delay', 'name', 'disabled'];
  }

  constructor() {
    super();
    this._instance = null;
    this._input = null;
  }

  connectedCallback() {
    // Create input element
    this._input = document.createElement('input');
    this._input.type = 'password';
    this._input.style.cssText = `
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      border: 2px solid #e1e5eb;
      border-radius: 8px;
      margin-top: 0.5rem;
      box-sizing: border-box;
    `;

    // Apply attributes
    if (this.getAttribute('placeholder')) {
      this._input.placeholder = this.getAttribute('placeholder');
    }
    if (this.getAttribute('name')) {
      this._input.name = this.getAttribute('name');
    }
    if (this.hasAttribute('disabled')) {
      this._input.disabled = true;
    }

    this.appendChild(this._input);
    this.style.display = 'block';

    // Build config from attributes
    const options = {};
    const intensity = this.getAttribute('blur-intensity');
    if (intensity) options.blurIntensity = parseFloat(intensity);
    const radius = this.getAttribute('reveal-radius');
    if (radius) options.revealRadius = parseFloat(radius);
    const delay = this.getAttribute('fade-delay');
    if (delay) options.fadeDelay = parseFloat(delay);

    // Initialize blur reveal
    this._instance = new BlurRevealInput(this._input, options);
  }

  disconnectedCallback() {
    this._instance?.destroy();
    this._instance = null;
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (!this._input) return;

    switch (name) {
      case 'placeholder':
        this._input.placeholder = newValue || '';
        break;
      case 'name':
        this._input.name = newValue || '';
        break;
      case 'disabled':
        this._input.disabled = this.hasAttribute('disabled');
        break;
      case 'blur-intensity':
      case 'reveal-radius':
      case 'fade-delay':
        // Update config at runtime
        if (this._instance) {
          const config = {};
          if (name === 'blur-intensity') config.blurIntensity = parseFloat(newValue);
          if (name === 'reveal-radius') config.revealRadius = parseFloat(newValue);
          if (name === 'fade-delay') config.fadeDelay = parseFloat(newValue);
          this._instance.updateConfig(config);
        }
        break;
    }
  }

  get value() {
    return this._input?.value || '';
  }

  set value(val) {
    if (this._input) this._input.value = val;
  }
}

customElements.define('blur-reveal-password', BlurRevealPassword);
