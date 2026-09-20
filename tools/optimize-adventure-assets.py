from pathlib import Path
from PIL import Image

SOURCE = Path('/home/ubuntu/webdev-static-assets')
TARGET = Path(__file__).resolve().parents[1] / 'apps/mobile/assets'
TARGET.mkdir(parents=True, exist_ok=True)

Image.open(SOURCE / 'magina-visual-target.png').convert('RGB').resize((1280, 720)).save(TARGET / 'magina-visual-target.jpg', quality=78, optimize=True)
Image.open(SOURCE / 'magina-topo-texture.png').convert('RGB').resize((640, 640)).save(TARGET / 'magina-topo-texture.jpg', quality=76, optimize=True)
Image.open(SOURCE / 'magina-compass.png').convert('RGBA').resize((256, 256)).save(TARGET / 'magina-compass.png', optimize=True)

for path in sorted(TARGET.iterdir()):
    print(f'{path.name}: {path.stat().st_size} bytes')
