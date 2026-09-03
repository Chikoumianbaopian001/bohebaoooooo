// ===== 世界书逻辑 =====

// 获取所有世界书
function getWorldBooks() {
    return JSON.parse(localStorage.getItem('ai-phone-worldbooks') || '[]');
}

// 保存世界书
function saveWorldBooks(books) {
    localStorage.setItem('ai-phone-worldbooks', JSON.stringify(books));
}

// 获取所有分组
function getWorldBookGroups() {
    var books = getWorldBooks();
    var groups = [];
    books.forEach(function(b) {
        if (b.group && groups.indexOf(b.group) === -1) {
            groups.push(b.group);
        }
    });
    return groups;
}

// 渲染世界书页面
function renderWorldBook() {
    var books = getWorldBooks();
    var container = document.getElementById('worldbook-body');
    if (!container) return;

    if (books.length === 0) {
        container.innerHTML = '<div class="wb-empty">暂无世界书，点击右上角添加</div>';
        return;
    }

    // 按分组归类
    var grouped = {};
    var ungrouped = [];

    books.forEach(function(b) {
        if (b.group) {
            if (!grouped[b.group]) grouped[b.group] = [];
            grouped[b.group].push(b);
        } else {
            ungrouped.push(b);
        }
    });

    var html = '';

    // 有分组的
    Object.keys(grouped).forEach(function(groupName) {
        var items = grouped[groupName].sort(function(a, b) { return a.priority - b.priority; });
        html += '<div class="wb-group">';
        html += '<div class="wb-group-header">';
        html += '<span class="wb-group-name">📂 ' + groupName + '</span>';
        html += '<span class="wb-group-count">' + items.length + '条</span>';
        html += '</div>';
        items.forEach(function(b) {
            html += renderWorldBookItem(b);
        });
        html += '</div>';
    });

    // 未分组的
    if (ungrouped.length > 0) {
        ungrouped.sort(function(a, b) { return a.priority - b.priority; });
        html += '<div class="wb-group">';
        html += '<div class="wb-group-header"><span class="wb-group-name">📂 未分组</span><span class="wb-group-count">' + ungrouped.length + '条</span></div>';
        ungrouped.forEach(function(b) {
            html += renderWorldBookItem(b);
        });
        html += '</div>';
    }

    container.innerHTML = html;
}

// 渲染单个世界书条目
function renderWorldBookItem(book) {
    var priorityLabel = '';
    if (book.priority <= 3) priorityLabel = '<span class="wb-priority high">高</span>';
    else if (book.priority <= 6) priorityLabel = '<span class="wb-priority mid">中</span>';
    else priorityLabel = '<span class="wb-priority low">低</span>';

    var triggerLabel = '';
    if (book.triggerMode === 'always') {
        triggerLabel = '<span class="wb-trigger always">常驻</span>';
    } else if (book.triggerMode === 'keyword') {
        triggerLabel = '<span class="wb-trigger keyword">关键词</span>';
    }

    var html = '<div class="wb-item" onclick="openWorldBookDetail(\'' + book.id + '\')">';
    html += '<div class="wb-item-left">';
    html += '<div class="wb-item-title">' + book.name + '</div>';
    html += '<div class="wb-item-meta">';
    html += priorityLabel;
    html += triggerLabel;
    html += '<span class="wb-item-num">P' + book.priority + '</span>';
    if (book.triggerMode === 'keyword' && book.keywords) {
        html += '<span class="wb-item-keywords">' + book.keywords.substring(0, 20) + '</span>';
    }
    html += '</div>';
    html += '</div>';
    html += '<div class="wb-item-right">';
    html += '<label class="toggle-switch toggle-sm" onclick="event.stopPropagation()">';
    html += '<input type="checkbox" ' + (book.enabled ? 'checked' : '') + ' onchange="toggleWorldBook(\'' + book.id + '\', this.checked)">';
    html += '<span class="toggle-slider"></span>';
    html += '</label>';
    html += '</div>';
    html += '</div>';

    return html;
}

// 切换世界书开关
function toggleWorldBook(id, enabled) {
    var books = getWorldBooks();
    var book = books.find(function(b) { return b.id === id; });
    if (book) {
        book.enabled = enabled;
        saveWorldBooks(books);
    }
}

// 打开世界书详情/编辑
function openWorldBookDetail(id) {
    var books = getWorldBooks();
    var book = books.find(function(b) { return b.id === id; });
    if (!book) return;
    openWorldBookEditor(book);
}

