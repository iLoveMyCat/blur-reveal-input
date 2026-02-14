<script lang="ts">
  import { onMount } from 'svelte';
  import { BlurRevealInput } from 'blur-reveal-input';

  let inputEl: HTMLInputElement;

  onMount(() => {
    const blur = new BlurRevealInput(inputEl);
    return () => blur.destroy();
  });
</script>

<div class="container">
  <h1>Svelte Example</h1>
  <p>Using <code>bind:this</code> + <code>onMount</code> with cleanup return.</p>

  <label for="pw">Password</label>
  <input
    bind:this={inputEl}
    id="pw"
    type="password"
    placeholder="Type something, then hover to reveal..."
  />

  <div class="info">
    <strong>How it works:</strong> Bind the input element with <code>bind:this</code>,
    create the <code>BlurRevealInput</code> instance in <code>onMount</code>, and return
    a cleanup function that calls <code>destroy()</code>.
  </div>
</div>

<style>
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
</style>
