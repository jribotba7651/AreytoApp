use serde::Serialize;
use std::path::Path;
use std::process::Command;

#[derive(Serialize)]
pub struct CommitInfo {
    pub hash: String,
    pub short_hash: String,
    pub message: String,
    pub timestamp: String,
}

fn git(repo_path: &str, args: &[&str]) -> Result<String, String> {
    let out = Command::new("git")
        .current_dir(repo_path)
        .args(args)
        .output()
        .map_err(|e| format!("git not found: {e}"))?;

    if out.status.success() {
        Ok(String::from_utf8_lossy(&out.stdout).into_owned())
    } else {
        Err(String::from_utf8_lossy(&out.stderr).trim().to_owned())
    }
}

#[tauri::command]
pub fn git_repo_exists(repo_path: String) -> bool {
    Path::new(&repo_path).join(".git").exists()
}

#[tauri::command]
pub fn git_init(repo_path: String) -> Result<(), String> {
    git(&repo_path, &["init"])?;
    let _ = git(&repo_path, &["config", "user.email", "writersden@local"]);
    let _ = git(&repo_path, &["config", "user.name", "Writers Den"]);
    Ok(())
}

#[tauri::command]
pub fn git_initial_commit(repo_path: String) -> Result<String, String> {
    git(&repo_path, &["add", "."])?;
    git(&repo_path, &["commit", "-m", "Initial commit"])?;
    let hash = git(&repo_path, &["rev-parse", "HEAD"])?;
    Ok(hash.trim().to_owned())
}

#[tauri::command]
pub fn git_has_changes(repo_path: String, file_path: String) -> Result<bool, String> {
    // Tracked modifications
    let diff = Command::new("git")
        .current_dir(&repo_path)
        .args(["diff", "--quiet", "--", &file_path])
        .status()
        .map_err(|e| e.to_string())?;
    if !diff.success() {
        return Ok(true);
    }

    // Staged but not committed
    let cached = Command::new("git")
        .current_dir(&repo_path)
        .args(["diff", "--cached", "--quiet", "--", &file_path])
        .status()
        .map_err(|e| e.to_string())?;
    if !cached.success() {
        return Ok(true);
    }

    // Untracked files
    let untracked = git(&repo_path, &["ls-files", "--others", "--exclude-standard", &file_path])?;
    Ok(!untracked.trim().is_empty())
}

#[tauri::command]
pub fn git_commit_file(
    repo_path: String,
    file_path: String,
    message: String,
) -> Result<String, String> {
    git(&repo_path, &["add", &file_path])?;
    git(&repo_path, &["commit", "-m", &message])?;
    let hash = git(&repo_path, &["rev-parse", "HEAD"])?;
    Ok(hash.trim().to_owned())
}

#[tauri::command]
pub fn git_log_file(
    repo_path: String,
    file_path: String,
    limit: u32,
) -> Result<Vec<CommitInfo>, String> {
    let n = format!("-{limit}");
    let out = git(
        &repo_path,
        &["log", &n, "--pretty=format:%H|%h|%s|%aI", "--", &file_path],
    )?;

    let commits = out
        .lines()
        .filter(|l| !l.is_empty())
        .filter_map(|line| {
            let p: Vec<&str> = line.splitn(4, '|').collect();
            if p.len() == 4 {
                Some(CommitInfo {
                    hash: p[0].to_owned(),
                    short_hash: p[1].to_owned(),
                    message: p[2].to_owned(),
                    timestamp: p[3].to_owned(),
                })
            } else {
                None
            }
        })
        .collect();

    Ok(commits)
}
