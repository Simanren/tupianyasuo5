// 获取DOM元素
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const originalPreview = document.getElementById('originalPreview');
const compressedPreview = document.getElementById('compressedPreview');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const downloadBtn = document.getElementById('downloadBtn');
const formatSelect = document.getElementById('formatSelect');

// 当前处理的图片数据
let currentFile = null;
let currentBlob = null;  // 存储当前压缩后的图片blob

// 初始化事件监听
function initializeEvents() {
    // 点击上传区域触发文件选择
    dropZone.addEventListener('click', () => fileInput.click());

    // 文件拖拽事件
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#0071e3';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#e0e0e0';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#e0e0e0';
        
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // 文件选择事件
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    // 质量滑块变化事件
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
        if (currentFile) {
            compressImage(currentFile, e.target.value / 100);
        }
    });

    // 格式选择变化事件
    formatSelect.addEventListener('change', () => {
        if (currentFile) {
            compressImage(currentFile, qualitySlider.value / 100);
        }
    });

    // 下载按钮点击事件
    downloadBtn.addEventListener('click', downloadCompressedImage);
}

// 处理选择的文件
function handleFile(file) {
    // 检查文件类型
    if (!file.type.match(/image\/(jpeg|png)/i)) {
        alert('请上传 JPG 或 PNG 格式的图片！');
        return;
    }

    currentFile = file;
    
    // 显示原图大小
    originalSize.textContent = formatFileSize(file.size);
    
    // 预览原图
    const reader = new FileReader();
    reader.onload = (e) => {
        originalPreview.src = e.target.result;
        // 使用当前滑块值压缩图片
        compressImage(file, qualitySlider.value / 100);
    };
    reader.readAsDataURL(file);

    // 显示预览区域
    previewContainer.style.display = 'block';
}

// 压缩图片
function compressImage(file, quality) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // 创建canvas
            const canvas = document.createElement('canvas');
            
            // 获取输出格式
            const outputFormat = formatSelect.value === 'original' ? file.type : formatSelect.value;
            
            // 计算压缩后的尺寸
            let width = img.width;
            let height = img.height;
            
            // 如果是PNG格式，使用尺寸调整来实现压缩
            if (outputFormat === 'image/png') {
                const scale = 0.1 + (quality * 0.9); // 将quality(0-1)映射到0.1-1.0
                width = Math.floor(img.width * scale);
                height = Math.floor(img.height * scale);
            }
            
            // 设置canvas尺寸
            canvas.width = width;
            canvas.height = height;

            // 绘制图片
            const ctx = canvas.getContext('2d');
            
            // 使用双线性插值算法来优化缩放质量
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.drawImage(img, 0, 0, width, height);

            // 压缩图片
            canvas.toBlob(
                (blob) => {
                    // 存储当前blob
                    currentBlob = blob;
                    // 更新压缩后预览
                    compressedPreview.src = URL.createObjectURL(blob);
                    // 更新压缩后大小
                    compressedSize.textContent = formatFileSize(blob.size);
                    
                    // 显示图片尺寸信息
                    const originalDimensions = document.getElementById('originalDimensions');
                    const compressedDimensions = document.getElementById('compressedDimensions');
                    if (originalDimensions && compressedDimensions) {
                        originalDimensions.textContent = `${img.width} x ${img.height}`;
                        compressedDimensions.textContent = `${width} x ${height}`;
                    }
                },
                outputFormat,
                outputFormat === 'image/png' ? undefined : quality
            );
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 下载压缩后的图片
function downloadCompressedImage() {
    if (!currentBlob) return;

    const link = document.createElement('a');
    const outputFormat = formatSelect.value === 'original' ? currentFile.type : formatSelect.value;
    const extension = outputFormat.split('/')[1];
    const fileName = currentFile.name.replace(/\.[^/.]+$/, '') + '_compressed.' + extension;
    
    link.download = fileName;
    link.href = URL.createObjectURL(currentBlob);
    link.click();
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 初始化应用
initializeEvents(); 