// ===== 通讯录逻辑 =====

// 获取所有AI联系人
function getContacts() {
    return JSON.parse(localStorage.getItem('ai-phone-contacts') || '[]');
}

// 保存联系人列表
function saveContacts(contacts) {
    localStorage.setItem('ai-phone-contacts', JSON.stringify(contacts));
}

// 添加新联系人
function addNewContact() {
    openContactEditor(null);
}

// 打开联系人编辑弹窗
function openContactEditor(contact) {
    var isEdit = !!contact;

    var html = '<div class="modal-overlay" id="contact-editor-modal" onclick="closeContactEditor()">';
    html += '<div class="contact-editor" onclick="event.stopPropagation()">';
    html += '<div class="ce-header"><span class="ce-title">' + (isEdit ? '编辑AI好友' : '添加AI好友') + '</span><span class="ce-close" onclick="closeContactEditor()">✕</span></div>';
    html += '<div class="ce-body">';

    // 头像
    html += '<div class="ce-avatar-row">';
    html += '<div class="ce-avatar" id="ce-avatar" onclick="chooseContactAvatar()">' + (contact && contact.avatar ? '<img src="' + contact.avatar + '">' : '👤') + '</div>';
    html += '<span class="ce-avatar-hint">点击设置头像</span>';
    html += '</div>';

    // 姓名
    html += '<div class="ce-field"><label>姓名</label><input type="text" id="ce-name" placeholder="AI的名字" value="' + (contact ? contact.name : '') + '"></div>';

    // 性别
    html += '<div class="ce-field"><label>性别</label><select id="ce-gender"><option value="女"' + (contact && contact.gender === '女' ? ' selected' : '') + '>女</option><option value="男"' + (contact && contact.gender === '男' ? ' selected' : '') + '>男</option><option value="其他"' + (contact && contact.gender === '其他' ? ' selected' : '') + '>其他</option></select></div>';

    // 生日
    html += '<div class="ce-field"><label>生日</label><input type="date" id="ce-birthday" value="' + (contact ? contact.birthday || '' : '') + '"></div>';

    // 人设
    html += '<div class="ce-field"><label>人设</label><textarea id="ce-persona" placeholder="描述这个AI的性格、背景、说话方式...">' + (contact ? contact.persona || '' : '') + '</textarea></div>';

    // 保存按钮
    html += '<button class="ce-save-btn" onclick="saveContact(\'' + (contact ? contact.id : '') + '\')">' + (isEdit ? '保存修改' : '添加好友') + '</button>';

    html += '</div></div></div>';

    // 插入到body
    var div = document.createElement('div');
    div.id = 'contact-editor-container';
    div.innerHTML = html;
    document.body.appendChild(div);
}

function closeContactEditor() {
    var container = document.getElementById('contact-editor-container');
    if (container) container.remove();
}

// 选择联系人头像
function chooseContactAvatar() {
    var html = '<div class="modal-overlay" id="ce-avatar-modal" onclick="closeCeAvatarModal()">';
    html += '<div class="modal-box" onclick="event.stopPropagation()">';
    html += '<h3>🖼️ 设置头像</h3>';
    html += '<label>图片URL</label><input type="text" id="ce-avatar-url" placeholder="输入图片链接">';
    html += '<label>或上传图片</label><input type="file" id="ce-avatar-file" accept="image/*">';
    html += '<div class="modal-buttons"><button class="modal-cancel" onclick="closeCeAvatarModal()">取消</button><button class="modal-confirm" onclick="applyCeAvatar()">确认</button></div>';
    html += '</div></div>';

    var div = document.createElement('div');
    div.id = 'ce-avatar-modal-container';
    div.innerHTML = html;
    document.body.appendChild(div);
}

function closeCeAvatarModal() {
    var container = document.getElementById('ce-avatar-modal-container');
    if (container) container.remove();
}

