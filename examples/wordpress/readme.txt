=== Blur Reveal Input ===
Contributors: arikshalito
Tags: password, blur, reveal, security, login, ux
Requires at least: 5.0
Tested up to: 6.9
Stable tag: 1.0.0
Requires PHP: 7.4
License: MIT
License URI: https://opensource.org/licenses/MIT

Replace boring password dots with a beautiful blur effect. Hover or touch to reveal.

== Description ==

Blur Reveal Input transforms every password field on your WordPress site from standard bullet dots into elegantly blurred text that users can reveal by hovering (desktop) or touching (mobile).

**Features:**

* Automatically applies to all password inputs on your site
* Works on the WordPress login page (wp-login.php)
* Desktop: hover to reveal, smooth fade-out when you leave
* Mobile: touch and drag to reveal, fades back after lifting
* Configurable blur intensity, reveal radius, and fade timing
* Simple settings page — no code required
* Zero performance impact — lightweight JS (27KB minified)
* Respects reduced motion preferences for accessibility

== Installation ==

1. Upload the `blur-reveal-input` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. That's it! All password fields now have the blur reveal effect
4. (Optional) Go to Settings > Blur Reveal Input to customize

== Frequently Asked Questions ==

= Does this affect password security? =

No. This is purely a visual effect. The actual password value stays in the standard HTML input element. No data is sent anywhere, no passwords are stored or exposed.

= Does it work with WooCommerce? =

Yes. It automatically applies to any `<input type="password">` on the page, including WooCommerce login, registration, and checkout forms.

= Does it work on mobile? =

Yes. On touch devices, users can touch and drag across the password field to reveal characters. The effect fades back after lifting the finger.

= Can I disable it on specific pages? =

You can disable it globally from the settings page. For per-page control, add `data-blur-reveal="false"` to any password input you want to exclude.

= Does it conflict with other plugins? =

Blur Reveal Input is non-invasive — it wraps the password input in a container and adds visual overlays. It does not modify the input value or interfere with form submission.

== Screenshots ==

1. Password field with blur effect applied
2. Hovering to reveal characters
3. Settings page in wp-admin

== Changelog ==

= 1.0.0 =
* Initial release
* Desktop hover reveal with range accumulation
* Mobile touch reveal
* Smooth fade-out animation
* WordPress admin settings page
* Login page support
