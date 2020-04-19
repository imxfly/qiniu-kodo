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
  $(".loader-wrap").css('display', 'flex');
  let html = '';
  const curKey = getDefaultKey();
  if (id <= 0) {
    id = curKey.id;
  }
  let data = window.localStorage.getItem('kodo');
  data = data ? JSON.parse(data) : [];
  let template = $('#image-item-template').html();
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
  $('.files').html(html);
  setTimeout(() => {
    $(".loader-wrap").fadeOut();
  }, 500);
}

function renderKeys() {
  let html = '';
  let data = window.localStorage.getItem('kodo_keys');
  data = data ? JSON.parse(data) : [];
  let template = $('#key-item-template').html();
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
  $('#key-tbody').html(html);
}

function getDefaultKey() {
  let data = window.localStorage.getItem('kodo_keys');
  data = data ? JSON.parse(data) : [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].is_default) {
      return data[i];
    }
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

$(document).ready(() => {
  renderFiles(0);
  renderKeys();

  const curKey = getDefaultKey();
  $('#btn-batch-delete').attr('data-id', curKey.id);
  $('#cur-key-name').text(curKey.bucket);

  $(".current_version").text(chrome.runtime.getManifest().version);

  $('.donate').on('click', () => {
    $('#donate-dialog').css('display', 'flex');
  });

  $('#donate-dialog .body').on('click', (e) => {
    e.stopPropagation();
  });

  $('#donate-dialog').on('click', () => {
    $('#donate-dialog').hide();
  });

  $('.file-preview').bind('contextmenu', function (e) {
    e.preventDefault();
    if (window.confirm("确定要在浏览器本地删除该文件吗？")) {
      $(this).parent().fadeOut("fast");
      removeItem($(this).attr("data-date"));
    }
  });

  // 新增密钥弹窗
  $('#btn-create').on('click', () => {
    $('#add-key-dialog').css('display', 'flex');
  });

  $('#add-key-dialog .body').on('click', (e) => {
    e.stopPropagation();
  });

  $('#add-key-dialog').on('click', () => {
    $('#add-key-dialog').hide();
  });

  // 新增密钥
  $('#create-key').on('click', () => {
    let key = {
      ak: $('input[name=ak]').val(),
      sk: $('input[name=sk]').val(),
      bucket: $('input[name=bucket]').val(),
      savekey: $('input[name=savekey]').val(),
      domain: $('input[name=domain]').val(),
      region: $('input[name=region]:checked').val()
    };
    if (!checkKey(key)) {
      return false;
    }
    addNewKey(key);
    $('#add-key-dialog').hide();
    renderKeys();
  });

  // 编辑密钥
  $('#key-table').on('click', '.edit-key', function () {
    const id = $(this).attr('data-id');
    const key = getKey(id);
    $('#edit-key-ak').val(key.ak);
    $('#edit-key-sk').val(key.sk);
    $('#edit-key-bucket').val(key.bucket);
    $('input:radio[name=edit-region]').filter('[value=' + key.region + ']').prop('checked', true);
    $('#edit-key-savekey').val(key.savekey);
    $('#edit-key-domain').val(key.domain);
    $('#edit-key').attr('data-id', key.id);
    $('#edit-key-dialog').css('display', 'flex');
  });

  $('#edit-key-dialog .body').on('click', (e) => {
    e.stopPropagation();
  });

  $('#edit-key-dialog').on('click', () => {
    $('#edit-key-dialog').hide();
  });

  $('#edit-key').on('click', () => {
    let key = {
      id: $('#edit-key').attr('data-id'),
      ak: $('#edit-key-ak').val(),
      sk: $('#edit-key-sk').val(),
      bucket: $('#edit-key-bucket').val(),
      savekey: $('#edit-key-savekey').val(),
      domain: $('#edit-key-domain').val(),
      region: $('input[name=edit-region]:checked').val()
    };
    if (!checkKey(key)) {
      return false;
    }
    updateKey(key);
    $('#edit-key-dialog').hide();
    renderKeys();
  });

  // 设为默认
  $('#key-table').on('click', '.set-key', function () {
    if (window.confirm("确定要将该密钥设为默认密钥吗？")) {
      setKey($(this).attr('data-id'));
      renderKeys();
    }
  });

  // 查看历史
  $('#key-table').on('click', '.view-history', function () {
    const id = $(this).attr('data-id');
    const bucket = $(this).attr('data-bucket');
    $('#btn-batch-delete').attr('data-id', id);
    $('#cur-key-name').text(bucket);
    renderFiles(id);
  });

  // 删除密钥
  $('#key-table').on('click', '.del-key', function () {
    if (window.confirm("确定要删除该密钥吗？")) {
      delKey($(this).attr('data-id'));
      $(this).parent().parent().remove();
    }
  });

  // 一键清空当前选中上传历史
  $('#btn-batch-delete').on('click', function () {
    if (window.confirm("确定要清空当前空间的上传历史吗？")) {
      removeItems($(this).attr('data-id'));
      renderFiles($(this).attr('data-id'));
    }
  });
});