// 打开世界书编辑器
function openWorldBookEditor(book) {
    var isEdit = !!book;
    var groups = getWorldBookGroups();

    var html = '<div class="modal-overlay" id="wb-editor-modal" onclick="closeWbEditor()">';
    html += '<div class="wb-editor" onclick="event.stopPropagation()">';
    html += '<div class="wb-editor-header">';
    html += '<span class="wb-editor-title">' + (isEdit ? '编辑世界书' : '添加世界书') + '</span>';
    html += '<span class="wb-editor-close" onclick="closeWbEditor()">✕</span>';
    html += '</div>';
    html += '<div class="wb-editor-body">';

    // 名称
    html += '<div class="wb-field"><label>名称</label><input type="text" id="wb-name" placeholder="世界书名称" value="' + (book ? book.name : '') + '"></div>';

    // 分组
    html += '<div class="wb-field"><label>分组</label>';
    html += '<div class="wb-group-input">';
    html += '<input type="text" id="wb-group" placeholder="输入或选择分组" value="' + (book ? book.group || '' : '') + '" list="wb-group-list">';
    html += '<datalist id="wb-group-list">';
    groups.forEach(function(g) {
        html += '<option value="' + g + '">';
    });
    html += '</datalist>';
    html += '</div></div>';

    // 优先级
    html += '<div class="wb-field"><label>优先级</label>';
    html += '<div class="wb-priority-row">';
    html += '<select id="wb-priority-level" onchange="syncPriorityNumber()">';
    var pVal = book ? book.priority : 5;
    html += '<option value="high"' + (pVal <= 3 ? ' selected' : '') + '>🔴 高</option>';
    html += '<option value="mid"' + (pVal > 3 && pVal <= 6 ? ' selected' : '') + '>🟡 中</option>';
    html += '<option value="low"' + (pVal > 6 ? ' selected' : '') + '>🟢 低</option>';
    html += '</select>';
    html += '<input type="number" id="wb-priority-num" min="1" max="10" value="' + pVal + '" placeholder="1-10">';
    html += '</div></div>';

    // 触发方式
    html += '<div class="wb-field"><label>触发方式</label>';
    html += '<select id="wb-trigger" onchange="toggleKeywordField()">';
    var tm = book ? book.triggerMode : 'always';
    html += '<option value="always"' + (tm === 'always' ? ' selected' : '') + '>常驻（始终加载）</option>';
    html += '<option value="keyword"' + (tm === 'keyword' ? ' selected' : '') + '>关键词触发</option>';
    html += '</select></div>';

    // 关键词
    html += '<div class="wb-field" id="wb-keyword-field" style="' + (tm === 'keyword' ? '' : 'display:none;') + '">';
    html += '<label>触发关键词（用逗号分隔）</label>';
    html += '<input type="text" id="wb-keywords" placeholder="关键词1, 关键词2, ..." value="' + (book ? book.keywords || '' : '') + '">';
    html += '</div>';

    // 内容
    html += '<div class="wb-field"><label>内容</label>';
    html += '<textarea id="wb-content" placeholder="世界书内容...">' + (book ? book.content || '' : '') + '</textarea>';
    html += '</div>';

    // 导入文件
    html += '<div class="wb-field">';
    html += '<label>从文件导入</label>';
    html += '<input type="file" id="wb-file" accept=".txt,.md,.json,.docx" onchange="importWbFile()">';
    html += '<div class="wb-file-hint">支持 txt、md、json、docx 格式</div>';
    html += '</div>';

    // 备注
    html += '<div class="wb-field"><label>备注（可选）</label>';
    html += '<input type="text" id="wb-note" placeholder="给自己看的说明" value="' + (book ? book.note || '' : '') + '">';
    html += '</div>';

    // 按钮
    html += '<div class="wb-editor-actions">';
    html += '<button class="wb-save-btn" onclick="saveWorldBook(\'' + (book ? book.id : '') + '\')">' + (isEdit ? '保存修改' : '添加世界书') + '</button>';
    if (isEdit) {
        html += '<button class="wb-delete-btn" onclick="deleteWorldBook(\'' + book.id + '\')">删除</button>';
    }
    html += '</div>';

    html += '</div></div></div>';

    var div = document.createElement('div');
    div.id = 'wb-editor-container';
    div.innerHTML = html;
    document.body.appendChild(div);
}

function closeWbEditor() {
    var container = document.getElementById('wb-editor-container');
    if (container) container.remove();
}

// 优先级联动
function syncPriorityNumber() {
    var level = document.getElementById('wb-priority-level').value;
    var numInput = document.getElementById('wb-priority-num');
    if (level === 'high') numInput.value = 2;
    else if (level === 'mid') numInput.value = 5;
    else numInput.value = 8;
}

// 关键词字段显隐
function toggleKeywordField() {
    var trigger = document.getElementById('wb-trigger').value;
    var field = document.getElementById('wb-keyword-field');
    if (field) {
        field.style.display = trigger === 'keyword' ? 'flex' : 'none';
    }
}

