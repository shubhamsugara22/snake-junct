# 🎨 Custom Images Guide for Snake Dodge Game

## 📁 Directory Structure

Place your custom images in the following directory structure:

```
src/client/public/icons/
├── characters/
│   ├── chibi-hero.png          # Main character (32x32 to 64x64px)
│   ├── chibi-hero-alt.png      # Alternative character
│   ├── snake-green.png         # Green snake (16x64 to 32x128px)
│   ├── snake-red.png           # Red snake
│   └── snake-purple.png        # Purple snake
├── trees/
│   ├── oak-tree.png            # Default tree (64x128 to 128x256px)
│   ├── palm-tree.png           # Beach theme tree
│   ├── pine-tree.png           # Night theme tree
│   └── jungle-tree.png         # Jungle theme tree
├── obstacles/
│   ├── stone-pillar.png        # Stone pillar (32x128 to 64x256px)
│   └── marble-pillar.png       # Marble pillar
└── backgrounds/
    ├── beach-bg.jpg            # Beach background (800x600 to 1200x800px)
    ├── night-bg.jpg            # Night background
    ├── jungle-bg.jpg           # Jungle background
    └── hell-bg.jpg             # Hell background
```

## 🖼️ Image Specifications

### **Supported Formats:**
- **PNG** - Best for characters and objects with transparency
- **SVG** - Perfect for scalable icons
- **JPG** - Good for backgrounds without transparency
- **WebP** - Modern format with smaller file sizes

### **Recommended Sizes:**

#### Characters:
- **Chibi Hero**: 32x32px to 64x64px
- **Snakes**: 16x64px to 32x128px (long and thin)

#### Environment:
- **Trees**: 64x128px to 128x256px (tall)
- **Pillars**: 32x128px to 64x256px (tall)
- **Backgrounds**: 800x600px to 1200x800px

### **Design Guidelines:**

#### Characters:
- Use bright, vibrant colors
- Include transparency (PNG format)
- Make them cute and friendly
- Ensure good contrast against backgrounds

#### Trees:
- Different styles for different themes:
  - **Beach**: Palm trees, tropical plants
  - **Jungle**: Dense foliage, vines
  - **Night**: Dark silhouettes, pine trees
  - **Hell**: Dead trees, spiky branches

#### Backgrounds:
- Match the theme atmosphere
- Use appropriate color palettes
- Ensure game elements remain visible
- Consider parallax layers for depth

## 🎮 How It Works

1. **Automatic Loading**: The game automatically tries to load images from the specified paths
2. **Fallback System**: If images aren't found, the game uses the built-in drawn graphics
3. **Theme Matching**: Trees and backgrounds change based on the current theme
4. **Performance**: Images are cached after first load

## 🚀 Adding Your Images

1. Create the directory structure in `src/client/public/icons/`
2. Add your images with the exact filenames listed above
3. Restart the game to see your custom graphics
4. The game will automatically use your images when available

## 💡 Tips for Best Results

- **Keep file sizes reasonable** (under 500KB each)
- **Use consistent art style** across all images
- **Test on different screen sizes** to ensure visibility
- **Consider animation frames** for future animated sprites
- **Use transparent backgrounds** for characters and objects

## 🔧 Technical Notes

- Images are loaded asynchronously when the game starts
- Missing images won't break the game - it falls back to drawn graphics
- All images are cached for better performance
- The game supports high-DPI displays automatically

---

**Ready to customize your Snake Dodge experience? Start adding your images and make the game uniquely yours!** 🎨✨
