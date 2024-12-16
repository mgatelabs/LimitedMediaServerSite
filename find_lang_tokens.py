import os
import re
import json

def build_nested_dict(keys):
    """
    Build a nested dictionary from dot-separated keys.

    :param keys: List of dot-separated keys (e.g., ['portals.volume', 'user.profile'])
    :return: Nested dictionary representing the Transloco JSON format.
    """
    result = {}
    for key in keys:
        parts = key.split('.')
        current = result
        for part in parts[:-1]:
            current = current.setdefault(part, {})
        current[parts[-1]] = ""
    return result

def extract_transloco_keys(directory, output_file):
    """
    Scans Angular HTML files in a directory to extract Transloco translation keys.

    :param directory: Directory containing Angular HTML files.
    :param output_file: Path to save the extracted keys in a JSON file.
    """
    transloco_pattern = re.compile(r"{{\s*t\('([a-zA-Z0-9_.]+)'\)\s*}}")
    all_keys = []

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    matches = transloco_pattern.findall(content)
                    all_keys.extend(matches)

    # Build nested dictionary in Transloco JSON format
    nested_dict = build_nested_dict(all_keys)

    # Save keys to JSON file
    with open(output_file, 'w', encoding='utf-8') as json_file:
        json.dump(nested_dict, json_file, indent=4, ensure_ascii=False)

    print(f"Extracted translation keys have been saved to {output_file}")

# Example usage
if __name__ == "__main__":
    input_directory = "./src/app"  # Adjust to your Angular app's directory
    output_json_file = "transloco_keys.json"
    extract_transloco_keys(input_directory, output_json_file)
