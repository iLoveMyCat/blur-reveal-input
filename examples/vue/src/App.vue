<template>
  <div class="container">
    <h1>Vue Example</h1>
    <p>Using a <code>useBlurReveal</code> composable.</p>

    <label for="pw">Password</label>
    <input
      ref="inputRef"
      id="pw"
      type="password"
      placeholder="Type something, then hover to reveal..."
    />

    <div class="info">
      <strong>How it works:</strong> The <code>useBlurReveal()</code> composable returns a
      template ref. Bind it to any <code>&lt;input type="password"&gt;</code> and the blur
      effect is applied on mount, cleaned up on unmount.
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBlurReveal } from './useBlurReveal';

const { inputRef } = useBlurReveal();
</script>

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
