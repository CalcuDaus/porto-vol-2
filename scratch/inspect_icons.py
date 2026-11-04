import base64
import io
from PIL import Image

for name in ['GithubIcon', 'LinkedinIcon', 'InstagramIcon', 'WifiWaveIcon']:
    path = f'apps/web/src/lib/icons/{name}.svelte'
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        s = content.split('base64,')[1].split('"')[0]
        im = Image.open(io.BytesIO(base64.b64decode(s)))
        print(f'{name}: size={im.size}, mode={im.mode}')
    except Exception as e:
        print(f'{name}: error {e}')

