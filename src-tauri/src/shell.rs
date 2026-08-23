use std::path::Path;

#[tauri::command]
pub fn open_in_terminal(path: String) -> Result<(), String> {
    let path = Path::new(&path);
    let dir = if path.is_file() {
        path.parent().ok_or_else(|| "无效路径".to_string())?
    } else {
        path
    };

    if !dir.exists() {
        return Err("路径不存在".to_string());
    }

    let dir_str = dir.to_string_lossy();

    #[cfg(target_os = "macos")]
    {
        let script = format!(
            "tell application \"Terminal\" to activate\n\
             tell application \"Terminal\" to do script \"cd {}\"",
            escape_applescript(&dir_str)
        );
        std::process::Command::new("osascript")
            .args(["-e", &script])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args([
                "/C",
                "start",
                "cmd",
                "/K",
                &format!("cd /d \"{}\"", dir_str.replace('"', "")),
            ])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        let candidates: [(&str, Vec<String>); 4] = [
            (
                "xdg-terminal-emulator",
                vec!["--working-directory".into(), dir_str.to_string()],
            ),
            (
                "gnome-terminal",
                vec!["--working-directory".into(), dir_str.to_string()],
            ),
            ("konsole", vec!["--workdir".into(), dir_str.to_string()]),
            (
                "xfce4-terminal",
                vec!["--working-directory".into(), dir_str.to_string()],
            ),
        ];

        for (command, args) in candidates {
            if std::process::Command::new(command)
                .args(&args)
                .spawn()
                .is_ok()
            {
                return Ok(());
            }
        }
        return Err("无法打开终端".to_string());
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        return Err("当前平台不支持".to_string());
    }

    Ok(())
}

fn escape_applescript(value: &str) -> String {
    value.replace('\\', "\\\\").replace('"', "\\\"")
}
