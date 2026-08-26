use crate::search::{search_documents, SearchQuery, SearchResult};
use serde::Serialize;
use std::path::Path;

#[derive(Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

#[tauri::command]
pub async fn list_workspace(path: String) -> Result<Vec<FileEntry>, String> {
    list_directory(Path::new(&path)).await
}

#[tauri::command]
pub async fn list_markdown_files(path: String) -> Result<Vec<FileEntry>, String> {
    let mut result = Vec::new();
    collect_markdown_files(Path::new(&path), &mut result).await?;
    result.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(result)
}

#[tauri::command]
pub async fn search_workspace(
    path: String,
    terms: Vec<String>,
    tags: Vec<String>,
    paths: Vec<String>,
) -> Result<Vec<SearchResult>, String> {
    let query = SearchQuery::from_parts(terms, tags, paths);
    if query.is_empty() {
        return Ok(Vec::new());
    }

    let files = list_markdown_files(path).await?;
    let mut documents = Vec::new();
    for file in files {
        let content = tokio::fs::read_to_string(&file.path)
            .await
            .map_err(|e| e.to_string())?;
        documents.push((file.name, file.path, content));
    }

    Ok(search_documents(&documents, &query))
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| e.to_string())?;
    }
    tokio::fs::write(&path, content)
        .await
        .map_err(|e| e.to_string())
}

fn suggest_markdown_filename_in_dir(dir_path: &Path) -> Result<String, String> {
    if dir_path.exists() && !dir_path.is_dir() {
        return Err("目标路径不是文件夹".to_string());
    }

    for index in 0..100 {
        let name = if index == 0 {
            "未命名.md".to_string()
        } else {
            format!("未命名 {}.md", index)
        };
        if !dir_path.join(&name).exists() {
            return Ok(name);
        }
    }
    Err("无法创建新文件：目录中已有过多同名文件".to_string())
}

#[tauri::command]
pub async fn suggest_markdown_filename(dir: String) -> Result<String, String> {
    suggest_markdown_filename_in_dir(Path::new(&dir))
}

#[tauri::command]
pub async fn create_markdown_file(dir: String, name: String) -> Result<String, String> {
    let dir_path = Path::new(&dir);
    tokio::fs::create_dir_all(dir_path)
        .await
        .map_err(|e| e.to_string())?;

    let name = name.trim();
    if name.is_empty() {
        return Err("文件名不能为空".to_string());
    }
    if !name.ends_with(".md") {
        return Err("Markdown 文件必须以 .md 结尾".to_string());
    }
    let file_path = dir_path.join(name);
    if file_path.exists() {
        return Err("目标文件已存在".to_string());
    }
    tokio::fs::write(&file_path, "")
        .await
        .map_err(|e| e.to_string())?;
    Ok(file_path.to_string_lossy().to_string())
}

fn suggest_subdirectory_name_in_parent(parent_path: &Path) -> Result<String, String> {
    for index in 0..100 {
        let name = if index == 0 {
            "新建文件夹".to_string()
        } else {
            format!("新建文件夹 {}", index)
        };
        if !parent_path.join(&name).exists() {
            return Ok(name);
        }
    }
    Err("无法创建子文件夹：目录中已有过多同名文件夹".to_string())
}

#[tauri::command]
pub async fn suggest_subdirectory_name(parent: String) -> Result<String, String> {
    let parent_path = Path::new(&parent);
    if parent_path.exists() && !parent_path.is_dir() {
        return Err("目标路径不是文件夹".to_string());
    }
    suggest_subdirectory_name_in_parent(parent_path)
}

