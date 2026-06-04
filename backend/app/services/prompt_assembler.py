# Image type prompts
IMAGE_TYPE_PROMPTS = {
    "product_photo": "Professional product photography of:",
    "portrait": "A professional portrait photograph of:",
    "landscape": "A landscape photograph of:",
    "illustration": "A digital illustration of:",
    "food_photo": "Professional food photography of:",
    "social_media": "A social media graphic featuring:",
    "architecture": "An architectural photograph of:",
    "abstract": "An abstract image depicting:",
    "logo": "A logo design for:",
    "concept_art": "Concept art of:",
}

# Aspect ratio prompts
ASPECT_RATIO_PROMPTS = {
    "1:1": "1:1 square format",
    "4:3": "4:3 landscape format",
    "3:4": "3:4 portrait format",
    "16:9": "16:9 widescreen landscape format",
    "9:16": "9:16 vertical/portrait format (phone screen ratio)",
    "3:2": "3:2 classic photo format",
    "2:3": "2:3 portrait photo format",
}

# Style prompts
STYLE_PROMPTS = {
    "realistic": "Style: Photorealistic, natural lighting, true-to-life colors",
    "minimalist": "Style: Minimalist, clean lines, muted color palette, simple composition",
    "vibrant": "Style: Vibrant and colorful, high saturation, energetic mood",
    "dark_moody": "Style: Dark and moody, low-key lighting, dramatic shadows",
    "vintage": "Style: Vintage/retro aesthetic, warm tones, film grain texture",
    "modern": "Style: Modern and sleek, high contrast, contemporary feel",
    "artistic": "Style: Artistic and creative, painterly quality, expressive",
    "cartoon": "Style: Cartoon/flat illustration style, bold outlines, bright colors",
    "watercolor": "Style: Watercolor painting aesthetic, soft washes, delicate brushwork",
    "cyberpunk": "Style: Cyberpunk aesthetic, neon lights, futuristic, high-tech",
    "japanese_zen": "Style: Japanese zen aesthetic, wabi-sabi, subdued, natural",
}

# Scene prompts
SCENE_PROMPTS = {
    "studio": "Scene: Clean studio environment with professional soft lighting",
    "outdoor_nature": "Scene: Natural outdoor setting with greenery and natural light",
    "urban": "Scene: Urban/city environment with architectural elements",
    "indoor_home": "Scene: Cozy indoor/home environment with warm ambient light",
    "beach": "Scene: Beach/ocean setting with sandy tones and natural light",
    "mountain": "Scene: Mountain backdrop with expansive natural scenery",
    "night_city": "Scene: Nighttime cityscape with ambient city lights",
    "abstract_bg": "Scene: Abstract gradient background with smooth color transitions",
    "office": "Scene: Modern office/workspace environment",
    "forest": "Scene: Forest/woodland setting with dappled light through trees",
}

# Whitespace prompts
WHITESPACE_PROMPTS = {
    "none": "Composition: Fill the frame, tight cropping, minimal empty space",
    "some": "Composition: Balanced composition with moderate breathing room around the subject",
    "moderate": "Composition: Noticeable negative space surrounding the subject for visual clarity",
    "generous": "Composition: Abundant negative space, subject occupies small portion of frame",
}

# Quality suffix added to all prompts
QUALITY_SUFFIX = (
    "Technical requirements: High resolution, sharp focus, professional quality, "
    "well-composed, visually striking. No text, no watermarks, no signatures."
)


def assemble_prompt(
    image_type: str,
    aspect_ratio: str,
    style: str,
    scene: str,
    whitespace: str,
    subject: str,
    additional_requirements: str | None = None,
) -> str:
    """Assemble structured form inputs into a professional image generation prompt."""

    # Get prompt fragments from mappings
    type_prompt = IMAGE_TYPE_PROMPTS.get(image_type, "Professional image of:")
    ratio_prompt = ASPECT_RATIO_PROMPTS.get(aspect_ratio, aspect_ratio)
    style_prompt = STYLE_PROMPTS.get(style, "")
    scene_prompt = SCENE_PROMPTS.get(scene, "")
    whitespace_prompt = WHITESPACE_PROMPTS.get(whitespace, "")

    # Build the structured prompt
    parts = [
        type_prompt,
        f"Subject: {subject}",
        scene_prompt,
        style_prompt,
        whitespace_prompt,
        f"Aspect ratio: {ratio_prompt}",
    ]

    if additional_requirements and additional_requirements.strip():
        parts.append(f"Additional: {additional_requirements}")

    parts.append(QUALITY_SUFFIX)

    return "\n".join(parts)
