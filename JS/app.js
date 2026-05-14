const uploadBtn = document.getElementById('uploadBtn');
const processBtn = document.getElementById('processBtn');
const resultContainer = document.getElementById('resultContainer');

let uploadedImage = null;
let blockRows = 16;
let blockColumns = 16;

uploadBtn.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  input.onchange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        // Use the original data URL without any compression
        uploadedImage = e.target.result;

        // Show the image as uploaded (no resize)
        resultContainer.innerHTML = `<img src="${uploadedImage}" alt="Uploaded Picture" style="max-width: 100%;">`;
      };

      reader.readAsDataURL(file);
    }
  };
  input.click();
});

processBtn.addEventListener('click', async () => {
  //图片未上传则退出
  if (!uploadedImage) {
    alert('Please upload a picture first.\n请先上传图片！');
    return;
  }

  //图片已上传，执行以下逻辑; uploadedImage != null 的逻辑执行
  const img = new Image();

  img.onload = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(img.width / blockColumns) * blockColumns;
    canvas.height = Math.ceil(img.height / blockRows) * blockRows;

    const ctx = canvas.getContext('2d');
    // 填充白色像素
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 弹窗要求用户输入密码，将密码作为种子的生成依据
    let seed; // 声明种子变量，需要在try以外作用域
    try {
      const password = prompt("请输入密码：");
      seed = await hashStringToHex(password || "");
      console.log("成功结果:", seed);
    } catch (e) {
      console.log("浏览器不支持！");
      return 0;
    }
    const blockIndex = generateVectorsFromSeed(seed, blockRows, blockColumns);

    const blockWidth = canvas.width / blockColumns;   // 每个块的像素宽度
    const blockHeight = canvas.height / blockRows;    // 每个块的像素高度

    // 创建新的像素数组并填充白色（255,255,255,255）
    const newData = new Uint8ClampedArray(data.length);
    newData.fill(255);

    // 遍历所有块，按照 blockIndex 的映射复制像素
    for (let k = 0; k < blockRows * blockColumns; k++) {
      // 源块在原图中的行列（0‑based）
      const srcRow = Math.floor(k / blockColumns);
      const srcCol = k % blockColumns;

      // 目标位置：blockIndex[k] 给出的是 1‑based 的行列，减1得到 0‑based
      const targetRow = blockIndex[k].x - 1;
      const targetCol = blockIndex[k].y - 1;

      // 复制该块内的所有像素
      for (let y = 0; y < blockHeight; y++) {
        for (let x = 0; x < blockWidth; x++) {
          const srcIdx = ((srcRow * blockHeight + y) * canvas.width + (srcCol * blockWidth + x)) * 4;
          const dstIdx = ((targetRow * blockHeight + y) * canvas.width + (targetCol * blockWidth + x)) * 4;

          // 复制 RGBA 四个通道
          newData[dstIdx] = data[srcIdx];
          newData[dstIdx + 1] = data[srcIdx + 1];
          newData[dstIdx + 2] = data[srcIdx + 2];
          newData[dstIdx + 3] = data[srcIdx + 3];
        }
      }
    }

    // 用新数据替换原有像素
    imageData.data.set(newData);
    ctx.putImageData(imageData, 0, 0);

    const processedDataUrl = canvas.toDataURL();
    resultContainer.innerHTML =
      `<img src="${processedDataUrl}" style="max-width:100%">`;
  };

  img.src = uploadedImage;
});


