import json
import os
import random

def merge_dicts(source, dest):
    """
    Recursively merge source dictionary into destination dictionary.
    If a key exists in both, the destination value is preserved.

    :param source: Source dictionary to merge from.
    :param dest: Destination dictionary to merge into.
    """
    for key, value in source.items():
        if key in dest:
            if isinstance(value, dict) and isinstance(dest[key], dict):
                merge_dicts(value, dest[key])
            elif dest[key] == "" and value != "":
                dest[key] = value
        else:
            dest[key] = value

def merge_json_files(source_file, dest_file, output_file):
    """
    Load source and destination JSON files, merge them, and save the result.

    :param source_file: Path to the source JSON file.
    :param dest_file: Path to the destination JSON file.
    :param output_file: Path to save the merged JSON file.
    """
    with open(source_file, 'r', encoding='utf-8') as src:
        source_data = json.load(src)

    with open(dest_file, 'r', encoding='utf-8') as dest:
        dest_data = json.load(dest)

    merge_dicts(source_data, dest_data)

    with open(output_file, 'w', encoding='utf-8') as out:
        json.dump(dest_data, out, indent=4, ensure_ascii=False)

    print(f"Merged JSON has been saved to {output_file}")

# Characters for Zalgo text
diacritics = [
    '\u0300', '\u0301', '\u0302', '\u0303', '\u0304', '\u0305', '\u0306', '\u0307', '\u0308', '\u0309',
    '\u030a', '\u030b', '\u030c', '\u030d', '\u030e', '\u030f', '\u0310', '\u0311', '\u0312', '\u0313',
    '\u0314', '\u0315', '\u0316', '\u0317', '\u0318', '\u0319', '\u031a', '\u031b', '\u031c', '\u031d',
    '\u031e', '\u031f', '\u0320', '\u0321', '\u0322', '\u0323', '\u0324', '\u0325', '\u0326', '\u0327',
    '\u0328', '\u0329', '\u032a', '\u032b', '\u032c', '\u032d', '\u032e', '\u032f', '\u0330', '\u0331',
    '\u0332', '\u0333', '\u0334', '\u0335', '\u0336', '\u0337', '\u0338', '\u0339', '\u033a', '\u033b',
    '\u033c', '\u033d', '\u033e', '\u033f', '\u0340', '\u0341', '\u0342', '\u0343', '\u0344', '\u0345',
    '\u0346', '\u0347', '\u0348', '\u0349', '\u034a', '\u034b', '\u034c', '\u034d', '\u034e', '\u034f',
    '\u0350', '\u0351', '\u0352', '\u0353', '\u0354', '\u0355', '\u0356', '\u0357', '\u0358', '\u0359',
    '\u035a', '\u035b', '\u035c', '\u035d', '\u035e', '\u035f', '\u0360', '\u0361', '\u0362'
]

def zalgo_text(text):
    """
    Converts text to Zalgo (spooky) text by adding random diacritics.

    :param text: Original text to convert.
    :return: Spooky version of the text.
    """
    if not text:
        return text
    spooky = ""
    for char in text:
        spooky += char
        spooky += ''.join(random.choices(diacritics, k=random.randint(1, 5)))
    return spooky

def make_json_spooky(input_file, output_file):
    """
    Converts all values in a Transloco JSON file to spooky text.

    :param input_file: Path to the input JSON file.
    :param output_file: Path to save the spooky JSON file.
    """
    def transform_values(data):
        """
        Recursively transform all string values in a nested dictionary to Zalgo text.

        :param data: Dictionary to transform.
        :return: Transformed dictionary.
        """
        if isinstance(data, dict):
            return {key: transform_values(value) for key, value in data.items()}
        elif isinstance(data, str):
            return zalgo_text(data)
        else:
            return data

    # Load JSON file
    with open(input_file, 'r', encoding='utf-8') as infile:
        json_data = json.load(infile)

    # Transform values to spooky text
    spooky_data = transform_values(json_data)

    # Save transformed JSON to output file
    with open(output_file, 'w', encoding='utf-8') as outfile:
        json.dump(spooky_data, outfile, indent=4, ensure_ascii=False)

    print(f"Spooky JSON has been saved to {output_file}")

# Example usage
if __name__ == "__main__":

    i18n_folder_path = os.path.join('src', "assets", 'i18n') 

    source_json_file = "transloco_keys.json"
    en_json_file = os.path.join(i18n_folder_path, 'en.json') 
    es_json_file = os.path.join(i18n_folder_path, 'es.json') 
    fr_json_file = os.path.join(i18n_folder_path, 'fr.json') 
    de_json_file = os.path.join(i18n_folder_path, 'de.json') 
    spooky_json_file = os.path.join(i18n_folder_path, 'spooky.json') 
    merge_json_files(source_json_file, en_json_file, en_json_file)
    merge_json_files(en_json_file, es_json_file, es_json_file)
    merge_json_files(en_json_file, fr_json_file, fr_json_file)
    merge_json_files(en_json_file, de_json_file, de_json_file)

    make_json_spooky(en_json_file, spooky_json_file)
