# Converts the Cartoon City Builder FBX models into small GLB files for the web.
# Run with `npm run assets` (Blender 4.2+ on the PATH). Sources stay in assets-source/, never in public/.
import bpy, os, sys
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS, TEXTURES, OUT = (os.path.join(ROOT, *p) for p in (('assets-source', 'models'), ('assets-source', 'textures'), ('public', 'models')))
MAX_TEXTURE = 512
# id: (fbx name, {texture to swap: replacement}) — keep in sync with lib/catalog.ts.
# Every FBX in the pack (the car also gets two recoloured variants below).
ASSETS = {name[:-4]: (name[:-4], {}) for name in sorted(os.listdir(MODELS)) if name.endswith('.fbx')}
ASSETS['city_car'] = ('city_car', {})
ASSETS['city_car_blue'] = ('city_car', {'city_car_yellow_dif.png': 'city_car_blue_dif.png'})
ASSETS['city_car_orange'] = ('city_car', {'city_car_yellow_dif.png': 'city_car_orange_dif.png'})

def convert(asset_id, fbx, swaps):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=os.path.join(MODELS, fbx + '.fbx'))
    for image in bpy.data.images:
        name = os.path.basename(image.filepath.replace('\\', '/'))
        path = os.path.join(TEXTURES, swaps.get(name, name))
        if not os.path.exists(path): print(f'  ! {asset_id}: missing texture {name}'); continue
        image.filepath = path; image.reload()
        if max(image.size) > MAX_TEXTURE: image.scale(MAX_TEXTURE, MAX_TEXTURE)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    for o in bpy.data.objects: o.select_set(o.type == 'MESH')
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # Scale to centimetres-as-units (FBX came in at 0.01) and put the base centre at the origin.
    corners = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    low, high = Vector(map(min, zip(*corners))), Vector(map(max, zip(*corners)))
    offset = Vector(((low.x + high.x) / 2, (low.y + high.y) / 2, low.z))
    for o in meshes:
        o.data.transform(Matrix.Translation(-offset))
        o.data.transform(Matrix.Scale(100, 4))
    for material in bpy.data.materials:
        node = material.node_tree and material.node_tree.nodes.get('Principled BSDF')
        if node: node.inputs['Roughness'].default_value = 1; node.inputs['Metallic'].default_value = 0
        if node and 'Specular IOR Level' in node.inputs: node.inputs['Specular IOR Level'].default_value = 0
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, asset_id + '.glb'), export_format='GLB', use_selection=True,
        export_image_format='WEBP', export_image_quality=80, export_apply=True, export_animations=False, export_cameras=False, export_lights=False)

os.makedirs(OUT, exist_ok=True)
only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
for asset_id, (fbx, swaps) in ASSETS.items():
    if only and asset_id not in only: continue
    convert(asset_id, fbx, swaps)
    size = Vector(map(max, zip(*[o.matrix_world @ Vector(c) for o in bpy.data.objects if o.type == 'MESH' for c in o.bound_box]))) - Vector(map(min, zip(*[o.matrix_world @ Vector(c) for o in bpy.data.objects if o.type == 'MESH' for c in o.bound_box])))
    print(f'  ✓ {asset_id} {size.x:.1f}×{size.y:.1f}×{size.z:.1f}')
