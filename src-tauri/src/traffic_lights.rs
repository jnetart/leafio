//! Re-apply Overlay traffic-light insets after AppKit layout resets them.
//!
//! `trafficLightPosition` in tauri.conf.json is only applied at window
//! creation. Packaged builds then lose the inset when WKWebView content
//! loads (wry#1747). Match tao/wry: resize the title-bar container and
//! override button X coordinates.

use tauri::{Window, WindowEvent};

/// Matches `tauri.conf.json` `app.windows[0].trafficLightPosition`.
pub const TRAFFIC_LIGHT_X: f64 = 16.0;
pub const TRAFFIC_LIGHT_Y: f64 = 22.0;

/// wry/tao formula: title-bar container height = button height + y inset.
pub fn title_bar_container_height(button_height: f64) -> f64 {
    button_height + TRAFFIC_LIGHT_Y
}

pub fn should_reapply(event: &WindowEvent) -> bool {
    matches!(
        event,
        WindowEvent::Resized(_)
            | WindowEvent::Focused(_)
            | WindowEvent::ThemeChanged(_)
            | WindowEvent::ScaleFactorChanged { .. }
    )
}

pub fn on_window_event(window: &Window, event: &WindowEvent) {
    if should_reapply(event) {
        position(window);
    }
}

pub fn position(window: &Window) {
    #[cfg(target_os = "macos")]
    apply_ns_window(window.ns_window());
    #[cfg(not(target_os = "macos"))]
    let _ = window;
}

pub fn position_webview(window: &tauri::WebviewWindow) {
    #[cfg(target_os = "macos")]
    apply_ns_window(window.ns_window());
    #[cfg(not(target_os = "macos"))]
    let _ = window;
}

#[cfg(target_os = "macos")]
fn apply_ns_window(result: tauri::Result<*mut std::ffi::c_void>) {
    let Ok(ptr) = result else {
        return;
    };
    unsafe {
        inset_from_ptr(ptr);
    }
}

#[tauri::command]
pub fn reposition_traffic_lights(window: Window) {
    position(&window);
}

#[cfg(target_os = "macos")]
unsafe fn inset_from_ptr(ptr: *mut std::ffi::c_void) {
    if ptr.is_null() {
        return;
    }
    let ns_window = &*(ptr as *const objc2_app_kit::NSWindow);
    inset_traffic_lights(ns_window, TRAFFIC_LIGHT_X, TRAFFIC_LIGHT_Y);
}

#[cfg(target_os = "macos")]
unsafe fn inset_traffic_lights(window: &objc2_app_kit::NSWindow, x: f64, y: f64) {
    use objc2_app_kit::{NSView, NSWindowButton};

    let Some(close) = window.standardWindowButton(NSWindowButton::CloseButton) else {
        return;
    };
    let Some(miniaturize) = window.standardWindowButton(NSWindowButton::MiniaturizeButton) else {
        return;
    };
    let zoom = window.standardWindowButton(NSWindowButton::ZoomButton);

    let Some(title_bar_container_view) = close.superview().and_then(|view| view.superview()) else {
        return;
    };

    let close_rect = NSView::frame(&close);
    let title_bar_frame_height = close_rect.size.height + y;
    let mut title_bar_rect = NSView::frame(&title_bar_container_view);
    title_bar_rect.size.height = title_bar_frame_height;
    title_bar_rect.origin.y = window.frame().size.height - title_bar_frame_height;
    title_bar_container_view.setFrame(title_bar_rect);

    let space_between = NSView::frame(&miniaturize).origin.x - close_rect.origin.x;
    let mut window_buttons = vec![close, miniaturize];
    if let Some(zoom) = zoom {
        window_buttons.push(zoom);
    }

    for (i, button) in window_buttons.into_iter().enumerate() {
        let mut rect = NSView::frame(&button);
        rect.origin.x = x + (i as f64 * space_between);
        button.setFrameOrigin(rect.origin);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tauri::{PhysicalPosition, PhysicalSize, Theme};

    #[test]
    fn title_bar_uses_configured_y_inset() {
        assert_eq!(title_bar_container_height(12.0), 34.0);
    }

    #[test]
    fn reapplies_after_layout_and_appearance_events() {
        assert!(should_reapply(&WindowEvent::Resized(PhysicalSize::new(
            1200, 800
        ))));
        assert!(should_reapply(&WindowEvent::Focused(true)));
        assert!(should_reapply(&WindowEvent::ThemeChanged(Theme::Dark)));
        assert!(!should_reapply(&WindowEvent::Destroyed));
        assert!(!should_reapply(&WindowEvent::Moved(PhysicalPosition::new(
            0, 0
        ))));
    }
}