#[tauri::command]
pub async fn create_subdirectory(parent: String, name: String) -> Result<String, String> {
    let parent_path = Path::new(&parent);
    if parent_path.exists() && !parent_path.is_dir() {
        return Err("目标路径不是文件夹".to_string());
    }
    let name = name.trim();
    if name.is_empty() {
        return Err("文件夹名称不能为空".to_string());
    }
    if name.contains('/') || name.contains('\\') {
        return Err("文件夹名称不能包含路径分隔符".to_string());
    }
    let dir_path = parent_path.join(name);
    if dir_path.exists() {
        return Err("目标文件夹已存在".to_string());
    }
    tokio::fs::create_dir(&dir_path)
        .await
        .map_err(|e| e.to_string())?;
    Ok(dir_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn user_home_dir() -> Result<String, String> {
    Ok(user_home_path()?.to_string_lossy().to_string())
}

#[tauri::command]
pub fn default_leafio_workspace_dir() -> Result<String, String> {
    Ok(default_leafio_workspace_path()?
        .to_string_lossy()
        .to_string())
}

#[tauri::command]
pub fn default_new_file_dir() -> Result<String, String> {
    let date = chrono::Local::now().format("%Y-%m-%d").to_string();
    Ok(default_leafio_workspace_path()?
        .join(date)
        .to_string_lossy()
        .to_string())
}

fn default_leafio_workspace_path() -> Result<std::path::PathBuf, String> {
    Ok(user_home_path()?.join("Documents").join("leafio"))
}

fn user_home_path() -> Result<std::path::PathBuf, String> {
    if let Ok(home) = std::env::var("HOME") {
        if !home.is_empty() {
            return Ok(Path::new(&home).to_path_buf());
        }
    }
    if let Ok(home) = std::env::var("USERPROFILE") {
        if !home.is_empty() {
            return Ok(Path::new(&home).to_path_buf());
        }
    }
    Err("无法获取用户目录".to_string())
}

#[tauri::command]
pub async fn rename_file(path: String, new_name: String) -> Result<String, String> {
    let old_path = Path::new(&path);
    let parent = old_path
        .parent()
        .ok_or_else(|| "无效的文件路径".to_string())?;
    let new_name = new_name.trim();
    if new_name.is_empty() {
        return Err("文件名不能为空".to_string());
    }
    if !new_name.ends_with(".md") {
        return Err("Markdown 文件必须以 .md 结尾".to_string());
    }
    let new_path = parent.join(new_name);
    if new_path.exists() {
        return Err("目标文件已存在".to_string());
    }
    tokio::fs::rename(old_path, &new_path)
        .await
        .map_err(|e| e.to_string())?;
    Ok(new_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn rename_directory(path: String, new_name: String) -> Result<String, String> {
    let old_path = Path::new(&path);
    if !old_path.is_dir() {
        return Err("目标路径不是文件夹".to_string());
    }
    let parent = old_path
        .parent()
        .ok_or_else(|| "无效的文件夹路径".to_string())?;
    let new_name = new_name.trim();
    if new_name.is_empty() {
        return Err("文件夹名称不能为空".to_string());
    }
    if new_name.contains('/') || new_name.contains('\\') {
        return Err("文件夹名称不能包含路径分隔符".to_string());
    }
    let new_path = parent.join(new_name);
    if new_path.exists() {
        return Err("目标文件夹已存在".to_string());
    }
    tokio::fs::rename(old_path, &new_path)
        .await
        .map_err(|e| e.to_string())?;
    Ok(new_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn move_to_trash(path: String) -> Result<(), String> {
    let mut ctx = trash::TrashContext::new();
    #[cfg(target_os = "macos")]
    {
        use trash::macos::{DeleteMethod, TrashContextExtMacos};
        // Finder/AppleScript asks for Automation permission; NSFileManager uses the native API.
        ctx.set_delete_method(DeleteMethod::NsFileManager);
    }
    ctx.delete(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn copy_file(path: String) -> Result<String, String> {
    let old_path = Path::new(&path);
    let parent = old_path
        .parent()
        .ok_or_else(|| "无效的文件路径".to_string())?;
    let stem = old_path
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("未命名");

    for index in 0..100 {
        let name = if index == 0 {
            format!("{} - 副本.md", stem)
        } else {
            format!("{} - 副本 {}.md", stem, index)
        };
        let new_path = parent.join(&name);
        if !new_path.exists() {
            tokio::fs::copy(old_path, &new_path)
                .await
                .map_err(|e| e.to_string())?;
            return Ok(new_path.to_string_lossy().to_string());
        }
    }

    Err("无法创建副本：目录中已有过多同名文件".to_string())
}

#[tauri::command]
pub async fn move_file(path: String, dest_dir: String) -> Result<String, String> {
    let old_path = Path::new(&path);
    let file_name = old_path
        .file_name()
        .ok_or_else(|| "无效的文件路径".to_string())?;
    let dest_path = Path::new(&dest_dir).join(file_name);
    if dest_path.exists() {
        return Err("目标位置已存在同名文件".to_string());
    }
    tokio::fs::create_dir_all(&dest_dir)
        .await
        .map_err(|e| e.to_string())?;
    tokio::fs::rename(old_path, &dest_path)
        .await
        .map_err(|e| e.to_string())?;
    Ok(dest_path.to_string_lossy().to_string())
}

async fn list_directory(path: &Path) -> Result<Vec<FileEntry>, String> {
    let mut entries = tokio::fs::read_dir(path).await.map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    while let Ok(Some(entry)) = entries.next_entry().await {
        let meta = entry.metadata().await.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }
        let path = entry.path().to_string_lossy().to_string();
        result.push(FileEntry {
            name,
            path,
            is_dir: meta.is_dir(),
        });
    }
    result.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(result)
}

async fn collect_markdown_files(path: &Path, result: &mut Vec<FileEntry>) -> Result<(), String> {
    let mut entries = tokio::fs::read_dir(path).await.map_err(|e| e.to_string())?;
    while let Ok(Some(entry)) = entries.next_entry().await {
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }
        let entry_path = entry.path();
        if entry_path.is_dir() {
            Box::pin(collect_markdown_files(&entry_path, result)).await?;
            continue;
        }
        if entry_path.extension().and_then(|ext| ext.to_str()) == Some("md") {
            result.push(FileEntry {
                name,
                path: entry_path.to_string_lossy().to_string(),
                is_dir: false,
            });
        }
    }
    Ok(())
}
