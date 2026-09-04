// ===== 用户资料 =====

// 打开我的资料编辑
function openMyProfile() {
    var saved = JSON.parse(localStorage.getItem('ai-phone-my-profile') || '{}');

    var html = '<div class="modal-overlay" id="my-profile-modal" onclick="closeMyProfile()">';
    html += '<div class="contact-editor" onclick="event.stopPropagation()">';
    html += '<div class="ce-header"><span class="ce-title">编辑资料</span><span class="ce-close" onclick="closeMyProfile()">✕</span></div>';
    html += '<div class="ce-body">';

    // 头像
    html += '<div class="ce-avatar-row">';
    html += '<div class="ce-avatar" id="mp-avatar" onclick="chooseMyAvatar()">';
    if (saved.avatar) {
        html += '<img src="' + saved.avatar + '">';
    } else {
        html += '👤';
    }
    html += '</div>';
    html += '<span class="ce-avatar-hint">点击设置头像</span>';
    html += '</div>';

    // 昵称
    html += '<div class="ce-field"><label>昵称</label><input type="text" id="mp-name" placeholder="你的昵称"></div>';

    // 微信号
    html += '<div class="ce-field"><label>微信号</label><input type="text" id="mp-wechat-id" placeholder="你的微信号"></div>';

    // 保存
    html += '<button class="ce-save-btn" onclick="saveMyProfile()">保存</button>';

    html += '</div></div></div>';

    var div = document.createElement('div');
    div.id = 'my-profile-modal-container';
    div.innerHTML = html;
    document.body.appendChild(div);

    // 填入已保存的值
    if (saved.name) document.getElementById('mp-name').value = saved.name;
    if (saved.wechatId) document.getElementById('mp-wechat-id').value = saved.wechatId;
    if (saved.avatar) document.getElementById('mp-avatar').setAttribute('data-src', saved.avatar);
}

function closeMyProfile() {
    var c = document.getElementById('my-profile-modal-container');
    if (c) c.remove();
}

function chooseMyAvatar() {
    var html = '<div class="modal-overlay" id="mp-avatar-modal" onclick="closeMyAvatarModal()">';
    html += '<div class="modal-box" onclick="event.stopPropagation()">';
    html += '<h3>🖼️ 设置头像</h3>';
    html += '<label>图片URL</label><input type="text" id="mp-avatar-url" placeholder="输入图片链接">';
    html += '<label>或上传图片</label><input type="file" id="mp-avatar-file" accept="image/*">';
    html += '<div class="modal-buttons"><button class="modal-cancel" onclick="closeMyAvatarModal()">取消</button><button class="modal-confirm" onclick="applyMyAvatar()">确认</button></div>';
    html += '</div></div>';

    var div = document.createElement('div');
    div.id = 'mp-avatar-modal-container';
    div.innerHTML = html;
    document.body.appendChild(div);
}

function closeMyAvatarModal() {
    var c = document.getElementById('mp-avatar-modal-container');
    if (c) c.remove();
}

