# config.py — MediaServerSite Dev Tools

Single entry point replacing four separate scripts. Run interactively or pass flags directly.

## Quick Start

```bash
# Interactive mode — checkbox menu, pick what to run
python config.py

# Or pass flags directly
python config.py --extract
python config.py --localize --skip-ai
python config.py --extract --localize
```

---

## Tasks

### `--extract` — Sync translation keys from templates

Walks every `.html` file under `src/app/`, finds all `{{ t('key') }}` Transloco calls, and merges any new keys into `en_data.json`. Existing entries (including their values and translations) are never overwritten — only genuinely new paths are added as blank entries.

```bash
python config.py --extract
```

**Sub-flag: `--plugins`**
Also pulls keys from `plugin_keys.json` into the merge. Only useful if you have already run `--plugin-langs` to generate that file.

```bash
python config.py --extract --plugins
```

---

### `--localize` — Translate and rebuild i18n files

Two steps in one:

1. **AI translation** — for every entry in `en_data.json` that has an English value but is missing one or more language translations, calls a local Ollama model (`qwen3.6` at `localhost:11434`) to fill in the gap. Results are written back to `en_data.json`.

2. **File rebuild** — reads all values from `en_data.json` and writes the full set of Transloco-compatible JSON files to `src/assets/i18n/`:
   - `en.json`, `de.json`, `fr.json`, `es.json`, `it.json`, `ja.json`, `zh-cn.json`, `ko.json`
   - `spooky.json` (Zalgo-text version of English, for layout/rendering tests)

```bash
python config.py --localize
```

**Sub-flag: `--skip-ai`**
Skips step 1 entirely and goes straight to rebuilding the JSON files. Useful when you have just edited `en_data.json` by hand and want to push the changes out without waiting for AI calls.

```bash
python config.py --localize --skip-ai
```

---

### `--plugin-langs` — Generate plugin translation keys

Reads a plugin definitions JSON file (the same format the backend serves for plugin metadata) and produces a `plugin_keys.json` containing all translatable strings — plugin names, argument labels, hints, and option values — structured as a nested Transloco key tree.

The output file can then be fed into `--extract --plugins` to merge those keys into `en_data.json`.

```bash
python config.py --plugin-langs
```

Input/output file paths are saved to `tool_config.json` on first use and reused automatically on subsequent runs.

---

### `--sync-msgs` — Generate Python message helpers

Reads a JSON file containing a `msgs` object and produces a Python file of typed helper functions, one per message key. Each function takes the message's interpolation tokens as parameters and returns a `(key, params)` tuple for use with `NoticeService`.

```bash
python config.py --sync-msgs
```

Input/output file paths are saved to `tool_config.json` on first use and reused automatically on subsequent runs.

---

## Persistent configuration — `tool_config.json`

File paths for `--plugin-langs` and `--sync-msgs` are saved here so you don't have to retype them. The file is created automatically on first use. Edit it directly if paths change.

```json
{
    "plugin_langs_input": "path/to/plugins.json",
    "plugin_langs_output": "plugin_keys.json",
    "sync_msgs_input": "path/to/messages.json",
    "sync_msgs_output": "messages.py"
}
```

---

## Source of truth

`en_data.json` (project root) is the canonical source for all translations. **Never edit `src/assets/i18n/*.json` directly** — those files are generated output and will be overwritten by `--localize`.

The format for each entry in `en_data.json`:

```json
{
    "path": "section.key",
    "value": "English text",
    "langs": {
        "de": "German text",
        "fr": "French text",
        "es": "Spanish text",
        "it": "Italian text",
        "ja": "Japanese text",
        "zh-cn": "Simplified Chinese text",
        "ko": "Korean text"
    }
}
```

---

## Typical workflow

```bash
# Full pipeline (plugin definitions changed)
python config.py --plugin-langs          # 1. extract plugin strings -> plugin_keys.json
python config.py --extract --plugins     # 2. merge template keys + plugin keys -> en_data.json
python config.py --localize              # 3. translate + write i18n files

# Day-to-day (no plugin changes)
python config.py --extract               # sync new template keys
python config.py --localize --skip-ai   # push hand-edited translations out immediately
```

---

## Requirements

| Package | Purpose | Install |
|---------|---------|---------|
| `requests` | HTTP calls to Ollama for AI translation | `pip install requests` |
| `questionary` | Interactive TUI checkbox menu | `pip install questionary` |
| [Ollama](https://ollama.com) + `qwen3.6` | Local AI model for translation | `ollama pull qwen3.6` |

`questionary` is only required for interactive mode. All flag-based usage works without it.
