import os, re, glob

src = r'C:\Users\Fatma CHAHED\real_estate_plateform\frontend\real_estate_front\src'
files = glob.glob(src + '/**/*.jsx', recursive=True) + glob.glob(src + '/**/*.js', recursive=True)

total = 0
for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        c = f.read()
    # Fix broken template literals: `${API_URL}/path" -> `${API_URL}/path`
    # The backtick starts the template but closes with " or '
    new_c = re.sub(r'`(\$\{API_URL\}[^"`\'\n]*)["\']', r'`\1`', c)
    if new_c != c:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_c)
        total += 1
        print('Fixed:', os.path.basename(fpath))

print(f'Done — {total} files fixed')