function applyCeAvatar() {
    var url = document.getElementById('ce-avatar-url').value.trim();
    var fileInput = document.getElementById('ce-avatar-file');

    if (fileInput.files && fileInput.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            setCeAvatarImage(e.target.result);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else if (url) {
        setCeAvatarImage(url);
    }

    closeCeAvatarModal();
}

function setCeAvatarImage(src) {
    var avatar = document.getElementById('ce-avatar');
    if (avatar) {
        avatar.innerHTML = '<img src="' + src + '">';
        avatar.setAttribute('data-src', src);
    }
}

// 保存联系人
function saveContact(editId) {
    var name = document.getElementById('ce-name').value.trim();
    if (!name) {
        showToast('请输入姓名');
        return;
    }

    var gender = document.getElementById('ce-gender').value;
    var birthday = document.getElementById('ce-birthday').value;
    var persona = document.getElementById('ce-persona').value;
    var avatarEl = document.getElementById('ce-avatar');
    var avatar = avatarEl.getAttribute('data-src') || '';

    // 如果头像是img标签，提取src
    if (!avatar) {
        var img = avatarEl.querySelector('img');
        if (img) avatar = img.src;
    }

    var contacts = getContacts();

    if (editId) {
        // 编辑模式
        var index = contacts.findIndex(function(c) { return c.id === editId; });
        if (index >= 0) {
            contacts[index].name = name;
            contacts[index].gender = gender;
            contacts[index].birthday = birthday;
            contacts[index].persona = persona;
            if (avatar) contacts[index].avatar = avatar;
        }
    } else {
        // 添加模式
        var newContact = {
            id: 'ai-' + Date.now(),
            name: name,
            gender: gender,
            birthday: birthday,
            persona: persona,
            avatar: avatar,
            createdAt: Date.now()
        };
        contacts.push(newContact);
    }

    saveContacts(contacts);
    closeContactEditor();
    renderContactsList();
    renderChatList();
    showToast(editId ? '已保存' : '已添加 ' + name);
}

// 渲染通讯录列表
function renderContactsList() {
    var contacts = getContacts();
    var list = document.getElementById('contacts-list');
    if (!list) return;

    if (contacts.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#999;padding:40px 0;font-size:14px;">暂无AI好友，点击上方按钮添加</div>';
        return;
    }

    var html = '';
    contacts.forEach(function(c) {
        html += '<div class="contact-item" onclick="openContactProfile(\'' + c.id + '\')">';
        html += '<div class="contact-avatar">';
        if (c.avatar) {
            html += '<img src="' + c.avatar + '">';
        } else {
            html += '🤖';
        }
        html += '</div>';
        html += '<div class="contact-name">' + c.name + '</div>';
        html += '</div>';
    });

    list.innerHTML = html;
}

// 打开联系人资料卡
function openContactProfile(id) {
    var contacts = getContacts();
    var contact = contacts.find(function(c) { return c.id === id; });
    if (!contact) return;

    var html = '<div class="modal-overlay" id="contact-profile-modal" onclick="closeContactProfile()">';
    html += '<div class="contact-profile" onclick="event.stopPropagation()">';

    // 头像和基本信息
    html += '<div class="cp-header">';
    html += '<div class="cp-avatar">';
    if (contact.avatar) {
        html += '<img src="' + contact.avatar + '">';
    } else {
        html += '🤖';
    }
    html += '</div>';
    html += '<div class="cp-name">' + contact.name + '</div>';
    html += '<div class="cp-gender">' + (contact.gender || '未设置') + '</div>';
    html += '</div>';

    // 信息列表
    html += '<div class="cp-info">';
    if (contact.birthday) {
        html += '<div class="cp-info-row"><span class="cp-label">生日</span><span class="cp-value">' + contact.birthday + '</span></div>';
    }
    html += '<div class="cp-info-row"><span class="cp-label">人设</span></div>';
    html += '<div class="cp-persona">' + (contact.persona || '暂无人设') + '</div>';
    html += '</div>';

    // 操作按钮
    html += '<div class="cp-actions">';
    html += '<button class="cp-chat-btn" onclick="startChatWith(\'' + contact.id + '\')">💬 发消息</button>';
    html += '<button class="cp-edit-btn" onclick="editContact(\'' + contact.id + '\')">✏️ 编辑</button>';
    html += '<button class="cp-delete-btn" onclick="deleteContact(\'' + contact.id + '\')">删除好友</button>';
    html += '</div>';

    html += '</div></div>';

    var div = document.createElement('div');
    div.id = 'contact-profile-container';
    div.innerHTML = html;
    document.body.appendChild(div);
}

function closeContactProfile() {
    var container = document.getElementById('contact-profile-container');
    if (container) container.remove();
}

// 编辑联系人
function editContact(id) {
    closeContactProfile();
    var contacts = getContacts();
    var contact = contacts.find(function(c) { return c.id === id; });
    if (contact) openContactEditor(contact);
}

// 删除联系人
function deleteContact(id) {
    if (!confirm('确定删除该AI好友？聊天记录也会被清除。')) return;

    var contacts = getContacts();
    contacts = contacts.filter(function(c) { return c.id !== id; });
    saveContacts(contacts);

    // 清除聊天记录
    localStorage.removeItem('ai-phone-chat-' + id);
    localStorage.removeItem('ai-phone-summary-' + id);

    closeContactProfile();
    renderContactsList();
    renderChatList();
    showToast('已删除');
}

// 开始聊天
function startChatWith(id) {
    closeContactProfile();
    var contacts = getContacts();
    var contact = contacts.find(function(c) { return c.id === id; });
    if (!contact) return;

    currentChatAI = id;

    // 更新聊天界面标题和头像
    var headerName = document.getElementById('chat-header-name');
    if (headerName) headerName.textContent = contact.name;

    // 加载聊天记录
    loadChatMessages(id);

    switchPage('page-chat');
}

// 渲染聊天列表
function renderChatList() {
    var contacts = getContacts();
    var chatList = document.getElementById('chat-list');
    if (!chatList) return;

    if (contacts.length === 0) {
        chatList.innerHTML = '<div style="text-align:center;color:#999;padding:40px 0;font-size:14px;">暂无聊天，去通讯录添加AI好友吧</div>';
        return;
    }

    var html = '';
    contacts.forEach(function(c) {
        var history = JSON.parse(localStorage.getItem('ai-phone-chat-' + c.id) || '[]');
        var lastMsg = history.length > 0 ? history[history.length - 1].content : '还没有聊过天';
        var lastTime = '';
        if (history.length > 0) {
            var d = new Date(history[history.length - 1].time);
            lastTime = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        }

        html += '<div class="chat-list-item" onclick="startChatWith(\'' + c.id + '\')">';
        html += '<div class="chat-avatar">';
        if (c.avatar) {
            html += '<img src="' + c.avatar + '">';
        } else {
            html += '🤖';
        }
        html += '</div>';
        html += '<div class="chat-info">';
        html += '<div class="chat-info-top">';
        html += '<span class="chat-name">' + c.name + '</span>';
        html += '<span class="chat-time">' + lastTime + '</span>';
        html += '</div>';
        html += '<div class="chat-last-msg">' + lastMsg.substring(0, 30) + (lastMsg.length > 30 ? '...' : '') + '</div>';
        html += '</div>';
        html += '</div>';
    });

    chatList.innerHTML = html;
}

// 页面加载时渲染列表
(function() {
    renderContactsList();
    renderChatList();
})();
