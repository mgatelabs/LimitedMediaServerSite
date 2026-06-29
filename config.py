# -*- coding: utf-8 -*-
"""
config.py - MediaServerSite dev-tool runner
============================================
Combines: extract_and_merge, localize, find_plugin_langs, sync_messages

Usage:
  python config.py                          # interactive TUI (requires: pip install questionary)
  python config.py --extract                # scan templates -> en_data.json
  python config.py --extract --plugins      # also include plugin_keys.json
  python config.py --localize               # AI-translate + write i18n files
  python config.py --localize --skip-ai     # write i18n files, skip AI
  python config.py --plugin-langs           # generate plugin_keys.json
  python config.py --sync-msgs              # generate Python message helpers
  python config.py --extract --localize     # chain tasks
"""

import argparse
import json
import os
import random
import re

import requests

# ---------------------------------------------------------------------------
# tool_config.json  (persisted paths / settings)
# ---------------------------------------------------------------------------

CONFIG_FILE = "tool_config.json"


def load_config() -> dict:
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_config(cfg: dict) -> None:
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=4, ensure_ascii=False)
        f.write("\n")


def ensure_path(cfg: dict, key: str, prompt: str) -> str:
    """Return cfg[key], prompting the user (and saving) if it's missing."""
    if cfg.get(key):
        return cfg[key]
    value = input(f"  {prompt}: ").strip()
    cfg[key] = value
    save_config(cfg)
    return value


# ---------------------------------------------------------------------------
# run_extract
# ---------------------------------------------------------------------------

def run_extract(include_plugins: bool = False) -> None:
    input_directory = "./src/app"
    transloco_pattern = re.compile(
        r"[{][{]\s*t\s*\(\s*['\"]([a-zA-Z0-9_.]+)['\"]\s*\)\s*[}][}]"
    )
    seen_keys: set[str] = set()

    print(f"[extract] Scanning HTML files in {input_directory} ...")
    for root, _, files in os.walk(input_directory):
        for file in files:
            if file.endswith(".html"):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    matches = transloco_pattern.findall(f.read())
                    seen_keys.update(matches)

    print(f"  Found {len(seen_keys)} Transloco tokens")

    transloco_array = [{"path": key, "value": "", "langs": {}} for key in seen_keys]

    all_flat = transloco_array
    if include_plugins and os.path.exists("plugin_keys.json"):
        print("[extract] Loading plugin_keys.json ...")
        with open("plugin_keys.json", "r", encoding="utf-8") as f:
            plugin_data = json.load(f)

        def _flatten(d, prefix):
            items = []
            if isinstance(d, dict):
                for k in sorted(d.keys()):
                    np = f"{prefix}.{k}" if prefix else k
                    items.extend(_flatten(d[k], np))
            else:
                items.append({"path": prefix, "value": d, "langs": {}})
            return items

        for key, val in sorted(plugin_data.items()):
            all_flat.extend(_flatten({key: val}, key))

    en_data_path = "en_data.json"
    merged_array = []

    if os.path.exists(en_data_path):
        with open(en_data_path, "r", encoding="utf-8") as f:
            existing_data = json.load(f)
        for item in existing_data:
            if isinstance(item, dict) and "path" in item:
                merged_array.append({**item})

    seen_paths = {e["path"] for e in merged_array if isinstance(e, dict) and "path" in e}
    new_count = 0
    for item in all_flat:
        path = item["path"]
        if path not in seen_paths:
            merged_array.append({"path": path, "value": "", "langs": {}})
            seen_paths.add(path)
            new_count += 1

    merged_array = sorted(merged_array, key=lambda x: x["path"])

    with open(en_data_path, "w", encoding="utf-8") as out:
        json.dump(merged_array, out, indent=4, ensure_ascii=False)

    print(f"[extract] Done. {len(merged_array)} total keys ({new_count} new) → {en_data_path}")


# ---------------------------------------------------------------------------
# run_localize  (AI helpers + i18n file writer)
# ---------------------------------------------------------------------------

