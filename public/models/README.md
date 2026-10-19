# Modelos GLB

Exportá desde Blender / SketchUp / Unreal como **glTF binary (.glb)** con:

- Draco o meshopt
- escala en metros
- origen en el piso del objeto

Poné el archivo acá y referencialo en `public/campus.json`:

```json
{ "id": "holo-cad", "glb": "turbina.glb" }
```

El loader usa Draco desde gstatic. Sin `glb` el pod usa geometría procedural.
