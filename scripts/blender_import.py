# Turn the site's .glb export (window.__exportGLB(), see src/Experience/devExport.js)
# into a ready-to-use .blend: imported at world scale, colours shown as on the
# site (Standard view transform: the cards are unlit, so what you see is the
# drawing), a paper-coloured world, a camera like the site's, and one front
# camera per world. Optionally renders a preview of each world.
#
#   blender -b --python scripts/blender_import.py -- <in.glb> <out.blend> <scenes.json> [previewDir]
#
# scenes.json: [{ "id": "childhood", "x0": -21, "x1": 15, "ground": 0.6 }, ...]
# (three.js x/y/z become Blender x/-z/y: the wall is at +y, the camera side is -y)
import bpy, json, math, os, sys

argv = sys.argv[sys.argv.index("--") + 1:]
glb, blend, scenes_json = argv[0], argv[1], argv[2]
preview = argv[3] if len(argv) > 3 else None
scenes = json.load(open(scenes_json, encoding="utf-8"))

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0  # no .blend1 backups
bpy.ops.import_scene.gltf(filepath=glb)
sc = bpy.context.scene

# colours as drawn
sc.view_settings.view_transform = "Standard"
sc.view_settings.look = "None"
world = bpy.data.worlds.new("Paper")
sc.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.905, 0.847, 0.746, 1)  # #F4EDE0

# group everything that came in under one empty, so it moves as one
root = bpy.data.objects.new("CanTheThoi_world", None)
sc.collection.objects.link(root)
for ob in list(sc.objects):
    if ob is not root and ob.parent is None:
        ob.parent = root

def add_camera(name, x, ground, ortho_width=None):
    cam = bpy.data.cameras.new(name)
    ob = bpy.data.objects.new(name, cam)
    sc.collection.objects.link(ob)
    if ortho_width:
        cam.type = "ORTHO"
        cam.ortho_scale = ortho_width
        ob.location = (x, -30, ground + 2.4)
        ob.rotation_euler = (math.radians(90), 0, 0)
    else:
        # the site's zoomed-out view: 4.5 above the ground, 10.7 from the
        # wall plane's origin, tilted down 0.2 rad, vertical fov 35
        cam.sensor_fit = "VERTICAL"
        cam.angle = math.radians(35)
        ob.location = (x, -10.7, ground + 4.5)
        ob.rotation_euler = (math.radians(90) - 0.2, 0, 0)
    cam.clip_end = 300
    return ob

site_cam = add_camera("Cam_site_view", scenes[0]["x0"] + 6, scenes[0]["ground"])
world_cams = [add_camera(f"Cam_{s['id']}", (s["x0"] + s["x1"]) / 2, s["ground"], s["x1"] - s["x0"] + 1) for s in scenes]
sc.camera = site_cam

sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
bpy.ops.wm.save_as_mainfile(filepath=blend)
print("saved", blend, len(sc.objects), "objects")

if preview:
    os.makedirs(preview, exist_ok=True)
    for engine in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT", "BLENDER_WORKBENCH"):
        try:
            sc.render.engine = engine
            break
        except TypeError:
            continue
    if sc.render.engine == "BLENDER_WORKBENCH":
        sc.display.shading.light = "FLAT"
        sc.display.shading.color_type = "TEXTURE"
    print("engine", sc.render.engine)
    for cam, s in zip(world_cams, scenes):
        sc.camera = cam
        w = s["x1"] - s["x0"] + 1
        sc.render.resolution_x = 1800
        sc.render.resolution_y = int(1800 * 6.5 / w)
        sc.render.filepath = os.path.join(preview, f"{s['id']}.png")
        bpy.ops.render.render(write_still=True)
        print("rendered", sc.render.filepath)
    sc.camera = site_cam
    sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
    sc.render.filepath = os.path.join(preview, "site_view.png")
    bpy.ops.render.render(write_still=True)
    sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
