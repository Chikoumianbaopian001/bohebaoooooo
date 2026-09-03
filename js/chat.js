// ===== 聊天核心逻辑 =====

// AI生成控制
let isGenerating = false;
let abortController = null;

// 当前聊天的AI ID（后续通讯录做好后动态切换）
let currentChatAI = 'default';

// 聊天记录存储
function getChatHistory(aiId) {
    const key = 'ai-phone-chat-' + (aiId || currentChatAI);
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function saveChatHistory(aiId, history) {
    const key = 'ai-phone-chat-' + (aiId || currentChatAI);
    localStorage.setItem(key, JSON.stringify(history));
}

// 获取聊天设置
function getChatSettings() {
    const saved = localStorage.getItem('ai-phone-chat-settings');
    if (saved) return JSON.parse(saved);
    return {
        replyMin: 1, replyMax: 1,
        memoryMode: 'manual', memoryCount: 20,
        translate: false,
        autoMsg: false, autoMsgValue: 30, autoMsgUnit: 'min',
        minimaxVoiceId: '', minimaxVoiceMsg: false, minimaxCall: false,
        imagePrompt: '',
        timeAware: false, blockAi: false, allowBlock: false,
    };
}

// 获取全局API设置
function getAPISettings() {
    const saved = localStorage.getItem('ai-phone-global-settings');
    if (saved) return JSON.parse(saved);
    return {
        apiKey: '', apiUrl: 'https://api.openai.com/v1/chat/completions', apiModel: 'gpt-3.5-turbo',
        subApiKey: '', subApiUrl: '', subApiModel: '',
        minimaxKey: '', minimaxGroup: '', minimaxUrl: 'https://api.minimax.chat/v1/t2a_v2',
        imageKey: '', imageUrl: 'https://api.openai.com/v1/images/generations', imageModel: 'dall-e-3',
    };
}

// ===== 发送消息 =====
// ===== 发送消息（只发用户消息，不触发AI） =====
async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    onChatInputChange();

    document.getElementById('emoji-panel').style.display = 'none';
    document.getElementById('plus-panel').style.display = 'none';

    appendMessage(text, 'user');

    const history = getChatHistory();
    history.push({ role: 'user', content: text, time: Date.now() });
    saveChatHistory(currentChatAI, history);

    updateChatListPreview(text);
    onChatInputChange(); // 更新按钮状态，会显示回复按钮
}

// 调用API（带错误处理）
async function callAPI(apiKey, apiUrl, model, messages, signal) {
    try {
        var url = apiUrl.replace(/\/+$/, '');
        if (!url.endsWith('/chat/completions')) {
            if (!url.endsWith('/v1')) {
                url = url + '/v1';
            }
            url = url + '/chat/completions';
        }

        console.log('请求URL:', url);

        var response;

        // 先直接请求
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages
                }),
                signal: signal
            });
        } catch (directErr) {
            // 直接请求失败，尝试CORS代理
            console.warn('直接请求失败，尝试代理:', directErr.message);
            response = await fetch('https://corsproxy.io/?' + encodeURIComponent(url), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages
                }),
                signal: signal
            });
        }

        console.log('响应状态:', response.status);
        var data = await response.json();

        if (data.error) {
            console.error('API错误:', data.error.message);
            appendSystemMsg('⚠️ API错误：' + data.error.message);
            return null;
        }

        return data;
    } catch (err) {
        if (err.name === 'AbortError') throw err;
        console.error('API请求失败:', err);
        return null;
    }
}

// ===== 构建发送给API的消息 =====
// 修复 buildMessages 函数，添加 userMessage 参数

function buildMessages(history, userMessage) {
    const chatSettings = getChatSettings();

    // 获取当前AI的人设
    var aiPersona = '';
    var contacts = getContacts();
    var currentContact = contacts.find(function(c) { return c.id === currentChatAI; });
    if (currentContact && currentContact.persona) {
        aiPersona = currentContact.persona;
    }
    
    const systemPrompt = buildSystemPrompt({
        scene: 'online',
        aiPersona: aiPersona,
        userPersona: '',
        worldBooks: getEnabledWorldBooks(userMessage || '')  // ← 修复：用参数代替未定义的text
    });

    // 时间感知
    let timeInfo = '';
    if (chatSettings.timeAware) {
        const now = new Date();
        const hours = now.getHours();
        let period = '凌晨';
        if (hours >= 6 && hours < 9) period = '早上';
        else if (hours >= 9 && hours < 12) period = '上午';
        else if (hours >= 12 && hours < 14) period = '中午';
        else if (hours >= 14 && hours < 18) period = '下午';
        else if (hours >= 18 && hours < 22) period = '晚上';
        else if (hours >= 22) period = '深夜';

        timeInfo = '\n\n【当前时间】' + now.getFullYear() + '年' + (now.getMonth()+1) + '月' + now.getDate() + '日 ' +
            String(hours).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + '（' + period + '）';
    }

    const messages = [
        { role: 'system', content: systemPrompt + timeInfo }
    ];

    // 记忆总结（如果有）
    const summary = localStorage.getItem('ai-phone-summary-' + currentChatAI);
    if (summary) {
        messages.push({ role: 'system', content: '【之前的聊天记忆总结】\n' + summary });
    }

    // 过滤掉已删除的消息，只保留最近的消息
    const validHistory = history.filter(h => !h.deleted);
    const recentHistory = validHistory.slice(-40); // 最近40条

    recentHistory.forEach(h => {
        messages.push({ role: h.role, content: h.content });
    });

    return messages;
}