function applyMyAvatar() {
    var url = document.getElementById('mp-avatar-url').value.trim();
    var fileInput = document.getElementById('mp-avatar-file');

    if (fileInput.files && fileInput.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var avatar = document.getElementById('mp-avatar');
            if (avatar) {
                avatar.innerHTML = '<img src="' + e.target.result + '">';
                avatar.setAttribute('data-src', e.target.result);
            }
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else if (url) {
        var avatar = document.getElementById('mp-avatar');
        if (avatar) {
            avatar.innerHTML = '<img src="' + url + '">';
            avatar.setAttribute('data-src', url);
        }
    }
    closeMyAvatarModal();
}

function saveMyProfile() {
    var name = document.getElementById('mp-name').value.trim();
    var wechatId = document.getElementById('mp-wechat-id').value.trim();
    var avatarEl = document.getElementById('mp-avatar');
    var avatar = avatarEl.getAttribute('data-src') || '';
    if (!avatar) {
        var img = avatarEl.querySelector('img');
        if (img) avatar = img.src;
    }

    var profile = { name: name, wechatId: wechatId, avatar: avatar };
    localStorage.setItem('ai-phone-my-profile', JSON.stringify(profile));

    // 更新界面显示
    var nameEl = document.getElementById('my-name');
    var idEl = document.getElementById('my-wechat-id');
    var avatarDisplay = document.getElementById('my-avatar');
    if (nameEl) nameEl.textContent = name || '点击设置';
    if (idEl) idEl.textContent = '微信号：' + (wechatId || 'AI-Phone');
    if (avatarDisplay && avatar) avatarDisplay.innerHTML = '<img src="' + avatar + '">';

    closeMyProfile();
    showToast('已保存');
}

// 页面加载时恢复资料
(function() {
    var saved = JSON.parse(localStorage.getItem('ai-phone-my-profile') || '{}');
    if (saved.name) {
        var el = document.getElementById('my-name');
        if (el) el.textContent = saved.name;
    }
    if (saved.wechatId) {
        var el = document.getElementById('my-wechat-id');
        if (el) el.textContent = '微信号：' + saved.wechatId;
    }
    if (saved.avatar) {
        var el = document.getElementById('my-avatar');
        if (el) el.innerHTML = '<img src="' + saved.avatar + '">';
    }
})();


// ===== 用户人设管理 =====

function getUserPersonas() {
    return JSON.parse(localStorage.getItem('ai-phone-user-personas') || '[]');
}

function saveUserPersonas(list) {
    localStorage.setItem('ai-phone-user-personas', JSON.stringify(list));
}

function renderUserPersonaList() {
    var list = getUserPersonas();
    var container = document.getElementById('user-persona-list');
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:#999;padding:40px 0;font-size:14px;">暂无人设，点击右上角添加</div>';
        return;
    }

    var html = '';
    list.forEach(function(p) {
        html += '<div class="cs-card" style="cursor:pointer;" onclick="openUserPersonaEditor(\'' + p.id + '\')">';
        html += '<div style="display:flex;align-items:center;gap:12px;">';

        // ★ 头像
        html += '<div style="width:48px;height:48px;border-radius:8px;background:#e0e0e0;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;overflow:hidden;">';
        if (p.avatar) {
            html += '<img src="' + p.avatar + '" style="width:100%;height:100%;object-fit:cover;">';
        } else {
            html += '👤';
        }
        html += '</div>';

        html += '<div style="flex:1;min-width:0;">';
        html += '<div style="font-size:16px;font-weight:600;margin-bottom:4px;">' + p.name + '</div>';
        html += '<div style="font-size:12px;color:#999;">' + (p.gender || '') + (p.birthday ? ' · ' + p.birthday : '') + '</div>';
        if (p.persona) {
            html += '<div style="font-size:13px;color:#666;margin-top:4px;line-height:1.4;max-height:40px;overflow:hidden;">' + p.persona.substring(0, 60) + (p.persona.length > 60 ? '...' : '') + '</div>';
        }
        html += '</div>';

        html += '<span class="cs-arrow">›</span>';
        html += '</div></div>';
    });

    container.innerHTML = html;
}

