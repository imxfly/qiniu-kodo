Date.prototype.format = function (format) {
  let date = {
    "M+": this.getMonth() + 1,
    "d+": this.getDate(),
    "h+": this.getHours(),
    "m+": this.getMinutes(),
    "s+": this.getSeconds(),
    "q+": Math.floor((this.getMonth() + 3) / 3),
    "S+": this.getMilliseconds()
  };
  if (/(y+)/i.test(format)) {
    format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (let k in date) {
    if (new RegExp("(" + k + ")").test(format)) {
      format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
    }
  }
  return format;
}

function renderFiles(id) {
  document.getElementsByClassName('loader-wrap')[0].style.display = 'flex';
  let html = '';
  const curKey = getDefaultKey();
  if (id <= 0) {
    id = curKey.id;
  }
  let data = window.localStorage.getItem('kodo');
  data = data ? JSON.parse(data) : [];
  let template = document.getElementById('image-item-template').innerHTML;
  for (let i = data.length - 1; i >= 0; i--) {
    if (id != data[i].key_id) {
      continue;
    }
    let timestamp = data[i].date;
    let src = data[i].url;
    let d = new Date(timestamp);
    if (!src.startsWith('http')) {
      continue;
    }
    html += template
      .replace(/{{date}}/g, d.format('yyyy-MM-dd h:m'))
      .replace(/{{timestamp}}/g, timestamp)
      .replace(/{{imgsrc}}/g, src);
  }
  document.getElementsByClassName('files')[0].innerHTML = html;
  setTimeout(() => {
    document.getElementsByClassName('loader-wrap')[0].style.display = 'none';
  }, 500);
}

function renderKeys() {
  let html = '';
  let data = window.localStorage.getItem('kodo_keys');
  data = data ? JSON.parse(data) : [];
  let template = document.getElementById('key-item-template').innerHTML;
  for (let i = data.length - 1; i >= 0; i--) {
    let region = '无';
    switch (data[i].region) {
      case 'z0':
        region = '华东';
        break;
      case 'z1':
        region = '华北';
        break;
      case 'z2':
        region = '华南';
        break;
      case 'na0':
        region = '北美';
        break;
      case 'as0':
        region = '东南亚';
        break;
      default:
        break;
    }
    html += template
      .replace(/{{region}}/g, region)
      .replace(/{{bucket}}/g, data[i].bucket)
      .replace(/{{domain}}/g, data[i].domain)
      .replace(/{{isDefault}}/g, data[i].is_default ? 'inline-block' : 'none')
      .replace(/{{isNotDefault}}/g, data[i].is_default ? 'none' : 'inline-block')
      .replace(/{{id}}/g, data[i].id);
  }
  document.getElementById('key-tbody').innerHTML = html;

  // 添加点击事件：编辑密钥
  const editKeyNodes = document.getElementsByClassName('edit-key');
  for (let i = 0; i < editKeyNodes.length; i++) {
    editKeyNodes[i].addEventListener('click', () => {
      const id = editKeyNodes[i].getAttribute('data-id');
      const key = getKey(id);

      const regionRadios = document.getElementsByClassName('edit-key-region');
      for (let i = 0; i < regionRadios.length; i++) {
        if (regionRadios[i].value === key.region) {
          regionRadios[i].checked = true;
          break;
        }
      }

      document.getElementById('edit-key-ak').value = key.ak;
      document.getElementById('edit-key-sk').value = key.sk;
      document.getElementById('edit-key-bucket').value = key.bucket;
      document.getElementById('edit-key-savekey').value = key.savekey;
      document.getElementById('edit-key-domain').value = key.domain;
      document.getElementById('edit-key').setAttribute('data-id', key.id);
      document.getElementById('edit-key-dialog').style.display = 'flex';
    });
  }

  // 设为默认
  const setKeyNodes = document.getElementsByClassName('set-key');
  for (let i = 0; i < setKeyNodes.length; i++) {
    setKeyNodes[i].addEventListener('click', () => {
      if (window.confirm("确定要将该密钥设为默认密钥吗？")) {
        setKey(setKeyNodes[i].getAttribute('data-id'));
        renderKeys();
      }
    });
  }

  // 查看历史
  const vieHistoryNodes = document.getElementsByClassName('view-history');
  for (let i = 0; i < vieHistoryNodes.length; i++) {
    vieHistoryNodes[i].addEventListener('click', () => {
      const id = vieHistoryNodes[i].getAttribute('data-id');
      const bucket = vieHistoryNodes[i].getAttribute('data-bucket');
      document.getElementById('btn-batch-delete').setAttribute('data-id', id);
      document.getElementById('cur-key-name').innerText = bucket;
      renderFiles(id);
    });
  }

  // 删除密钥
  const delKeyNodes = document.getElementsByClassName('del-key');
  for (let i = 0; i < delKeyNodes.length; i++) {
    delKeyNodes[i].addEventListener('click', () => {
      if (window.confirm("确定要删除该密钥吗？")) {
        delKey(delKeyNodes[i].getAttribute('data-id'));
        renderKeys();
      }
    });
  }
}

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

function removeItem(timestamp) {
  let data = window.localStorage.getItem('kodo');
  data = data ? JSON.parse(data) : [];
  for (let i = 0; i < data.length; i++) {
    if (timestamp == data[i].date) {
      data.splice(i, 1);
      window.localStorage.setItem('kodo', JSON.stringify(data));
      return;
    }
  }
}

function removeItems(id) {
  let data = window.localStorage.getItem('kodo');
  data = data ? JSON.parse(data) : [];
  let result = [];
  for (let i = 0; i < data.length; i++) {
    if (id != data[i].key_id) {
      result.push(data[i]);
    }
  }
  window.localStorage.setItem('kodo', JSON.stringify(result));
}

function addNewKey(key) {
  let data = window.localStorage.getItem('kodo_keys');
  data = data ? JSON.parse(data) : [];

  key.id = data.length + 1;
  key.is_default = data.length == 0 ? true : false;
  data.push(key);
  window.localStorage.setItem('kodo_keys', JSON.stringify(data));
}

function updateKey(key) {
  let data = window.localStorage.getItem('kodo_keys');
  data = data ? JSON.parse(data) : [];

  for (let i = 0; i < data.length; i++) {
    if (data[i].id == key.id) {
      key.is_default = data[i].is_default;
      data[i] = key;
    }
  }

  window.localStorage.setItem('kodo_keys', JSON.stringify(data));
}

function getKey(id) {
  let data = window.localStorage.getItem('kodo_keys');
  data = data ? JSON.parse(data) : [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].id == id) {
      return data[i];
    }
  }
}

