use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

pub struct WatchState {
    watcher: Option<RecommendedWatcher>,
}

impl Default for WatchState {
    fn default() -> Self {
        Self { watcher: None }
    }
}

#[tauri::command]
pub fn set_workspace_watchers(
    app: AppHandle,
    paths: Vec<String>,
    state: State<'_, Mutex<WatchState>>,
) -> Result<(), String> {
    let mut guard = state.lock().map_err(|e| e.to_string())?;
    guard.watcher = None;

    if paths.is_empty() {
        return Ok(());
    }

    let app_handle = app.clone();
    let mut watcher = RecommendedWatcher::new(
        move |result: Result<Event, notify::Error>| {
            if result.is_ok() {
                let _ = app_handle.emit("workspace-fs-changed", ());
            }
        },
        Config::default(),
    )
    .map_err(|e| e.to_string())?;

    for path in paths {
        watcher
            .watch(Path::new(&path), RecursiveMode::Recursive)
            .map_err(|e| e.to_string())?;
    }

    guard.watcher = Some(watcher);
    Ok(())
}