function openUserPersonaEditor(editId) {
    var old = document.getElementById('user-persona-editor-container');
    if (old) old.remove();

    var persona = null;
    if (editId) {
        var list = getUserPersonas();
        persona = list.find(function(p) { return p.id === editId; });
    }
    var isEdit = !!persona;

    var html = '<div class="modal-overlay" id="user-persona-editor-modal" onclick="closeUserPersonaEditor()">';
    html += '<div class="contact-editor" onclick="event.stopPropagation()">';
    html += '<div class="ce-header"><span class="ce-title">' + (isEdit ? '编辑人设' : '添加人设') + '</span><span class="ce-close" onclick="closeUserPersonaEditor()">✕</span></div>';
    html += '<div class="ce-body">';

    // ★ 头像
    html += '<div class="ce-avatar-row">';
    html += '<div class="ce-avatar" id="up-avatar" onclick="chooseUserPersonaAvatar()">';
    if (persona && persona.avatar) {
        html += '<img src="' + persona.avatar + '">';
    } else {
        html += '👤';
    }
    html += '</div>';
    html += '<span class="ce-avatar-hint">点击设置头像</span>';
    html += '</div>';

    html += '<div class="ce-field"><label>姓名</label><input type="text" id="up-name" placeholder="角色名字"></div>';
    html += '<div class="ce-field"><label>性别</label><select id="up-gender"><option value="女">女</option><option value="男">男</option><option value="其他">其他</option></select></div>';
    html += '<div class="ce-field"><label>出生年月</label><input type="month" id="up-birthday"></div>';
    html += '<div class="ce-field"><label>人设</label><textarea id="up-persona" placeholder="描述这个人设的性格、背景、说话方式..."></textarea></div>';

    html += '<button class="ce-save-btn" onclick="saveUserPersona(\'' + (persona ? persona.id : '') + '\')">' + (isEdit ? '保存修改' : '添加人设') + '</button>';

    if (isEdit) {
        html += '<button class="cs-danger-btn" style="margin-top:10px;" onclick="deleteUserPersona(\'' + persona.id + '\')">删除人设</button>';
    }

    html += '</div></div></div>';

    var div = document.createElement('div');
    div.id = 'user-persona-editor-container';
    div.innerHTML = html;
    document.body.appendChild(div);

    // 填值
    if (persona) {
        document.getElementById('up-name').value = persona.name || '';
        document.getElementById('up-gender').value = persona.gender || '女';
        document.getElementById('up-birthday').value = persona.birthday || '';
        document.getElementById('up-persona').value = persona.persona || '';
        if (persona.avatar) document.getElementById('up-avatar').setAttribute('data-src', persona.avatar);
    }
}

function closeUserPersonaEditor() {
    var c = document.getElementById('user-persona-editor-container');
    if (c) c.remove();
}

function chooseUserPersonaAvatar() {
    var html = '<div class="modal-overlay" id="up-avatar-modal" onclick="closeUpAvatarModal()">';
    html += '<div class="modal-box" onclick="event.stopPropagation()">';
    html += '<h3>🖼️ 设置头像</h3>';
    html += '<label>图片URL</label><input type="text" id="up-avatar-url" placeholder="输入图片链接">';
    html += '<label>或上传图片</label><input type="file" id="up-avatar-file" accept="image/*">';
    html += '<div class="modal-buttons"><button class="modal-cancel" onclick="closeUpAvatarModal()">取消</button><button class="modal-confirm" onclick="applyUpAvatar()">确认</button></div>';
    html += '</div></div>';

    var div = document.createElement('div');
    div.id = 'up-avatar-modal-container';
    div.innerHTML = html;
    document.body.appendChild(div);
}

function closeUpAvatarModal() {
    var c = document.getElementById('up-avatar-modal-container');
    if (c) c.remove();
}