function setKey(id) {
  let data = window.localStorage.getItem('kodo_keys');
  data = data ? JSON.parse(data) : [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].id == id) {
      data[i].is_default = true;
    } else {
      data[i].is_default = false;
    }
  }
  window.localStorage.setItem('kodo_keys', JSON.stringify(data));
}

function delKey(id) {
  let data = window.localStorage.getItem('kodo_keys');
  data = data ? JSON.parse(data) : [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].id == id) {
      data.splice(i, 1);
      window.localStorage.setItem('kodo_keys', JSON.stringify(data));
      return;
    }
  }
}

function checkKey(key) {
  if (key.ak.length < 1) {
    alert("Access Key 不能为空");
    return false;
  }
  if (key.sk.length < 1) {
    alert("Secret Key 不能为空");
    return false;
  }
  if (key.bucket.length < 1) {
    alert("存储空间名称不能为空");
    return false;
  }
  if (!key.domain.startsWith("http")) {
    alert("存储空间绑定域名必须以http/https开头");
    return false;
  }

  return true;
}

window.onload = () => {
  renderFiles(0);
  renderKeys();

  const curKey = getDefaultKey();
  document.getElementById('btn-batch-delete').setAttribute('data-id', curKey.id);
  document.getElementById('cur-key-name').innerText = curKey.bucket;
  document.getElementById('version').innerText = chrome.runtime.getManifest().version;

  document.getElementsByClassName('donate')[0].addEventListener('click', () => {
    document.getElementById('donate-dialog').style.display = 'flex';
  })

  document.getElementById('donate-dialog-body').addEventListener('click', (e) => {
    e.stopPropagation();
  })

  document.getElementById('donate-dialog').addEventListener('click', (e) => {
    document.getElementById('donate-dialog').style.display = 'none';
  });

  const fileNodes = document.getElementsByClassName('file-item');
  for (let i = 0; i < fileNodes.length; i++) {
    fileNodes[i].addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (window.confirm("确定要在浏览器本地删除该文件吗？")) {
        fileNodes[i].style.display = 'none';
        removeItem(fileNodes[i].getAttribute('data-date'));
      }
    });
  }

  // 新增密钥弹窗
  document.getElementById('btn-create').addEventListener('click', () => {
    document.getElementById('add-key-dialog').style.display = 'flex';
  })

  document.getElementById('add-key-dialog-body').addEventListener('click', (e) => {
    e.stopPropagation();
  })

  document.getElementById('add-key-dialog').addEventListener('click', () => {
    document.getElementById('add-key-dialog').style.display = 'none';
  })

  // 新增密钥
  document.getElementById('create-key').addEventListener('click', () => {
    const regionRadios = document.getElementsByClassName('add-key-region');
    let regionVal;
    for (let i = 0; i < regionRadios.length; i++) {
      if (regionRadios[i].checked) {
        regionVal = regionRadios[i].value;
        break;
      }
    }
    let key = {
      ak: document.getElementById('add-key-ak').value,
      sk: document.getElementById('add-key-sk').value,
      bucket: document.getElementById('add-key-bucket').value,
      savekey: document.getElementById('add-key-savekey').value,
      domain: document.getElementById('add-key-domain').value,
      region: regionVal
    };
    if (!checkKey(key)) {
      return false;
    }
    addNewKey(key);
    document.getElementById('add-key-dialog').style.display = 'none';
    renderKeys();
  });

  document.getElementById('edit-key-body').addEventListener('click', (e) => {
    e.stopPropagation();
  })

  document.getElementById('edit-key-dialog').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('edit-key-dialog').style.display = 'none';
  });

  document.getElementById('edit-key').addEventListener('click', (e) => {
    e.preventDefault();
    const regionRadios = document.getElementsByClassName('edit-key-region');
    let regionVal;
    for (let i = 0; i < regionRadios.length; i++) {
      if (regionRadios[i].checked) {
        regionVal = regionRadios[i].value;
        break;
      }
    }
    let key = {
      id: document.getElementById('edit-key').getAttribute('data-id'),
      ak: document.getElementById('edit-key-ak').value,
      sk: document.getElementById('edit-key-sk').value,
      bucket: document.getElementById('edit-key-bucket').value,
      savekey: document.getElementById('edit-key-savekey').value,
      domain: document.getElementById('edit-key-domain').value,
      region: regionVal
    };

    if (!checkKey(key)) {
      return false;
    }
    updateKey(key);
    document.getElementById('edit-key-dialog').style.display = 'none';
    renderKeys();
  });

  // 一键清空当前选中上传历史
  document.getElementById('btn-batch-delete').addEventListener('click', (e) => {
    e.preventDefault();
    if (window.confirm("确定要清空当前空间的上传历史吗？")) {
      removeItems(document.getElementById('btn-batch-delete').getAttribute('data-id'));
      renderFiles(document.getElementById('btn-batch-delete').getAttribute('data-id'));
    }
  });
};