// 导入文件
function importWbFile() {
    var fileInput = document.getElementById('wb-file');
    if (!fileInput.files || !fileInput.files[0]) return;

    var file = fileInput.files[0];
    var fileName = file.name.toLowerCase();

    // 自动填写名称
    var nameInput = document.getElementById('wb-name');
    if (!nameInput.value) {
        nameInput.value = file.name.replace(/\.[^.]+$/, '');
    }

    if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        var reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('wb-content').value = e.target.result;
            showToast('已导入 ' + file.name);
        };
        reader.readAsText(file);
    } else if (fileName.endsWith('.json')) {
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var json = JSON.parse(e.target.result);
                document.getElementById('wb-content').value = JSON.stringify(json, null, 2);
                showToast('已导入 ' + file.name);
            } catch (err) {
                document.getElementById('wb-content').value = e.target.result;
                showToast('JSON解析失败，已作为文本导入');
            }
        };
        reader.readAsText(file);
    } else if (fileName.endsWith('.docx')) {
        // docx需要简单解析
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                extractDocxText(e.target.result).then(function(text) {
                    document.getElementById('wb-content').value = text;
                    showToast('已导入 ' + file.name);
                });
            } catch (err) {
                showToast('docx解析失败');
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        showToast('不支持的文件格式');
    }
}

// 简单的docx文本提取
async function extractDocxText(arrayBuffer) {
    try {
        // 使用JSZip解析docx（如果没有JSZip就降级处理）
        if (typeof JSZip !== 'undefined') {
            var zip = await JSZip.loadAsync(arrayBuffer);
            var doc = await zip.file('word/document.xml').async('string');
            // 提取文本
            var text = doc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            return text;
        } else {
            // 没有JSZip，提示用户
            return '（docx解析需要JSZip库，建议转换为txt格式后导入）';
        }
    } catch (err) {
        return '（docx解析失败，建议转换为txt格式后导入）';
    }
}

// 保存世界书
function saveWorldBook(editId) {
    var name = document.getElementById('wb-name').value.trim();
    if (!name) {
        showToast('请输入名称');
        return;
    }

    var content = document.getElementById('wb-content').value.trim();
    if (!content) {
        showToast('请输入内容或导入文件');
        return;
    }

    var group = document.getElementById('wb-group').value.trim();
    var priority = parseInt(document.getElementById('wb-priority-num').value) || 5;
    var triggerMode = document.getElementById('wb-trigger').value;
    var keywords = document.getElementById('wb-keywords').value.trim();
    var note = document.getElementById('wb-note').value.trim();

    // 限制优先级范围
    if (priority < 1) priority = 1;
    if (priority > 10) priority = 10;

    var books = getWorldBooks();

    if (editId) {
        var index = books.findIndex(function(b) { return b.id === editId; });
        if (index >= 0) {
            books[index].name = name;
            books[index].group = group;
            books[index].priority = priority;
            books[index].triggerMode = triggerMode;
            books[index].keywords = keywords;
            books[index].content = content;
            books[index].note = note;
        }
    } else {
        books.push({
            id: 'wb-' + Date.now(),
            name: name,
            group: group,
            priority: priority,
            triggerMode: triggerMode,
            keywords: keywords,
            content: content,
            note: note,
            enabled: true,
            createdAt: Date.now()
        });
    }

    saveWorldBooks(books);
    closeWbEditor();
    renderWorldBook();
    showToast(editId ? '已保存' : '已添加');
}

// 删除世界书
function deleteWorldBook(id) {
    if (!confirm('确定删除这本世界书？')) return;

    var books = getWorldBooks();
    books = books.filter(function(b) { return b.id !== id; });
    saveWorldBooks(books);
    closeWbEditor();
    renderWorldBook();
    showToast('已删除');
}

// 获取当前应该加载的世界书（给chat.js调用）
function getEnabledWorldBooks(userMessage) {
    var books = getWorldBooks();
    var result = [];

    books.forEach(function(b) {
        if (!b.enabled) return;

        if (b.triggerMode === 'always') {
            // 常驻触发
            result.push(b);
        } else if (b.triggerMode === 'keyword' && userMessage && b.keywords) {
            // 关键词触发
            var kws = b.keywords.split(',').map(function(k) { return k.trim().toLowerCase(); });
            var msg = userMessage.toLowerCase();
            var matched = kws.some(function(kw) { return kw && msg.indexOf(kw) >= 0; });
            if (matched) result.push(b);
        }
    });

    return result.sort(function(a, b) { return a.priority - b.priority; });
}

// 页面加载时渲染
(function() {
    renderWorldBook();
})();
