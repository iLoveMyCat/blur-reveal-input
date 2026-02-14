import { useBlurReveal } from './useBlurReveal';

export function App() {
  const passwordRef = useBlurReveal();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 500, margin: '4rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: '1.5rem' }}>React Example</h1>
      <p>Using a custom <code>useBlurReveal</code> hook.</p>

      <label htmlFor="pw">Password</label>
      <br />
      <input
        ref={passwordRef}
        id="pw"
        type="password"
        placeholder="Type something, then hover to reveal..."
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          fontSize: '1rem',
          border: '2px solid #e1e5eb',
          borderRadius: 8,
          marginTop: '0.5rem',
          boxSizing: 'border-box',
        }}
      />

      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: '#f0f7ff',
        borderRadius: 8,
        fontSize: '0.875rem',
        color: '#555',
      }}>
        <strong>How it works:</strong> The <code>useBlurReveal()</code> hook returns a ref.
        Attach it to any <code>&lt;input type="password"&gt;</code> and the blur effect is
        applied automatically. Cleanup happens on unmount.
      </div>
    </div>
  );
}