restoreBtn.addEventListener('click', async () => {
  //图片未上传则退出
  if (!uploadedImage) {
    alert('Please upload a picture first.\n请先上传图片！');
    return;
  }

  //图片已上传，执行以下逻辑; uploadedImage != null 的逻辑执行
  const img = new Image();

  img.onload = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(img.width / blockColumns) * blockColumns;
    canvas.height = Math.ceil(img.height / blockRows) * blockRows;

    const ctx = canvas.getContext('2d');
    // 填充白色像素
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 弹窗要求用户输入密码，将密码作为种子的生成依据
    let seed; // 声明种子变量，需要在try以外作用域
    try {
      const password = prompt("请输入密码：");
      seed = await hashStringToHex(password || "");
      console.log("成功结果:", seed);
    } catch (e) {
      console.log("浏览器不支持！");
      return 0;
    }
    const blockIndex = generateVectorsFromSeed(seed, blockRows, blockColumns);

    const blockWidth = canvas.width / blockColumns;   // 每个块的像素宽度
    const blockHeight = canvas.height / blockRows;    // 每个块的像素高度

    // 创建新的像素数组并填充白色（255,255,255,255）
    const newData = new Uint8ClampedArray(data.length);
    newData.fill(255);

    // 遍历所有块，按照 blockIndex 的映射复制像素（反转方向以实现还原）
    for (let k = 0; k < blockRows * blockColumns; k++) {
      // 源块在原图中的行列（0‑based）对应目标位置
      const dstRow = Math.floor(k / blockColumns);
      const dstCol = k % blockColumns;

      // 源位置：blockIndex[k] 给出的是 1‑based 的行列，减1得到 0‑based
      const srcRow = blockIndex[k].x - 1;
      const srcCol = blockIndex[k].y - 1;

      // 复制该块内的所有像素
      for (let y = 0; y < blockHeight; y++) {
        for (let x = 0; x < blockWidth; x++) {
          const srcIdx = ((srcRow * blockHeight + y) * canvas.width + (srcCol * blockWidth + x)) * 4;
          const dstIdx = ((dstRow * blockHeight + y) * canvas.width + (dstCol * blockWidth + x)) * 4;

          // 复制 RGBA 四个通道
          newData[dstIdx] = data[srcIdx];
          newData[dstIdx + 1] = data[srcIdx + 1];
          newData[dstIdx + 2] = data[srcIdx + 2];
          newData[dstIdx + 3] = data[srcIdx + 3];
        }
      }
    }

    // 用新数据替换原有像素
    imageData.data.set(newData);
    ctx.putImageData(imageData, 0, 0);

    const processedDataUrl = canvas.toDataURL();
    resultContainer.innerHTML =
      `<img src="${processedDataUrl}" style="max-width:100%">`;
  };

  img.src = uploadedImage;
});


/*
 使用浏览器原生 Web Crypto API 将文本转为 SHA-256 十六进制 hash
 */
async function hashStringToHex(text) {
  // 1. 检查 Web Crypto API 是否可用
  if (!window.crypto?.subtle) {
    throw new Error(
      '当前浏览器不支持 Web Crypto API（crypto.subtle），无法生成 SHA-256 hash'
    );
  }

  // 2. 文本 → Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // 3. 计算 SHA-256 hash（浏览器原生实现）
  const buffer = await window.crypto.subtle.digest('SHA-256', data);

  // 4. buffer → hex string
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}




// 基于256bit十六进制种子生成二维向量数组，无重复值
function generateVectorsFromSeed(hexSeed, Vectors1, Vectors2) {
  // 1. 将十六进制种子分割成32个字节（256位 = 32字节）
  const hexSeedLength = hexSeed.length // hexSeedLength = 64
  const bytes = [];
  for (let i = 0; i < hexSeedLength; i += 2) {
    bytes.push(parseInt(hexSeed.substring(i, i + 2), 16));
  }
  // 2. 用这些字节初始化一个伪随机数生成器（LCG）
  //    LCG公式: seed = (a * seed + c) % m
  //    这里使用标准参数: a=1664525, c=1013904223, m=2^32
  let seed = 0;
  for (let i = 0; i < bytes.length; i++) {
    seed = (seed * 2 + bytes[i]) >>> 0; // 无符号32位整数，i有32次循环（bytes长度32），每次移动一位，让gyte的所有信息影响种子
    console.log(seed);
  }
  seed = seed || 1; // 避免种子为0导致全0序列

  // 生成所有可能的唯一向量 (x,y)
  const allVectors = [];
  for (let x = 1; x <= Vectors1; x++) {
    for (let y = 1; y <= Vectors2; y++) {
      allVectors.push({ x, y });
    }
  }

  /*
  参数 a, c, m 的选择并不是固定的，它们可以根据具体应用需求进行调整。
  本实现中采用的是经典参数集合，这些参数在数值分析领域被广泛认可，能够提供较好的统计随机性和周期长度。
  特别地，m = 2^32 是为了便于在32位系统上高效运算，而 a 和 c 的取值则确保生成器达到最大可能周期（即周期长度为 m）。
  这也是所谓“最小标准生成器”的一种变体。若需要更高随机性或安全性，可替换为其他参数，例如使用更复杂的生成器如 Mersenne Twister 或加密安全的随机数生成器。
  但本代码作为演示用途，LCG 配合这些经典参数已足够产生伪随机序列。
  */
  const a = 1664525;
  const c = 1013904223;
  const m = 4294967296; // 2^32

  // Fisher-Yates shuffle 使用随机数取余的模式，整数洗牌，不受浮点数精度影响，最后一张牌不用洗
  for (let i = allVectors.length - 1; i > 0; i--) {
    seed = (a * seed + c) % m
    const j = seed % i;
    [allVectors[i], allVectors[j]] = [allVectors[j], allVectors[i]];
  }
  return allVectors;
}

