import os
import uuid
from flask import current_app

# 允许的文件后缀
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'tif', 'jfif', 'heic'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_uploaded_file(file):
    """
    将文件保存到本地服务器磁盘
    """
    try:
        # 🔥🔥🔥 调试开始：打印原始信息 🔥🔥🔥
        raw_filename = file.filename
        print("\n" + "="*60)
        print(f"📂 [DEBUG] 收到上传文件对象")
        print(f"🏷️  原始文件名 (raw): '{raw_filename}'")
        print(f"📝 文件名类型: {type(raw_filename)}")
        
        if not raw_filename:
            print("❌ [ERROR] 文件名为空 (None 或 空字符串)")
            raise ValueError("上传的文件没有文件名")

        # 检查是否有后缀
        if '.' not in raw_filename:
            print(f"❌ [ERROR] 文件名中找不到 '.' 符号")
            raise ValueError(f"文件名格式错误，缺少后缀: '{raw_filename}'")

        # 提取后缀
        ext = os.path.splitext(raw_filename)[1].lower()
        print(f"✂️  提取到的后缀 (含点): '{ext}'")
        print(f"🔤 提取到的后缀 (去点): '{ext[1:] if ext.startswith('.') else ext}'")
        print(f"✅ 允许的列表: {ALLOWED_EXTENSIONS}")
        
        # 再次检查
        if ext not in [f".{e}" for e in ALLOWED_EXTENSIONS]:
             # 注意：你的代码逻辑是 ext (带点) 对比 ALLOWED_EXTENSIONS (不带点) ???
             # 让我们看看你的原代码逻辑：
             # ext = os.path.splitext(file.filename)[1].lower() -> 结果是 '.jpg'
             # if ext not in ALLOWED_EXTENSIONS: -> ALLOWED_EXTENSIONS 是 {'jpg', ...}
             # ❌ 这里有个巨大的 BUG！ '.jpg' != 'jpg'
             pass 
        
        # 🔥🔥🔥 发现潜在 BUG 🔥🔥🔥
        # os.path.splitext 返回的后缀是带点的，例如 '.jpg'
        # 但你的 ALLOWED_EXTENSIONS 集合里是不带点的，例如 'jpg'
        # 所以 '.jpg' in {'jpg'} 永远是 False!!!
        
        # 修正逻辑：去掉点再对比
        clean_ext = ext.lstrip('.').lower()
        print(f"🧹 清洗后的后缀 (用于对比): '{clean_ext}'")

        if clean_ext not in ALLOWED_EXTENSIONS:
            print(f"🚫 [拦截] 后缀 '{clean_ext}' 不在允许列表中！")
            raise ValueError(f"不允许的文件类型: '{clean_ext}'")
        
        print("✅ [通过] 文件类型验证成功")
        print("="*60 + "\n")
        # 🔥🔥🔥 调试结束 🔥🔥🔥

        # 1. 获取上传目录
        upload_folder = current_app.config.get('FILES_FOLDER', 'uploads')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        # 2. 生成唯一文件名 (使用清洗后的 clean_ext)
        filename = f"{uuid.uuid4().hex}.{clean_ext}"
        file_path = os.path.join(upload_folder, filename)

        # 3. 保存
        file.save(file_path)
        current_app.logger.info(f"文件成功保存: {file_path}")
        
        return filename, file_path

    except Exception as e:
        print(f"💥 [异常] 保存失败: {str(e)}")
        raise e