function applyUpAvatar() {
    var url = document.getElementById('up-avatar-url').value.trim();
    var fileInput = document.getElementById('up-avatar-file');

    if (fileInput.files && fileInput.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var avatar = document.getElementById('up-avatar');
            if (avatar) {
                avatar.innerHTML = '<img src="' + e.target.result + '">';
                avatar.setAttribute('data-src', e.target.result);
            }
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else if (url) {
        var avatar = document.getElementById('up-avatar');
        if (avatar) {
            avatar.innerHTML = '<img src="' + url + '">';
            avatar.setAttribute('data-src', url);
        }
    }
    closeUpAvatarModal();
}

function saveUserPersona(editId) {
    var name = document.getElementById('up-name').value.trim();
    if (!name) { showToast('请输入姓名'); return; }

    var gender = document.getElementById('up-gender').value;
    var birthday = document.getElementById('up-birthday').value;
    var persona = document.getElementById('up-persona').value;

    // ★ 获取头像
    var avatarEl = document.getElementById('up-avatar');
    var avatar = avatarEl.getAttribute('data-src') || '';
    if (!avatar) {
        var img = avatarEl.querySelector('img');
        if (img) avatar = img.src;
    }

    var list = getUserPersonas();

    if (editId) {
        var index = list.findIndex(function(p) { return p.id === editId; });
        if (index >= 0) {
            list[index].name = name;
            list[index].gender = gender;
            list[index].birthday = birthday;
            list[index].persona = persona;
            list[index].avatar = avatar;
        }
    } else {
        list.push({
            id: 'up-' + Date.now(),
            name: name,
            gender: gender,
            birthday: birthday,
            persona: persona,
            avatar: avatar,
            createdAt: Date.now()
        });
    }

    saveUserPersonas(list);
    closeUserPersonaEditor();
    renderUserPersonaList();
    showToast(editId ? '已保存' : '已添加');
}

function deleteUserPersona(id) {
    if (!confirm('确定删除这个人设？')) return;
    var list = getUserPersonas();
    list = list.filter(function(p) { return p.id !== id; });
    saveUserPersonas(list);
    closeUserPersonaEditor();
    renderUserPersonaList();
    showToast('已删除');
}

// 页面加载时渲染
(function() { renderUserPersonaList(); })();


// ===== 聊天设置 - 用户人设选择弹窗 =====

function openUserPersonaSelect() {
    var old = document.getElementById('user-persona-select-container');
    if (old) old.remove();

    var list = getUserPersonas();
    var chatSettings = JSON.parse(localStorage.getItem('ai-phone-chat-settings') || '{}');
    var currentId = chatSettings.userPersonaId || '';

    var html = '<div class="modal-overlay" id="user-persona-select-modal" onclick="closeUserPersonaSelect()">';
    html += '<div class="heart-sub-popup" onclick="event.stopPropagation()">';
    html += '<div class="heart-sub-header"><span class="heart-sub-title">选择对话人设</span><span class="heart-sub-close" onclick="closeUserPersonaSelect()">✕</span></div>';
    html += '<div class="heart-sub-body">';

    // 不使用人设选项
    html += '<div class="cs-card" style="cursor:pointer;' + (!currentId ? 'border:2px solid #07c160;' : '') + '" onclick="selectUserPersona(\'\')">';
    html += '<div style="display:flex;align-items:center;gap:12px;">';
    html += '<div style="width:42px;height:42px;border-radius:8px;background:#e0e0e0;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🚫</div>';
    html += '<div style="flex:1;">';
    html += '<div style="font-size:15px;color:#333;">不使用人设</div>';
    html += '</div>';
    if (!currentId) html += '<span style="color:#07c160;font-size:13px;">✓</span>';
    html += '</div></div>';

    if (list.length === 0) {
        html += '<div style="text-align:center;color:#999;padding:20px 0;font-size:13px;">暂无人设，请先在"我的人设"中添加</div>';
    } else {
        list.forEach(function(p) {
            var isSelected = currentId === p.id;
            html += '<div class="cs-card" style="cursor:pointer;' + (isSelected ? 'border:2px solid #07c160;' : '') + '" onclick="selectUserPersona(\'' + p.id + '\')">';
            html += '<div style="display:flex;align-items:center;gap:12px;">';

            // ★ 头像
            html += '<div style="width:42px;height:42px;border-radius:8px;background:#e0e0e0;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;overflow:hidden;">';
            if (p.avatar) {
                html += '<img src="' + p.avatar + '" style="width:100%;height:100%;object-fit:cover;">';
            } else {
                html += '👤';
            }
            html += '</div>';

            // ★ 名字
            html += '<div style="flex:1;">';
            html += '<div style="font-size:15px;font-weight:600;">' + p.name + '</div>';
            html += '</div>';

            if (isSelected) html += '<span style="color:#07c160;font-size:13px;">✓</span>';
            html += '</div></div>';
        });
    }

    html += '</div></div></div>';

    var div = document.createElement('div');
    div.id = 'user-persona-select-container';
    div.innerHTML = html;
    document.body.appendChild(div);
}

function closeUserPersonaSelect() {
    var c = document.getElementById('user-persona-select-container');
    if (c) c.remove();
}

function selectUserPersona(id) {
    var chatSettings = JSON.parse(localStorage.getItem('ai-phone-chat-settings') || '{}');
    chatSettings.userPersonaId = id;
    localStorage.setItem('ai-phone-chat-settings', JSON.stringify(chatSettings));

    // 更新显示
    var nameEl = document.getElementById('cs-user-persona-name');
    if (nameEl) {
        if (!id) {
            nameEl.textContent = '未选择';
        } else {
            var list = getUserPersonas();
            var p = list.find(function(item) { return item.id === id; });
            nameEl.textContent = p ? p.name : '未选择';
        }
    }

    closeUserPersonaSelect();
    showToast(id ? '已选择人设' : '已取消人设');
}

