let storageData = window.localStorage.kodo ? JSON.parse(window.localStorage.kodo) : [];
let keys = window.localStorage.kodo_keys ? JSON.parse(window.localStorage.kodo_keys) : [];

let qiniuAK = '';
let qiniuSK = '';
let qiniuRegion = '';
let cdnDomain = ''
let qiniuBucket = '';
let qiniuSavekey = '';
for (let i = 0; i < keys.length; i++) {
  if (keys[i].is_default) {
    qiniuAK = keys[i].ak;
    qiniuSK = keys[i].sk;
    qiniuSavekey = keys[i].savekey;
    qiniuBucket = keys[i].bucket;
    cdnDomain = keys[i].domain;
    if (keys[i].region == 'z0') {
      qiniuRegion = 'http://upload.qiniup.com';
    } else if (keys[i].region == 'z1') {
      qiniuRegion = 'http://upload-z1.qiniup.com';
    } else if (keys[i].region == 'z2') {
      qiniuRegion = 'http://upload-z2.qiniup.com';
    } else if (keys[i].region == 'na0') {
      qiniuRegion = 'http://upload-na0.qiniup.com';
    } else if (keys[i].region == 'as0') {
      qiniuRegion = 'http://upload-as0.qiniup.com';
    }
  }
}

let qiniuPutPolicy = {
  scope: qiniuBucket,
  deadline: parseInt((new Date()).getTime() / 1000) + 3600,
  saveKey: qiniuSavekey
}

var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
var base64DecodeChars = new Array(
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1,
  -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1,
  -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
  51, -1, -1, -1, -1, -1
);

let kodo = {
  saveUrlToLocal: (url) => {
    storageData.push({
      date: (new Date()).getTime(),
      url: url
    });
    window.localStorage.kodo = JSON.stringify(storageData);
  },

  renderFile: (url) => {
    str = '\
          <div class="file-item">\
            <input class="file-url" value="'+ url + '"/>\
            <img class="file-preview" src="'+ url + '" alt="">\
          </div>';
    $('.files').append(str);
  },

  uploadFile: (files) => {
    $(".loader-wrap").css('display', 'flex');
    for (let i = 0; i < files.length; i++) {
      let formData = new FormData();
      formData.append('token', kodo.genUpToken(qiniuAK, qiniuSK, qiniuPutPolicy))
      formData.append('file', files[i])

      $.ajax({
        type: "POST",
        cache: false,
        processData: false,
        contentType: false,
        url: qiniuRegion,
        data: formData,
        complete: () => {
          if (i == files.length - 1) {
            $(".loader-wrap").fadeOut("fast");
          }
        },
        success: (data) => {
          let url = cdnDomain + '/' + data.key;
          kodo.saveUrlToLocal(url);
          kodo.renderFile(url);
        },
        error: (err) => {
          console.log(err)
        }
      });
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

  utf8to16: (str) => {
    var out, i, len, c;
    var char2, char3;
    out = "";
    len = str.length;
    i = 0;
    while (i < len) {
      c = str.charCodeAt(i++);
      switch (c >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          // 0xxxxxxx
          out += str.charAt(i - 1);
          break;
        case 12:
        case 13:
          // 110x xxxx 10xx xxxx
          char2 = str.charCodeAt(i++);
          out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
          break;
        case 14:
          // 1110 xxxx 10xx xxxx 10xx xxxx
          char2 = str.charCodeAt(i++);
          char3 = str.charCodeAt(i++);
          out += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0));
          break;
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

  base64decode: (str) => {
    var c1, c2, c3, c4;
    var i, len, out;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {
      /* c1 */
      do {
        c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
      } while (i < len && c1 == -1);
      if (c1 == -1) break;
      /* c2 */
      do {
        c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
      } while (i < len && c2 == -1);
      if (c2 == -1) break;
      out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
      /* c3 */
      do {
        c3 = str.charCodeAt(i++) & 0xff;
        if (c3 == 61) return out;
        c3 = base64DecodeChars[c3];
      } while (i < len && c3 == -1);
      if (c3 == -1) break;
      out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));
      /* c4 */
      do {
        c4 = str.charCodeAt(i++) & 0xff;
        if (c4 == 61) return out;
        c4 = base64DecodeChars[c4];
      } while (i < len && c4 == -1);
      if (c4 == -1) break;
      out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
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

$(() => {
  if (keys.length < 1) {
    alert('请先设置密钥');
    chrome.tabs.create({ url: chrome.extension.getURL('option.html') });
  }

  // 前往 option.html
  $("#btn-option").on('click', () => {
    chrome.tabs.create({ url: chrome.extension.getURL('option.html') });
  });

  // 点击上传区域触发上传按钮
  $('.placeholder').click((e) => {
    e.preventDefault();
    $('input[name=file]').click();
  })

  // 监听上传按钮变化
  $('input[name=file]').change((e) => {
    e.preventDefault();
    var files = document.getElementById('input').files;
    kodo.uploadFile(files);
  });

  $(".files").on("click", ".file-preview", function () {
    event.preventDefault();
    let input = $(this).prev();
    $(input[0]).select();
    document.execCommand('copy');
    kodo.showMessage("提示", "复制成功");
  });

  // kodo.renderFile("http://q8pq7hr77.bkt.clouddn.com/FhMqA0CzFK4c5xhlOds2Tw2HJ8Zj")
  // kodo.renderFile("http://q8pq7hr77.bkt.clouddn.com/FhMqA0CzFK4c5xhlOds2Tw2HJ8Zj")

  // 监听拖拽图片事件
  // $("body").on('drop', (e) => {
  //   e.preventDefault(); // 取消默认浏览器拖拽效果
  //   kodo.getImageFile(e.originalEvent.dataTransfer.files);
  // });
});
