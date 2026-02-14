<?php
/**
 * Plugin Name: Blur Reveal Input
 * Plugin URI:  https://github.com/iLoveMyCat/blur-reveal-input
 * Description: Replace boring password dots with a beautiful blur effect. Hover or touch to reveal.
 * Version:     1.0.0
 * Author:      Arik Shalito
 * Author URI:  https://github.com/iLoveMyCat
 * License:     MIT
 * License URI: https://opensource.org/licenses/MIT
 * Text Domain: blur-reveal-input
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'BLUR_REVEAL_VERSION', '1.0.0' );
define( 'BLUR_REVEAL_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'BLUR_REVEAL_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Get plugin settings with defaults
 */
function blur_reveal_get_settings() {
    return wp_parse_args(
        get_option( 'blur_reveal_settings', array() ),
        array(
            'enabled'        => true,
            'blur_intensity' => 4,
            'reveal_radius'  => 30,
            'fade_delay'     => 500,
            'fade_duration'  => 300,
            'login_page'     => true,
        )
    );
}

/**
 * Enqueue the blur reveal script on the frontend
 */
function blur_reveal_enqueue_scripts() {
    $settings = blur_reveal_get_settings();

    if ( ! $settings['enabled'] ) {
        return;
    }

    wp_enqueue_script(
        'blur-reveal-input',
        BLUR_REVEAL_PLUGIN_URL . 'assets/blur-reveal-input.min.js',
        array(),
        BLUR_REVEAL_VERSION,
        true
    );

    // Pass settings to JS via inline script that sets data attributes
    // on a hidden element the auto-apply module can read
    $config = array(
        'blurIntensity' => (float) $settings['blur_intensity'],
        'revealRadius'  => (int) $settings['reveal_radius'],
        'fadeDelay'     => (int) $settings['fade_delay'],
        'fadeDuration'  => (int) $settings['fade_duration'],
    );

    $inline_js = sprintf(
        'document.addEventListener("DOMContentLoaded",function(){' .
        'document.querySelectorAll("input[type=password]").forEach(function(el){' .
        'el.setAttribute("data-blur-intensity","%s");' .
        'el.setAttribute("data-reveal-radius","%s");' .
        'el.setAttribute("data-fade-delay","%s");' .
        '});});',
        esc_js( $config['blurIntensity'] ),
        esc_js( $config['revealRadius'] ),
        esc_js( $config['fadeDelay'] )
    );

    wp_add_inline_script( 'blur-reveal-input', $inline_js, 'before' );
}
add_action( 'wp_enqueue_scripts', 'blur_reveal_enqueue_scripts' );

/**
 * Also load on the WordPress login page
 */
function blur_reveal_login_enqueue() {
    $settings = blur_reveal_get_settings();

    if ( ! $settings['enabled'] || ! $settings['login_page'] ) {
        return;
    }

    wp_enqueue_script(
        'blur-reveal-input',
        BLUR_REVEAL_PLUGIN_URL . 'assets/blur-reveal-input.min.js',
        array(),
        BLUR_REVEAL_VERSION,
        true
    );
}
add_action( 'login_enqueue_scripts', 'blur_reveal_login_enqueue' );

// ─── Settings Page ──────────────────────────────────────────────

/**
 * Register the settings page
 */
function blur_reveal_add_settings_page() {
    add_options_page(
        'Blur Reveal Input',
        'Blur Reveal Input',
        'manage_options',
        'blur-reveal-input',
        'blur_reveal_render_settings_page'
    );
}
add_action( 'admin_menu', 'blur_reveal_add_settings_page' );

/**
 * Register settings
 */
function blur_reveal_register_settings() {
    register_setting( 'blur_reveal_settings_group', 'blur_reveal_settings', array(
        'type'              => 'array',
        'sanitize_callback' => 'blur_reveal_sanitize_settings',
    ) );
}
add_action( 'admin_init', 'blur_reveal_register_settings' );

/**
 * Sanitize settings before saving
 */
function blur_reveal_sanitize_settings( $input ) {
    $sanitized = array();

    $sanitized['enabled']        = ! empty( $input['enabled'] );
    $sanitized['login_page']     = ! empty( $input['login_page'] );
    $sanitized['blur_intensity'] = max( 1, min( 7, (float) ( $input['blur_intensity'] ?? 4 ) ) );
    $sanitized['reveal_radius']  = max( 10, min( 45, (int) ( $input['reveal_radius'] ?? 30 ) ) );
    $sanitized['fade_delay']     = max( 0, min( 2000, (int) ( $input['fade_delay'] ?? 500 ) ) );
    $sanitized['fade_duration']  = max( 0, min( 1000, (int) ( $input['fade_duration'] ?? 300 ) ) );

    return $sanitized;
}

/**
 * Render the settings page
 */
