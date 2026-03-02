
import os

def read_log(filepath):
    encodings = ['utf-16', 'utf-16-le', 'utf-8', 'cp1252']
    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                content = f.read()
                lines = content.splitlines()
                for i, line in enumerate(lines):
                    if 'ENOENT' in line or 'no such file' in line.lower():
                        print(f"--- Found at line {i} ---")
                        start = max(0, i-5)
                        end = min(len(lines), i+30)
                        for l in lines[start:end]:
                            print(l)
                return
        except Exception as e:
            continue
    print("Could not read file with common encodings.")

if __name__ == "__main__":
    read_log('verbose_build.log')
