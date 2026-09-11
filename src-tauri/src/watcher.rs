use std::collections::HashMap;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use notify::{Event, EventKind, RecursiveMode, Watcher};
use tauri::{AppHandle, Emitter, State};

const DEBOUNCE_MS: u64 = 500;
const DEDUP_MS: u64 = 100;
const TICK_MS: u64 = 50;

pub(crate) struct DebouncedBuffer {
    pending: Vec<String>,
    last_event: Option<Instant>,
    /// Per-path timestamp for dedup within DEDUP_MS
    recent: HashMap<String, Instant>,
    stopped: bool,
}

pub struct WatcherState(
    pub Mutex<Option<(notify::RecommendedWatcher, Arc<Mutex<DebouncedBuffer>>)>>,
);

impl WatcherState {
    pub fn new() -> Self {
        Self(Mutex::new(None))
    }
}

#[tauri::command]
pub fn watch_project(
    app: AppHandle,
    state: State<'_, WatcherState>,
    path: String,
) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;

    // Stop previous watcher + flusher
    if let Some((_, ref buf)) = *guard {
        if let Ok(mut b) = buf.lock() {
            b.stopped = true;
        }
    }
    *guard = None;

    let buffer = Arc::new(Mutex::new(DebouncedBuffer {
        pending: Vec::new(),
        last_event: None,
        recent: HashMap::new(),
        stopped: false,
    }));

    let buf_writer = Arc::clone(&buffer);
    let capitulos = Path::new(&path).join("capitulos");
    let terminados = Path::new(&path).join("capitulos-terminados");

    let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
        if let Ok(event) = res {
            match event.kind {
                EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_) => {
                    let now = Instant::now();
                    if let Ok(mut buf) = buf_writer.lock() {
                        for p in &event.paths {
                            if let Some(s) = p.to_str() {
                                let key = s.to_string();
                                // Dedup: skip if same path was seen within DEDUP_MS
                                if let Some(prev) = buf.recent.get(&key) {
                                    if now.duration_since(*prev)
                                        < Duration::from_millis(DEDUP_MS)
                                    {
                                        continue;
                                    }
                                }
                                buf.recent.insert(key.clone(), now);
                                buf.pending.push(key);
                            }
                        }
                        buf.last_event = Some(now);
                    }
                }
                _ => {}
            }
        }
    })
    .map_err(|e| e.to_string())?;

    if capitulos.exists() {
        watcher
            .watch(&capitulos, RecursiveMode::NonRecursive)
            .map_err(|e| e.to_string())?;
    }
    if terminados.exists() {
        watcher
            .watch(&terminados, RecursiveMode::NonRecursive)
            .map_err(|e| e.to_string())?;
    }

    // Flusher thread: checks buffer every TICK_MS, emits after DEBOUNCE_MS quiet period
    let buf_reader = Arc::clone(&buffer);
    let app_clone = app.clone();
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(Duration::from_millis(TICK_MS));

            let mut flush = Vec::new();
            {
                let Ok(mut buf) = buf_reader.lock() else {
                    break;
                };
                if buf.stopped {
                    break;
                }
                if let Some(last) = buf.last_event {
                    if last.elapsed() >= Duration::from_millis(DEBOUNCE_MS)
                        && !buf.pending.is_empty()
                    {
                        flush = std::mem::take(&mut buf.pending);
                        buf.last_event = None;
                        // Clean up old dedup entries
                        let cutoff =
                            Instant::now() - Duration::from_millis(DEBOUNCE_MS + DEDUP_MS);
                        buf.recent.retain(|_, t| *t > cutoff);
                    }
                }
            }

            if !flush.is_empty() {
                // Deduplicate the batch (keep unique paths)
                flush.sort();
                flush.dedup();
                let _ = app_clone.emit("project-files-changed", flush);
            }
        }
    });

    *guard = Some((watcher, buffer));
    Ok(())
}

#[tauri::command]
pub fn unwatch_project(state: State<'_, WatcherState>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    if let Some((_, ref buf)) = *guard {
        if let Ok(mut b) = buf.lock() {
            b.stopped = true;
        }
    }
    *guard = None;
    Ok(())
}