_ZALGO_DIACRITICS = [
    "̀", "́", "̂", "̃", "̄", "̅", "̆", "̇",
    "̈", "̉", "̊", "̋", "̌", "̍", "̎", "̏",
    "̐", "̑", "̒", "̓", "̔", "̕", "̖", "̗",
    "̘", "̙", "̚", "̛", "̜", "̝", "̞", "̟",
    "̠", "̡", "̢", "̣", "̤", "̥", "̦", "̧",
    "̨", "̩", "̪", "̫", "̬", "̭", "̮", "̯",
    "̰", "̱", "̲", "̳", "̴", "̵", "̶", "̷",
    "̸", "̹", "̺", "̻", "̼", "̽", "̾", "̿",
    "̀", "́", "͂", "̓", "̈́", "ͅ", "͆", "͇",
    "͈", "͉", "͊", "͋", "͌", "͍", "͎", "͏",
    "͐", "͑", "͒", "͓", "͔", "͕", "͖", "͗",
    "͘", "͙", "͚", "͛", "͜", "͝", "͞", "͟",
    "͠", "͡", "͢",
]

_LANG_LIST = [
    {"key": "de", "name": "German"},
    {"key": "fr", "name": "French"},
    {"key": "es", "name": "Spanish"},
    {"key": "it", "name": "Italian"},
    {"key": "ja", "name": "Japanese"},
    {"key": "zh-cn", "name": "Simplified Chinese"},
    {"key": "ko", "name": "Korean"},
]


def _send_ai_request(text: str, model: str = "qwen3.6"):
    url = "http://localhost:11434/api/generate"
    payload = {"model": model, "prompt": text, "stream": False}
    response = requests.post(url, headers={"Content-Type": "application/json"},
                             data=json.dumps(payload))
    if response.status_code == 200:
        return json.loads(response.text)["response"]
    return None