// 获取启用的世界书
function getEnabledWorldBooks() {
    const books = JSON.parse(localStorage.getItem('ai-phone-worldbooks') || '[]');
    return books.filter(b => b.enabled).sort((a, b) => a.priority - b.priority);
}

// ===== UI操作 =====

// 添加消息到聊天界面
function appendMessage(text, type) {
    const container = document.getElementById('chat-messages');
    const row = document.createElement('div');
    row.className = 'msg-row ' + (type === 'ai' ? 'msg-left' : 'msg-right');

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = type === 'ai' ? '🤖' : '👤';

    const wrap = document.createElement('div');
    wrap.className = 'msg-bubble-wrap';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble ' + (type === 'ai' ? 'left' : 'right');
    bubble.textContent = text;

    wrap.appendChild(bubble);
    row.appendChild(avatar);
    row.appendChild(wrap);
    container.appendChild(row);

    // 滚动到底部
    container.scrollTop = container.scrollHeight;

    return row;
}

// 添加加载动画
function appendLoading() {
    const container = document.getElementById('chat-messages');
    const row = document.createElement('div');
    row.className = 'msg-row msg-left';
    row.id = 'msg-loading';

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = '🤖';

    const wrap = document.createElement('div');
    wrap.className = 'msg-bubble-wrap';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble left msg-loading-bubble';
    bubble.innerHTML = '<span class="loading-dot">·</span><span class="loading-dot">·</span><span class="loading-dot">·</span>';

    wrap.appendChild(bubble);
    row.appendChild(avatar);
    row.appendChild(wrap);
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;

    return row;
}

// 添加系统消息
function appendSystemMsg(text) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-time-label';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// 添加时间标签
function appendTimeLabel() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    appendSystemMsg(hours + ':' + minutes);
}

// ===== 辅助函数 =====

// 延迟
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 将回复分割成多条消息
function splitReply(text, count) {
    if (count <= 1) return [text];

    // 按换行或句号分割
    const sentences = text.split(/(?<=[。！？\n])/g).filter(s => s.trim());

    if (sentences.length <= 1) return [text];

    // 将句子分配到count组
    const result = [];
    const perGroup = Math.ceil(sentences.length / count);

    for (let i = 0; i < count; i++) {
        const start = i * perGroup;
        const end = Math.min(start + perGroup, sentences.length);
        const group = sentences.slice(start, end).join('').trim();
        if (group) result.push(group);
    }

    return result.length > 0 ? result : [text];
}

// 检测是否需要翻译（简单的非中文检测）
function needsTranslation(text) {
    // 计算非中文字符的比例
    const totalChars = text.replace(/\s/g, '').length;
    if (totalChars === 0) return false;

    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const ratio = chineseChars / totalChars;

    // 如果中文占比低于50%，认为需要翻译
    return ratio < 0.5;
}

// 调用API翻译并显示
async function translateAndAppend(text, msgRowEl) {
    const apiSettings = getAPISettings();
    if (!apiSettings.apiKey) return;

    const wrap = msgRowEl.querySelector('.msg-bubble-wrap');
    if (!wrap) return;

    const translateEl = document.createElement('div');
    translateEl.className = 'msg-translate';
    translateEl.textContent = '翻译中...';
    wrap.appendChild(translateEl);

    try {
        const response = await fetch(apiSettings.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiSettings.apiKey
            },
            body: JSON.stringify({
                model: apiSettings.apiModel,
                messages: [
                    { role: 'system', content: '你是一个翻译器。将以下文本翻译成简体中文，只输出翻译结果，不要解释。' },
                    { role: 'user', content: text }
                ]
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]) {
            translateEl.textContent = data.choices[0].message.content.trim();
        } else {
            translateEl.textContent = '翻译失败';
        }
    } catch (err) {
        translateEl.textContent = '翻译失败';
    }
}

