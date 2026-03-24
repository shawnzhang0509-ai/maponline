import os
import cloudinary
import cloudinary.uploader
from flask import current_app

# 允许的文件后缀
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'gif'}

def allowed_file(filename: str) -> bool:
    """检查文件后缀是否合法"""
    return (
        '.' in filename and
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    )

def save_uploaded_file(file):
    """
    将文件上传到 Cloudinary 而不是本地磁盘
    返回: (cloudinary_url, public_id)
    """
    # 1. 确保已经配置了 Cloudinary (通常会在 app 初始化时做，这里做个双重保险)
    # 如果已经在 shop.py 主文件配置过，这几行可以省略，但加上更稳妥
    if not cloudinary.config().cloud_name:
        cloudinary.config(
            cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
            api_key=os.getenv('CLOUDINARY_API_KEY'),
            api_secret=os.getenv('CLOUDINARY_API_SECRET')
        )

    try:
        # 2. 直接上传到云端
        # folder: 指定在 Cloudinary 后台的文件夹名称，方便管理
        upload_result = cloudinary.uploader.upload(
            file, 
            folder="nz_massage_images", 
            allowed_formats=['jpg', 'jpeg', 'png', 'webp']
        )

        # 3. 获取结果
        image_url = upload_result['secure_url']  # 安全的 https 链接
        public_id = upload_result['public_id']   # 图片的唯一 ID

        # 返回云端链接和 ID，不再返回本地路径
        return image_url, public_id

    except Exception as e:
        # 如果上传失败，打印错误并抛出异常，方便调试
        print(f"Cloudinary Upload Error: {str(e)}")
        raise e