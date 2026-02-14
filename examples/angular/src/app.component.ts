import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { BlurRevealInput } from 'blur-reveal-input';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div class="container">
      <h1>Angular Example</h1>
      <p>Using <code>ViewChild</code> + <code>AfterViewInit</code> / <code>OnDestroy</code>.</p>

      <label for="pw">Password</label>
      <input
        #passwordInput
        id="pw"
        type="password"
        placeholder="Type something, then hover to reveal..."
      />

      <div class="info">
        <strong>How it works:</strong> Use <code>&#64;ViewChild</code> to get a reference to the
        input element, create the <code>BlurRevealInput</code> instance in
        <code>ngAfterViewInit</code>, and destroy it in <code>ngOnDestroy</code>.
      </div>
    </div>
  `,
  styles: [`
    .container {
      font-family: system-ui, sans-serif;
      max-width: 500px;
      margin: 4rem auto;
      padding: 0 1rem;
    }
    h1 { font-size: 1.5rem; }
    input[type="password"] {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      border: 2px solid #e1e5eb;
      border-radius: 8px;
      margin-top: 0.5rem;
      box-sizing: border-box;
    }
    input:focus {
      outline: none;
      border-color: #0066cc;
    }
    .info {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #f0f7ff;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #555;
    }
  `],
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('passwordInput') inputRef!: ElementRef<HTMLInputElement>;
  private blur?: BlurRevealInput;

  ngAfterViewInit() {
    this.blur = new BlurRevealInput(this.inputRef.nativeElement);
  }

  ngOnDestroy() {
    this.blur?.destroy();
  }
}
