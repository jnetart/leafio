use std::path::Path;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE: &str = "recent.json";
const KEY: &str = "files";

#[tauri::command]
pub fn get_recent_files(app: AppHandle) -> Result<Vec<String>, String> {
    let store = app.store(STORE).map_err(|e| e.to_string())?;
    let files: Vec<String> = store
        .get(KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    let existing: Vec<String> = files
        .iter()
        .filter(|path| Path::new(path.as_str()).is_file())
        .cloned()
        .collect();

    if existing.len() != files.len() {
        store.set(
            KEY,
            serde_json::to_value(&existing).map_err(|e| e.to_string())?,
        );
        store.save().map_err(|e| e.to_string())?;
    }

    Ok(existing)
}

#[tauri::command]
pub fn add_recent_file(app: AppHandle, path: String) -> Result<(), String> {
    if !Path::new(&path).is_file() {
        return Ok(());
    }

    let store = app.store(STORE).map_err(|e| e.to_string())?;
    let mut files: Vec<String> = store
        .get(KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    files.retain(|p| p != &path);
    files.insert(0, path);
    files.truncate(20);

    store.set(
        KEY,
        serde_json::to_value(&files).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_recent_file(app: AppHandle, path: String) -> Result<(), String> {
    let store = app.store(STORE).map_err(|e| e.to_string())?;
    let mut files: Vec<String> = store
        .get(KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    files.retain(|p| p != &path);

    store.set(
        KEY,
        serde_json::to_value(&files).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn replace_recent_file(
    app: AppHandle,
    old_path: String,
    new_path: String,
) -> Result<(), String> {
    if !Path::new(&new_path).is_file() {
        return remove_recent_file(app, old_path);
    }

    let store = app.store(STORE).map_err(|e| e.to_string())?;
    let mut files: Vec<String> = store
        .get(KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    files.retain(|p| p != &new_path);

    if let Some(entry) = files.iter_mut().find(|p| *p == &old_path) {
        *entry = new_path.clone();
    } else {
        files.insert(0, new_path);
    }

    files.truncate(20);

    store.set(
        KEY,
        serde_json::to_value(&files).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())
}
