use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use std::io::{Read, Write};
use std::sync::Mutex;
use tauri::{Emitter, State, Window};

pub struct PtySession {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
}

pub type PtyState = Mutex<Option<PtySession>>;

#[tauri::command]
pub fn pty_spawn(cwd: String, state: State<'_, PtyState>, window: Window) -> Result<(), String> {
    let mut guard = state.lock().unwrap();

    // Drop existing session (closes pty, reader thread exits via EOF)
    *guard = None;

    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize { rows: 24, cols: 80, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| e.to_string())?;

    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
    let mut cmd = CommandBuilder::new(&shell);
    cmd.args(["-i", "-l"]);
    cmd.cwd(&cwd);
    cmd.env("TERM", "xterm-256color");

    // Spawn the shell in the slave pty (drops slave after spawn)
    let _child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;

    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    // Background thread: stream pty output to frontend
    std::thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    if window.emit("pty:output", &data).is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
    });

    *guard = Some(PtySession { master: pair.master, writer });
    Ok(())
}

#[tauri::command]
pub fn pty_write(input: String, state: State<'_, PtyState>) -> Result<(), String> {
    let mut guard = state.lock().unwrap();
    if let Some(session) = guard.as_mut() {
        session.writer.write_all(input.as_bytes()).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn pty_resize(cols: u16, rows: u16, state: State<'_, PtyState>) -> Result<(), String> {
    let guard = state.lock().unwrap();
    if let Some(session) = guard.as_ref() {
        session
            .master
            .resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn pty_kill(state: State<'_, PtyState>) -> Result<(), String> {
    let mut guard = state.lock().unwrap();
    *guard = None;
    Ok(())
}