// ===== 自动记忆总结 =====
function checkAutoSummary(history) {
    const chatSettings = getChatSettings();
    if (chatSettings.memoryMode !== 'auto') return;

    const count = parseInt(chatSettings.memoryCount) || 20;
    const validHistory = history.filter(h => !h.deleted);

    // 检查是否达到总结条件
    const lastSummaryAt = parseInt(localStorage.getItem('ai-phone-last-summary-at-' + currentChatAI) || '0');
    const newMsgCount = validHistory.length - lastSummaryAt;

    if (newMsgCount >= count) {
        performSummary(validHistory, lastSummaryAt);
    }
}

async function performSummary(history, fromIndex) {
    const apiSettings = getAPISettings();
    if (!apiSettings.apiKey) return;

    // 取需要总结的消息
    const toSummarize = history.slice(fromIndex);
    if (toSummarize.length === 0) return;

    let chatText = '';
    toSummarize.forEach(h => {
        chatText += (h.role === 'user' ? '用户: ' : 'AI: ') + h.content + '\n';
    });

    try {
        const response = await fetch(apiSettings.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiSettings.apiKey
            },
            body: JSON.stringify({
                model: apiSettings.apiModel,
                messages: [
                    { role: 'system', content: '请总结以下对话的关键信息、情感变化、重要事件，用简洁的方式概括，保留重要细节。不超过300字。' },
                    { role: 'user', content: chatText }
                ]
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]) {
            const summary = data.choices[0].message.content.trim();

            // 追加到已有总结
            const existingSummary = localStorage.getItem('ai-phone-summary-' + currentChatAI) || '';
            const newSummary = existingSummary + '\n\n---\n\n' + summary;
            localStorage.setItem('ai-phone-summary-' + currentChatAI, newSummary.trim());

            // 记录总结位置
            localStorage.setItem('ai-phone-last-summary-at-' + currentChatAI, String(history.length));
        }
    } catch (err) {
        console.error('记忆总结失败:', err);
    }
}

// ===== 更新聊天列表预览 =====
function updateChatListPreview(lastMsg) {
    const chatList = document.getElementById('chat-list');
    if (!chatList) return;

    const firstItem = chatList.querySelector('.chat-list-item');
    if (firstItem) {
        const lastMsgEl = firstItem.querySelector('.chat-last-msg');
        const timeEl = firstItem.querySelector('.chat-time');
        if (lastMsgEl) lastMsgEl.textContent = lastMsg.substring(0, 30) + (lastMsg.length > 30 ? '...' : '');
        if (timeEl) {
            const now = new Date();
            timeEl.textContent = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
        }
    }
}

// ===== 自动发消息 =====
let autoMsgTimer = null;

function startAutoMsg() {
    stopAutoMsg();
    const chatSettings = getChatSettings();
    if (!chatSettings.autoMsg) return;

    const value = parseInt(chatSettings.autoMsgValue) || 30;
    const unit = chatSettings.autoMsgUnit || 'min';
    const ms = unit === 'hour' ? value * 60 * 60 * 1000 : value * 60 * 1000;

    autoMsgTimer = setInterval(async function() {
        const apiSettings = getAPISettings();
        if (!apiSettings.apiKey) return;

        const history = getChatHistory();

        const messages = buildMessages(history);
        messages.push({ role: 'system', content: '现在你需要主动给用户发一条消息。根据你的人设、当前时间、之前的聊天内容，自然地发起话题或关心对方。不要提及你是被系统触发的。' });

        try {
            const response = await fetch(apiSettings.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiSettings.apiKey
                },
                body: JSON.stringify({ model: apiSettings.apiModel, messages: messages })
            });

            const data = await response.json();
            if (data.choices && data.choices[0]) {
                const parsed = parseAIResponse(data.choices[0].message.content);
                appendMessage(parsed.reply, 'ai');
                history.push({ role: 'assistant', content: parsed.reply, time: Date.now() });
                saveChatHistory(currentChatAI, history);
                updateChatListPreview(parsed.reply);
                if (parsed.heartData.heart) saveHeartHistory(parsed.heartData);
            }
        } catch (err) {
            console.error('自动发消息失败:', err);
        }
    }, ms);
}

function stopAutoMsg() {
    if (autoMsgTimer) { clearInterval(autoMsgTimer); autoMsgTimer = null; }
}

// 页面加载时启动自动发消息
(function() {
    const chatSettings = getChatSettings();
    if (chatSettings.autoMsg) startAutoMsg();
})();

