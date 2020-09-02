var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
var base64DecodeChars = new Array(
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1,
  -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1,
  -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
  51, -1, -1, -1, -1, -1
);

let kodo = {
  getDefaultKey: () => {
    let keys = window.localStorage.kodo_keys ? JSON.parse(window.localStorage.kodo_keys) : [];
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].is_default) {
        if (keys[i].region === 'z0') {
          keys[i].region = 'http://upload.qiniup.com';
        } else {
          keys[i].region = 'http://upload-' + keys[i].region + '.qiniup.com';
        }
        return keys[i];
      }
    }
    return [];
  },
  saveUrlToLocal: (url) => {
    let storageData = window.localStorage.kodo ? JSON.parse(window.localStorage.kodo) : []
    let defaultKey = kodo.getDefaultKey();
    storageData.push({
      key_id: parseInt(defaultKey.id),
      date: (new Date()).getTime(),
      url: url
    });
    window.localStorage.kodo = JSON.stringify(storageData);
  },

  renderFile: (url) => {
    let div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = '<input class="file-url" value="' + url + '"/>\
      <img class="file-preview" src="'+ url + '" alt="">';
    div.addEventListener('click', () => {
      let input = div.firstChild;
      input.select();
      document.execCommand('copy');
      kodo.showMessage("提示", "复制成功");
    });
    document.getElementsByClassName('files')[0].appendChild(div);
  },

  uploadFile: (files) => {
    document.getElementsByClassName('loader-wrap')[0].style.display = 'flex';
    let defaultKey = kodo.getDefaultKey();
    let qiniuPutPolicy = {
      scope: defaultKey.bucket,
      deadline: parseInt((new Date()).getTime() / 1000) + 3600,
      saveKey: defaultKey.savekey
    }
    for (let i = 0; i < files.length; i++) {
      let formData = new FormData();
      formData.append('token', kodo.genUpToken(defaultKey.ak, defaultKey.sk, qiniuPutPolicy))
      formData.append('file', files[i])

      const xhr = new XMLHttpRequest();
      xhr.open('POST', defaultKey.region, true);
      xhr.send(formData);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 400)) {
            const data = JSON.parse(xhr.responseText)
            const url = defaultKey.domain + '/' + data.key;
            kodo.saveUrlToLocal(url);
            kodo.renderFile(url);
          } else {
            console.log(err)
          }
          document.getElementsByClassName('loader-wrap')[0].style.display = 'none';
        }
      };
    }
  },

  utf16to8: (str) => {
    var out, i, len, c;
    out = "";
    len = str.length;
    for (i = 0; i < len; i++) {
      c = str.charCodeAt(i);
      if ((c >= 0x0001) && (c <= 0x007F)) {
        out += str.charAt(i);
      } else if (c > 0x07FF) {
        out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
        out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
        out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
      } else {
        out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
        out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
      }
    }
    return out;
  },

  base64encode: (str) => {
    var out, i, len;
    var c1, c2, c3;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {
      c1 = str.charCodeAt(i++) & 0xff;
      if (i == len) {
        out += base64EncodeChars.charAt(c1 >> 2);
        out += base64EncodeChars.charAt((c1 & 0x3) << 4);
        out += "==";
        break;
      }
      c2 = str.charCodeAt(i++);
      if (i == len) {
        out += base64EncodeChars.charAt(c1 >> 2);
        out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += base64EncodeChars.charAt((c2 & 0xF) << 2);
        out += "=";
        break;
      }
      c3 = str.charCodeAt(i++);
      out += base64EncodeChars.charAt(c1 >> 2);
      out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
      out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
      out += base64EncodeChars.charAt(c3 & 0x3F);
    }
    return out;
  },

  safe64: (base64) => {
    base64 = base64.replace(/\+/g, "-");
    base64 = base64.replace(/\//g, "_");
    return base64;
  },

  genUpToken: (accessKey, secretKey, putPolicy) => {
    var put_policy = JSON.stringify(putPolicy);

    var encoded = kodo.base64encode(kodo.utf16to8(put_policy));

    var hash = CryptoJS.HmacSHA1(encoded, secretKey);
    var encoded_signed = hash.toString(CryptoJS.enc.Base64);

    var upload_token = accessKey + ":" + kodo.safe64(encoded_signed) + ":" + encoded;

    return upload_token;
  },

  showMessage: (title, content) => {
    new Notification(title, {
      lang: "utf-8",
      silent: true,
      icon: "images/logo48.png",
      body: content
    });
  }
};

function getDefaultKey() {
  let data = window.localStorage.getItem('kodo_keys');
  data = data ? JSON.parse(data) : [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].is_default) {
      return data[i];
    }
  }

  return {
    id: 0,
    bucket: '无'
  }
}

window.onload = () => {
  if (!window.localStorage.kodo_keys) {
    alert('请先设置密钥');
    chrome.tabs.create({ url: chrome.extension.getURL('option.html') });
  }

  const kodoBucket = getDefaultKey().bucket;
  document.getElementById('bucketName').textContent = kodoBucket;

  // 前往 option.html
  document.getElementById('btn-option').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.extension.getURL('option.html') });
  })

  // 点击上传区域触发上传按钮
  document.getElementsByClassName('placeholder')[0].addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('input').click();
  })

  // 监听上传按钮变化
  document.getElementById('input').addEventListener('change', (e) => {
    e.preventDefault();
    var files = document.getElementById('input').files;
    kodo.uploadFile(files);
  });

  let els = document.getElementsByClassName('file-item');
  for (let i = 0; i < els.length; i++) {
    els[i].addEventListener('click', () => {
      let input = els[i].firstChild;
      input.select();
      document.execCommand('copy');
      kodo.showMessage("提示", "复制成功");
    });
  }

  // 监听拖拽图片事件
  document.body.addEventListener('dragenter', (e) => {
    e.preventDefault();
  }, false);
  document.body.addEventListener('dragleave', (e) => {
    e.preventDefault();
  }, false);
  document.body.addEventListener("dragover", (e) => {
    e.preventDefault();
  }, false);
  document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    let fileList = e.dataTransfer.files;
    // 检测是否是拖拽文件到页面的操作
    if (fileList.length == 0) {
      return;
    }
    // 检测文件是不是图片
    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i].type.indexOf("image") === -1) {
        continue;
      }
      kodo.uploadFile([fileList[i]]);
    }
  }, false);

  // 监听复制图片事件
  document.addEventListener('paste', function (event) {
    let items = event.clipboardData && event.clipboardData.items;
    if (items && items.length) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          kodo.uploadFile([items[i].getAsFile()]);
        }
      }
    }
  });
};