def _extract_json(response: str):
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        pass
    match = re.search(r"(\{.*\}|\[.*\])\s*$", response, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    raise ValueError("No valid JSON found in AI response")


def _get_translated_for(term: str, lang_to: str, model: str = "qwen3.6") -> str:
    if not term:
        return ""
    for _ in range(3):
        try:
            prompt = (
                f'I need you to translate the phrase/word "{term}" from "English" '
                f'to "{lang_to}" and only return a JSON response. Do not attempt to provide a python solution! '
                f"For context, the term will be used on a video/image/manga displaying website — text for a button, "
                f"action, tooltip, content rating (G, PG-13, R) or description. The word may contain () or [] which "
                f"should stay in their current spots. If there are tokens in double-brace format {{token_name}} they "
                f"must remain unchanged. Only return the result as JSON with this exact structure: "
                '{"translated":"value"}, no description or explanations.'
            )
            rsp = _send_ai_request(prompt, model)
            return _extract_json(rsp)["translated"]
        except Exception:
            pass
    return ""


def _zalgo_text(text: str) -> str:
    if not text:
        return text
    spooky = ""
    stop_spooky = False
    for ch in text:
        spooky += ch
        if ch == "{":
            stop_spooky = True
        if not stop_spooky:
            spooky += "".join(random.choices(_ZALGO_DIACRITICS, k=random.randint(1, 5)))
    return spooky


def _make_json_spooky(data):
    if isinstance(data, dict):
        return {k: _make_json_spooky(v) for k, v in data.items()}
    if isinstance(data, str):
        return _zalgo_text(data)
    return data


def _extract_flat_from_nested(nested_dict, prefix=""):
    result = {}
    if isinstance(nested_dict, dict):
        for key in nested_dict:
            new_key = f"{prefix}.{key}" if prefix else key
            if isinstance(nested_dict[key], dict):
                result.update(_extract_flat_from_nested(nested_dict[key], new_key))
            else:
                result[new_key] = nested_dict[key]
    return result


def _sort_nested(d):
    if not isinstance(d, dict):
        return d
    return {k: _sort_nested(d[k]) for k in sorted(d.keys())}


def _build_nested(paths, values):
    d = {}
    for p, v in zip(paths, values):
        if not p:
            continue
        parts = p.split(".")
        current = d
        for part in parts[:-1]:
            current = current.setdefault(part, {})
        key = parts[-1]
        if isinstance(current.get(key), dict):
            continue
        current[key] = str(v) if v is not None and v != "" else ""
    return _sort_nested(d)


def run_localize(skip_ai: bool = False, quiet: bool = False, model: str = "qwen3.6") -> None:
    i18n_dir = os.path.join("src", "assets", "i18n")
    en_data_path = "en_data.json"

    print("[localize] Loading en_data.json ...")
    with open(en_data_path, "r", encoding="utf-8") as f:
        en_data = json.load(f)

    if not skip_ai:
        print(f"[localize] Using AI model: {model}")
        # Load existing i18n files to detect changed English values
        print("[localize] Loading existing i18n files ...")
        old_en_flat: dict[str, str] = {}
        path = os.path.join(i18n_dir, "en.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                old_en_flat = _extract_flat_from_nested(json.load(f))

        # Collect all (entry, lang_info) pairs that need translation
        seen_pairs: set[tuple[str, str]] = set()
        to_translate = []

        for entry in en_data:
            path_key = entry.get("path", "")
            value = entry.get("value", "")
            if not value:
                continue
            langs = entry.setdefault("langs", {})
            for lang_info in _LANG_LIST:
                lk = lang_info["key"]
                if not langs.get(lk):
                    pair = (path_key, lk)
                    if pair not in seen_pairs:
                        seen_pairs.add(pair)
                        to_translate.append((entry, lang_info))

        total = len(to_translate)
        if total > 0:
            print(f"[localize] Translating {total} missing value(s) ...")
        else:
            print("[localize] No missing translations found.")

        for entry, lang_info in to_translate:
            value = entry.get("value", "")
            langs = entry.setdefault("langs", {})
            try:
                translation = _get_translated_for(value, lang_info["name"], model)
                if translation and translation.strip():
                    langs[lang_info["key"]] = translation
                    if not quiet:
                        print(f"  {entry['path']}.{lang_info['key']}: \"{value}\" -> \"{translation}\"")
            except Exception as e:
                if not quiet:
                    print(f"  {entry['path']}.{lang_info['key']}: ERROR - {e}")

        with open(en_data_path, "w", encoding="utf-8") as out:
            json.dump(en_data, out, indent=4, ensure_ascii=False)
        print(f"[localize] Saved translations back to {en_data_path}")
    else:
        print("[localize] Skipping AI translation (--skip-ai).")

    # Build nested i18n files from en_data
    print("[localize] Building Transloco JSON files ...")
    paths = []
    lang_values: dict[str, list[str]] = {li["key"]: [] for li in _LANG_LIST}
    lang_values["en"] = []

    for e in en_data:
        if not (isinstance(e, dict) and "path" in e):
            continue
        paths.append(e["path"])
        lang_values["en"].append(e.get("value", "") or "")
        for li in _LANG_LIST:
            lang_values[li["key"]].append((e.get("langs") or {}).get(li["key"], "") or "")

    all_lang_keys = ["en"] + [li["key"] for li in _LANG_LIST]
    for lk in all_lang_keys:
        nested = _build_nested(paths, lang_values[lk])
        out_path = os.path.join(i18n_dir, f"{lk}.json")
        with open(out_path, "w", encoding="utf-8") as fout:
            json.dump(nested, fout, indent=4, ensure_ascii=False)
            fout.write("\n")
        print(f"  → {out_path}")

    # spooky.json
    spooky_data = _make_json_spooky(_build_nested(paths, lang_values["en"]))
    spooky_path = os.path.join(i18n_dir, "spooky.json")
    with open(spooky_path, "w", encoding="utf-8") as fout:
        json.dump(spooky_data, fout, indent=4, ensure_ascii=False)
        fout.write("\n")
    print(f"  → {spooky_path}")

    print("[localize] Done.")


# ---------------------------------------------------------------------------
# run_plugin_langs
# ---------------------------------------------------------------------------

def run_plugin_langs(input_file: str, output_file: str) -> None:
    print(f"[plugin-langs] Reading {input_file} ...")
    with open(input_file, "r", encoding="utf-8") as f:
        root_json = json.load(f)

    all_keys = []
    for plugin in root_json:
        plugin_key = plugin.get("prefix_lang_id", "")
        plugin_name = plugin.get("name", "")
        if plugin_key:
            all_keys.append(f"plugins.{plugin_key}.name!~!{plugin_name}")
            all_keys.append(f"plugins.{plugin_key}.hint!~!   ")
            all_keys.append(f"plugins.{plugin_key}.title!~!   ")

        for arg in plugin.get("args", []):
            arg_key = arg.get("prefix_lang_id", "") or plugin_key
            if not arg_key:
                continue
            arg_id = arg["id"]
            all_keys.append(f"plugins.{arg_key}.{arg_id}.name!~!{arg['name']}")
            all_keys.append(f"plugins.{arg_key}.{arg_id}.hint!~!{arg['description']}")
            for val in arg.get("values", []):
                all_keys.append(f"plugins.{arg_key}.{arg_id}.opt_{val['id']}!~!{val['name']}")

    result: dict = {}
    for entry in all_keys:
        dotpath, _, text = entry.partition("!~!")
        parts = dotpath.split(".")
        current = result
        for part in parts[:-1]:
            current = current.setdefault(part, {})
        current[parts[-1]] = text.strip()

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=4, ensure_ascii=False)

    print(f"[plugin-langs] Done → {output_file}")


# ---------------------------------------------------------------------------
# run_sync_msgs
# ---------------------------------------------------------------------------

def run_sync_msgs(input_file: str, output_file: str) -> None:
    print(f"[sync-msgs] Reading {input_file} ...")
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    messages = data.get("msgs", {})
    sorted_msgs = sorted(messages.items())

    def generate_function(name: str, message: str) -> str:
        tokens = re.findall(r"\{(\w+)\}", message)
        params = ", ".join(tokens)
        params_dict = ", ".join(f'"{t}": {t}' for t in tokens)
        body = f'    return "msgs.{name}", {{{params_dict}}}' if tokens else f'    return "msgs.{name}", {{}}'
        return f"def msg_{name}({params}) -> tuple[str, dict[str, str]]:\n{body}\n"

    lines = ["# Auto-generated message functions", ""]
    for name, message in sorted_msgs:
        lines.append(generate_function(name, message))

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"[sync-msgs] Done → {output_file}")