// ===== 绑定发送事件 =====
(function() {
    // 回车发送
    const input = document.getElementById('chat-input');
    if (input) {
        input.removeAttribute('onkeypress');
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
})();

// ===== 加载历史消息到界面 =====
function loadChatMessages(aiId) {
    currentChatAI = aiId || 'default';
    const container = document.getElementById('chat-messages');

    // 清空示例消息
    container.innerHTML = '';

    // 添加时间标签
    appendTimeLabel();

    // 加载历史
    const history = getChatHistory(currentChatAI);
    history.forEach(h => {
        if (h.deleted) return;
        appendMessage(h.content, h.role === 'user' ? 'user' : 'ai');
    });

    // 滚动到底部
    container.scrollTop = container.scrollHeight;
}
// ===== 手动触发AI回复 =====
function triggerAIReply() {
    if (isGenerating) return;

    var apiSettings = getAPISettings();
    if (!apiSettings.apiKey) {
        showToast('请先在设置中填写API Key');
        return;
    }

    var history = getChatHistory();
    if (history.length === 0 || history[history.length - 1].role !== 'user') {
        showToast('请先发送消息');
        return;
    }

    // 复用原有发送逻辑，但不发用户消息
    var loadingEl = appendLoading();
    showStopButton();
    isGenerating = true;
    abortController = new AbortController();

    (async function() {
        try {
            var lastUserMsg = history.filter(function(h) { return h.role === 'user'; }).pop();
            var messages = buildMessages(history, lastUserMsg ? lastUserMsg.content : '');

            var data = await callAPI(apiSettings.apiKey, apiSettings.apiUrl, apiSettings.apiModel, messages, abortController.signal);

            if (!data && apiSettings.subApiKey && apiSettings.subApiUrl && isGenerating) {
                appendSystemMsg('⚠️ 主API不可用，切换到副API...');
                data = await callAPI(apiSettings.subApiKey, apiSettings.subApiUrl, apiSettings.subApiModel || apiSettings.apiModel, messages, abortController.signal);
            }

            loadingEl.remove();

            if (!isGenerating) {
                appendSystemMsg('⏹ 已终止生成');
                hideStopButton();
                saveChatHistory(currentChatAI, history);
                return;
            }

            if (data && data.choices && data.choices[0]) {
                var rawReply = data.choices[0].message.content;
                var parsed = parseAIResponse(rawReply);
                var chatSettings = getChatSettings();
                var minCount = parseInt(chatSettings.replyMin) || 1;
                var maxCount = parseInt(chatSettings.replyMax) || 1;
                var replyCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
                var replies = splitReply(parsed.reply, replyCount);

                for (var i = 0; i < replies.length; i++) {
                    if (!isGenerating) break;
                    await delay(300 + Math.random() * 700);
                    if (!isGenerating) break;
                    var msgEl = appendMessage(replies[i], 'ai');
                    if (chatSettings.translate && needsTranslation(replies[i])) {
                        await translateAndAppend(replies[i], msgEl);
                    }
                }

                history.push({ role: 'assistant', content: parsed.reply, time: Date.now() });
                saveChatHistory(currentChatAI, history);
                if (parsed.heartData.heart) saveHeartHistory(parsed.heartData);
                checkAutoSummary(history);
                updateChatListPreview(parsed.reply);
            } else {
                appendSystemMsg('❌ 请求失败，请检查API设置');
            }
        } catch (err) {
            loadingEl.remove();
            if (err.name === 'AbortError') {
                appendSystemMsg('⏹ 已终止生成');
            } else {
                appendSystemMsg('❌ 错误：' + err.message);
            }
        }

        isGenerating = false;
        hideStopButton();
        saveChatHistory(currentChatAI, history);
    })();
}

// ===== 终止生成 =====
function stopGeneration() {
    isGenerating = false;
    if (abortController) {
        abortController.abort();
        abortController = null;
    }
}

// ===== 输入框按钮切换 =====
function onChatInputChange() {
    var input = document.getElementById('chat-input');
    var text = input ? input.value.trim() : '';
    var sendBtn = document.getElementById('send-btn');
    var replyBtn = document.getElementById('reply-btn');
    var stopBtn = document.getElementById('stop-btn');

    // 先全部隐藏
    if (sendBtn) sendBtn.style.display = 'none';
    if (replyBtn) replyBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'none';

    if (isGenerating) {
        if (stopBtn) stopBtn.style.display = 'inline-flex';
    } else if (text.length > 0) {
        if (sendBtn) sendBtn.style.display = 'inline-block';
    } else {
        // 无文字：检查最后一条消息
        var history = getChatHistory();
        var lastMsg = history.length > 0 ? history[history.length - 1] : null;
        if (lastMsg && lastMsg.role === 'user') {
            if (replyBtn) replyBtn.style.display = 'inline-flex';
        } else {
            if (stopBtn) stopBtn.style.display = 'inline-flex';
        }
    }
}

function showStopButton() {
    var sendBtn = document.getElementById('send-btn');
    var replyBtn = document.getElementById('reply-btn');
    var stopBtn = document.getElementById('stop-btn');
    if (sendBtn) sendBtn.style.display = 'none';
    if (replyBtn) replyBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-flex';
}

function hideStopButton() {
    onChatInputChange();
}