function blur_reveal_render_settings_page() {
    $settings = blur_reveal_get_settings();
    ?>
    <div class="wrap">
        <h1>Blur Reveal Input Settings</h1>
        <p>Replace standard password dots with a beautiful blur effect that users can reveal by hovering or touching.</p>

        <form method="post" action="options.php">
            <?php settings_fields( 'blur_reveal_settings_group' ); ?>

            <table class="form-table">
                <tr>
                    <th scope="row">Enable</th>
                    <td>
                        <label>
                            <input type="checkbox" name="blur_reveal_settings[enabled]" value="1"
                                <?php checked( $settings['enabled'] ); ?> />
                            Enable blur reveal on password fields
                        </label>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Login Page</th>
                    <td>
                        <label>
                            <input type="checkbox" name="blur_reveal_settings[login_page]" value="1"
                                <?php checked( $settings['login_page'] ); ?> />
                            Apply to the WordPress login page (wp-login.php)
                        </label>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Blur Intensity</th>
                    <td>
                        <input type="range" name="blur_reveal_settings[blur_intensity]"
                            min="1" max="7" step="0.5"
                            value="<?php echo esc_attr( $settings['blur_intensity'] ); ?>"
                            oninput="document.getElementById('blur-val').textContent=this.value+'px'" />
                        <span id="blur-val"><?php echo esc_html( $settings['blur_intensity'] ); ?>px</span>
                        <p class="description">How strong the blur effect is (1-7px)</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Reveal Radius</th>
                    <td>
                        <input type="range" name="blur_reveal_settings[reveal_radius]"
                            min="10" max="45" step="1"
                            value="<?php echo esc_attr( $settings['reveal_radius'] ); ?>"
                            oninput="document.getElementById('radius-val').textContent=this.value+'px'" />
                        <span id="radius-val"><?php echo esc_html( $settings['reveal_radius'] ); ?>px</span>
                        <p class="description">Size of the reveal window around the cursor (10-45px)</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Fade Delay</th>
                    <td>
                        <input type="range" name="blur_reveal_settings[fade_delay]"
                            min="0" max="2000" step="100"
                            value="<?php echo esc_attr( $settings['fade_delay'] ); ?>"
                            oninput="document.getElementById('delay-val').textContent=this.value+'ms'" />
                        <span id="delay-val"><?php echo esc_html( $settings['fade_delay'] ); ?>ms</span>
                        <p class="description">How long before the revealed text starts fading back (0-2000ms)</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Fade Duration</th>
                    <td>
                        <input type="range" name="blur_reveal_settings[fade_duration]"
                            min="0" max="1000" step="50"
                            value="<?php echo esc_attr( $settings['fade_duration'] ); ?>"
                            oninput="document.getElementById('duration-val').textContent=this.value+'ms'" />
                        <span id="duration-val"><?php echo esc_html( $settings['fade_duration'] ); ?>ms</span>
                        <p class="description">How long the fade-out animation takes (0-1000ms)</p>
                    </td>
                </tr>
            </table>

            <?php submit_button(); ?>
        </form>

        <hr />
        <h2>Live Preview</h2>
        <p>Type something below and hover over the field to see your current settings in action.</p>
        <div style="max-width: 400px; margin: 1rem 0 2rem;">
            <input type="password" id="blur-reveal-preview" placeholder="Type to preview..." style="width: 100%; padding: 10px; font-size: 16px;" />
        </div>

        <script src="<?php echo esc_url( BLUR_REVEAL_PLUGIN_URL . 'assets/blur-reveal-input.min.js' ); ?>"></script>
        <script>
        (function() {
            var input = document.getElementById('blur-reveal-preview');
            if (!input || typeof BlurRevealInput === 'undefined') return;

            var instance = new BlurRevealInput(input, {
                blurIntensity: <?php echo esc_js( $settings['blur_intensity'] ); ?>,
                revealRadius: <?php echo esc_js( $settings['reveal_radius'] ); ?>,
                fadeDelay: <?php echo esc_js( $settings['fade_delay'] ); ?>,
                fadeDuration: <?php echo esc_js( $settings['fade_duration'] ); ?>
            });

            // Update preview live when sliders change
            var fields = {
                'blur_reveal_settings[blur_intensity]': 'blurIntensity',
                'blur_reveal_settings[reveal_radius]': 'revealRadius',
                'blur_reveal_settings[fade_delay]': 'fadeDelay',
                'blur_reveal_settings[fade_duration]': 'fadeDuration'
            };
            Object.keys(fields).forEach(function(name) {
                var el = document.querySelector('[name="' + name + '"]');
                if (el) {
                    el.addEventListener('input', function() {
                        var cfg = {};
                        cfg[fields[name]] = parseFloat(this.value);
                        instance.updateConfig(cfg);
                    });
                }
            });
        })();
        </script>
    </div>
    <?php
}