# ---------------------------------------------------------------------------
# Interactive TUI
# ---------------------------------------------------------------------------

def interactive_menu(cfg: dict) -> None:
    try:
        import questionary
    except ImportError:
        print("questionary is not installed. Run:  pip install questionary")
        return

    print("\n  MediaServerSite Dev Tools\n")

    choices = questionary.checkbox(
        "Select tasks to run  (Space to toggle, Enter to confirm):",
        choices=[
            questionary.Choice(
                "plugin-langs — Generate plugin_keys.json from a plugin definitions file",
                value="plugin_langs",
            ),
            questionary.Choice(
                "extract  — Scan Angular templates for Transloco keys -> en_data.json",
                value="extract",
            ),
            questionary.Choice(
                "localize — AI-translate missing entries -> write all i18n/*.json files",
                value="localize",
            ),
            questionary.Choice(
                "sync-msgs    — Generate Python message helper functions from a JSON file",
                value="sync_msgs",
            ),
        ],
    ).ask()

    if not choices:
        print("Nothing selected. Exiting.")
        return

    # Sub-option: extract plugins
    include_plugins = False
    if "extract" in choices:
        include_plugins = questionary.confirm(
            "  [extract] Also include plugin_keys.json?", default=False
        ).ask()

    # Sub-option: skip AI + model selection
    skip_ai = False
    ai_model = cfg.get("ai_model", "qwen3.6")
    if "localize" in choices:
        skip_ai = questionary.confirm(
            "  [localize] Skip AI translation (just rebuild i18n files)?", default=False
        ).ask()
        if not skip_ai:
            ai_model = questionary.text(
                "  [localize] Ollama model name:",
                default=ai_model,
            ).ask()
            cfg["ai_model"] = ai_model
            save_config(cfg)

    # Paths for plugin-langs
    if "plugin_langs" in choices:
        cfg["plugin_langs_input"] = questionary.text(
            "  [plugin-langs] Input file path:",
            default=cfg.get("plugin_langs_input", ""),
        ).ask()
        cfg["plugin_langs_output"] = questionary.text(
            "  [plugin-langs] Output file path:",
            default=cfg.get("plugin_langs_output", "plugin_keys.json"),
        ).ask()
        save_config(cfg)

    # Paths for sync-msgs
    if "sync_msgs" in choices:
        cfg["sync_msgs_input"] = questionary.text(
            "  [sync-msgs] Input file path:",
            default=cfg.get("sync_msgs_input", ""),
        ).ask()
        cfg["sync_msgs_output"] = questionary.text(
            "  [sync-msgs] Output file path:",
            default=cfg.get("sync_msgs_output", "messages.py"),
        ).ask()
        save_config(cfg)

    print()

    # Execute in dependency order: plugin-langs -> extract -> localize -> sync-msgs
    if "plugin_langs" in choices:
        run_plugin_langs(cfg["plugin_langs_input"], cfg["plugin_langs_output"])
    if "extract" in choices:
        run_extract(include_plugins=include_plugins)
    if "localize" in choices:
        run_localize(skip_ai=skip_ai, model=ai_model)
    if "sync_msgs" in choices:
        run_sync_msgs(cfg["sync_msgs_input"], cfg["sync_msgs_output"])


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="MediaServerSite dev tools. Run with no arguments for interactive mode.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--extract", action="store_true",
                        help="Scan HTML templates and merge new keys into en_data.json")
    parser.add_argument("--plugins", action="store_true",
                        help="(with --extract) also include plugin_keys.json")
    parser.add_argument("--localize", action="store_true",
                        help="Translate missing entries and write i18n/*.json files")
    parser.add_argument("--skip-ai", action="store_true",
                        help="(with --localize) skip AI translation, just rebuild files")
    parser.add_argument("--model", default=None,
                        help="(with --localize) Ollama model name (default: from tool_config.json or qwen3.6)")
    parser.add_argument("--plugin-langs", action="store_true",
                        help="Generate plugin_keys.json from a plugin definitions file")
    parser.add_argument("--sync-msgs", action="store_true",
                        help="Generate Python message helper functions from a JSON file")

    args = parser.parse_args()
    cfg = load_config()

    # No flags → interactive TUI
    if not any([args.extract, args.localize, args.plugin_langs, args.sync_msgs]):
        interactive_menu(cfg)
        return

    if args.extract:
        run_extract(include_plugins=args.plugins)

    if args.localize:
        # --model flag overrides saved config; save it back if explicitly provided
        model = args.model or cfg.get("ai_model", "qwen3.6")
        if args.model:
            cfg["ai_model"] = args.model
            save_config(cfg)
        run_localize(skip_ai=args.skip_ai, model=model)

    if args.plugin_langs:
        inp = ensure_path(cfg, "plugin_langs_input", "Input plugin definitions file path")
        out = ensure_path(cfg, "plugin_langs_output", "Output file path [plugin_keys.json]")
        run_plugin_langs(inp, out)

    if args.sync_msgs:
        inp = ensure_path(cfg, "sync_msgs_input", "Input messages JSON file path")
        out = ensure_path(cfg, "sync_msgs_output", "Output Python file path [messages.py]")
        run_sync_msgs(inp, out)


if __name__ == "__main__":
    main()
