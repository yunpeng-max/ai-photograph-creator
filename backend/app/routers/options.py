from fastapi import APIRouter

router = APIRouter(prefix="/options", tags=["options"])


@router.get("")
async def get_options():
    return {
        "image_types": [
            {"key": "product_photo", "label_zh": "产品摄影", "label_en": "Product Photo"},
            {"key": "portrait", "label_zh": "人像摄影", "label_en": "Portrait"},
            {"key": "landscape", "label_zh": "风景摄影", "label_en": "Landscape"},
            {"key": "illustration", "label_zh": "插画", "label_en": "Illustration"},
            {"key": "food_photo", "label_zh": "美食摄影", "label_en": "Food Photo"},
            {"key": "social_media", "label_zh": "社交媒体配图", "label_en": "Social Media"},
            {"key": "architecture", "label_zh": "建筑摄影", "label_en": "Architecture"},
            {"key": "abstract", "label_zh": "抽象艺术", "label_en": "Abstract Art"},
            {"key": "logo", "label_zh": "Logo设计", "label_en": "Logo Design"},
            {"key": "concept_art", "label_zh": "概念艺术", "label_en": "Concept Art"},
        ],
        "aspect_ratios": [
            {"key": "1:1", "label_zh": "1:1 正方形", "label_en": "1:1 Square"},
            {"key": "4:3", "label_zh": "4:3 横版", "label_en": "4:3 Landscape"},
            {"key": "3:4", "label_zh": "3:4 竖版", "label_en": "3:4 Portrait"},
            {"key": "16:9", "label_zh": "16:9 宽屏", "label_en": "16:9 Widescreen"},
            {"key": "9:16", "label_zh": "9:16 手机竖屏", "label_en": "9:16 Phone"},
            {"key": "3:2", "label_zh": "3:2 经典", "label_en": "3:2 Classic"},
            {"key": "2:3", "label_zh": "2:3 竖版", "label_en": "2:3 Portrait"},
        ],
        "styles": [
            {"key": "realistic", "label_zh": "写实自然", "label_en": "Realistic"},
            {"key": "minimalist", "label_zh": "极简纯净", "label_en": "Minimalist"},
            {"key": "vibrant", "label_zh": "活力鲜艳", "label_en": "Vibrant"},
            {"key": "dark_moody", "label_zh": "暗调氛围", "label_en": "Dark & Moody"},
            {"key": "vintage", "label_zh": "复古胶片", "label_en": "Vintage"},
            {"key": "modern", "label_zh": "现代时尚", "label_en": "Modern"},
            {"key": "artistic", "label_zh": "艺术创意", "label_en": "Artistic"},
            {"key": "cartoon", "label_zh": "卡通插画", "label_en": "Cartoon"},
            {"key": "watercolor", "label_zh": "水彩风格", "label_en": "Watercolor"},
            {"key": "cyberpunk", "label_zh": "赛博朋克", "label_en": "Cyberpunk"},
            {"key": "japanese_zen", "label_zh": "日式禅意", "label_en": "Japanese Zen"},
        ],
        "scenes": [
            {"key": "studio", "label_zh": "专业影棚", "label_en": "Studio"},
            {"key": "outdoor_nature", "label_zh": "户外自然", "label_en": "Outdoor Nature"},
            {"key": "urban", "label_zh": "城市街景", "label_en": "Urban"},
            {"key": "indoor_home", "label_zh": "室内家居", "label_en": "Indoor Home"},
            {"key": "beach", "label_zh": "海滩", "label_en": "Beach"},
            {"key": "mountain", "label_zh": "山景", "label_en": "Mountain"},
            {"key": "night_city", "label_zh": "城市夜景", "label_en": "Night City"},
            {"key": "abstract_bg", "label_zh": "抽象背景", "label_en": "Abstract Background"},
            {"key": "office", "label_zh": "办公空间", "label_en": "Office"},
            {"key": "forest", "label_zh": "森林", "label_en": "Forest"},
        ],
        "whitespaces": [
            {"key": "none", "label_zh": "无留白", "label_en": "No Whitespace"},
            {"key": "some", "label_zh": "少量留白", "label_en": "Some"},
            {"key": "moderate", "label_zh": "适中留白", "label_en": "Moderate"},
            {"key": "generous", "label_zh": "大量留白", "label_en": "Generous"},
        ],
    }