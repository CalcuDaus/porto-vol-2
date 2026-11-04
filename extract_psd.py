import os
import json
from psd_tools import PSDImage

psd_path = r"M:\DATA\Project JS\porto-vol-2\psd\tampilan_index_halaman_porto.psd"
output_dir = r"M:\DATA\Project JS\porto-vol-2\psd\extracted"
os.makedirs(output_dir, exist_ok=True)

print(f"Loading PSD: {psd_path}")
psd = PSDImage.open(psd_path)
print(f"PSD size: {psd.width}x{psd.height}")

# 1. Save full composite image preview
preview_path = os.path.join(output_dir, "full_preview.png")
print("Rendering full composite preview...")
composite = psd.composite()
if composite:
    composite.save(preview_path)
    print(f"Saved full preview to {preview_path}")

# 2. Extract layer hierarchy and details
layers_info = []

def inspect_layer(layer, depth=0):
    info = {
        "name": layer.name,
        "kind": layer.kind,
        "visible": layer.is_visible(),
        "opacity": layer.opacity,
        "bbox": [layer.left, layer.top, layer.right, layer.bottom],
        "width": layer.width,
        "height": layer.height,
        "depth": depth
    }
    
    if layer.kind == "type":
        try:
            info["text"] = layer.text
        except Exception as e:
            info["text_error"] = str(e)
            
    if layer.is_group():
        info["children"] = [inspect_layer(child, depth + 1) for child in layer]
    else:
        # Save interesting visual layers as assets if reasonably sized
        if layer.is_visible() and layer.width > 20 and layer.height > 20:
            safe_name = "".join([c if c.isalnum() or c in ('-', '_') else '_' for c in layer.name])
            asset_filename = f"layer_{depth}_{safe_name}_{layer.width}x{layer.height}.png"
            asset_path = os.path.join(output_dir, asset_filename)
            try:
                img = layer.composite()
                if img:
                    img.save(asset_path)
                    info["asset_file"] = asset_filename
            except Exception as e:
                pass
                
    return info

print("Parsing layers...")
for layer in psd:
    layers_info.append(inspect_layer(layer, 0))

summary_path = os.path.join(output_dir, "psd_layers.json")
with open(summary_path, "w", encoding="utf-8") as f:
    json.dump({
        "width": psd.width,
        "height": psd.height,
        "layers": layers_info
    }, f, indent=2, ensure_ascii=False)

print(f"Extraction complete! Summary saved to {summary_path}")

