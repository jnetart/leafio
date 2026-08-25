mod fs;
mod recent;
mod shell;
mod watch;

use std::sync::Mutex;
use watch::WatchState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(WatchState::default()))
        .invoke_handler(tauri::generate_handler![
            fs::list_workspace,
            fs::list_markdown_files,
            fs::search_workspace,
            fs::read_file,
            fs::write_file,
            fs::suggest_markdown_filename,
            fs::create_markdown_file,
            fs::create_subdirectory,
            fs::suggest_subdirectory_name,
            fs::default_new_file_dir,
            fs::default_leafio_workspace_dir,
            fs::user_home_dir,
            fs::rename_file,
            fs::rename_directory,
            fs::move_to_trash,
            fs::copy_file,
            fs::move_file,
            recent::get_recent_files,
            recent::add_recent_file,
            recent::remove_recent_file,
            recent::replace_recent_file,
            watch::set_workspace_watchers,
            shell::open_in_terminal,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
