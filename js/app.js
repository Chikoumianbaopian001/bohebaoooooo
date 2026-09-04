// ===== AI Phone 主控制 =====

// ----- 时间更新 -----
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = hours + ':' + minutes;
    
    const days = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dateStr = month + '月' + date + '日 ' + days[now.getDay()];
    
    const lockTime = document.getElementById('lock-time');
    const lockDate = document.getElementById('lock-date');
    if (lockTime) lockTime.textContent = timeStr;
    if (lockDate) lockDate.textContent = dateStr;
}

updateTime();
setInterval(updateTime, 1000);

// ----- 页面切换 -----
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add('active');
    }
    // ★ 切换页面后重新应用状态栏状态
    var saved = localStorage.getItem('ai-phone-statusbar-enabled');
    applyStatusBar(saved !== 'false');
}

// ----- 锁屏开关检测 -----
(function() {
    const lockEnabled = localStorage.getItem('ai-phone-lock-enabled');
    if (lockEnabled === 'false') {
        switchPage('page-home');
    }
})();

function toggleLockScreen() {
    const enabled = document.getElementById('global-lock-enabled').checked;
    localStorage.setItem('ai-phone-lock-enabled', enabled ? 'true' : 'false');
}

// ----- 状态栏开关 -----
function toggleStatusBar() {
    var enabled = document.getElementById('global-statusbar-enabled').checked;
    localStorage.setItem('ai-phone-statusbar-enabled', enabled ? 'true' : 'false');
    applyStatusBar(enabled);
}

function applyStatusBar(enabled) {
    document.querySelectorAll('.status-bar').forEach(function(bar) {
        if (enabled) {
            bar.style.display = 'flex';
        } else {
            bar.style.display = 'none';
        }
    });
}

// 加载状态栏开关状态
(function() {
    var saved = localStorage.getItem('ai-phone-statusbar-enabled');
    var enabled = saved !== 'false';
    var checkbox = document.getElementById('global-statusbar-enabled');
    if (checkbox) checkbox.checked = enabled;
    // 延迟执行，确保DOM都加载完
    setTimeout(function() {
        applyStatusBar(enabled);
    }, 100);
})();

// 加载锁屏开关状态
(function() {
    const lockEnabled = localStorage.getItem('ai-phone-lock-enabled');
    const checkbox = document.getElementById('global-lock-enabled');
    if (checkbox) {
        checkbox.checked = lockEnabled !== 'false';
    }
})();

// ----- 锁屏上划解锁 -----
(function() {
    const lockscreen = document.getElementById('page-lockscreen');
    if (!lockscreen) return;
    
    let startY = 0;
    let isDragging = false;

    lockscreen.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
        isDragging = true;
    });

    lockscreen.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        const diff = startY - currentY;
        if (diff > 0) {
            lockscreen.style.transform = 'translateY(' + (-diff * 0.4) + 'px)';
            lockscreen.style.opacity = 1 - (diff / 500);
        }
    });

    lockscreen.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        isDragging = false;
        const endY = e.changedTouches[0].clientY;
        const diff = startY - endY;
        if (diff > 100) {
            lockscreen.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            lockscreen.style.transform = 'translateY(-100%)';
            lockscreen.style.opacity = '0';
            setTimeout(function() {
                switchPage('page-home');
                lockscreen.style.transition = '';
                lockscreen.style.transform = '';
                lockscreen.style.opacity = '';
            }, 300);
        } else {
            lockscreen.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            lockscreen.style.transform = '';
            lockscreen.style.opacity = '';
            setTimeout(function() { lockscreen.style.transition = ''; }, 300);
        }
    });

    lockscreen.addEventListener('mousedown', function(e) {
        startY = e.clientY;
        isDragging = true;
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const diff = startY - e.clientY;
        if (diff > 0) {
            lockscreen.style.transform = 'translateY(' + (-diff * 0.4) + 'px)';
            lockscreen.style.opacity = 1 - (diff / 500);
        }
    });

    document.addEventListener('mouseup', function(e) {
        if (!isDragging) return;
        isDragging = false;
        const diff = startY - e.clientY;
        if (diff > 100) {
            lockscreen.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            lockscreen.style.transform = 'translateY(-100%)';
            lockscreen.style.opacity = '0';
            setTimeout(function() {
                switchPage('page-home');
                lockscreen.style.transition = '';
                lockscreen.style.transform = '';
                lockscreen.style.opacity = '';
            }, 300);
        } else {
            lockscreen.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            lockscreen.style.transform = '';
            lockscreen.style.opacity = '';
            setTimeout(function() { lockscreen.style.transition = ''; }, 300);
        }
    });
})();

// ----- 桌面App点击 -----
document.getElementById('app-wechat')?.addEventListener('click', function() { switchPage('page-wechat'); });
document.getElementById('app-worldbook')?.addEventListener('click', function() { switchPage('page-worldbook'); });
document.getElementById('app-settings')?.addEventListener('click', function() { switchPage('page-settings'); });

// ----- 电量实时检测 -----
(function() {
    function updateBattery(battery) {
        const level = Math.round(battery.level * 100);
        const charging = battery.charging;
        document.querySelectorAll('.battery-level').forEach(el => { el.style.width = level + '%'; });
        document.querySelectorAll('.battery-percent').forEach(el => { el.textContent = level + '%'; });
        document.querySelectorAll('.battery-icon').forEach(el => {
            el.classList.remove('battery-low', 'battery-charging');
            if (charging) el.classList.add('battery-charging');
            else if (level <= 20) el.classList.add('battery-low');
        });
    }
    if (navigator.getBattery) {
        navigator.getBattery().then(function(battery) {
            updateBattery(battery);
            battery.addEventListener('levelchange', function() { updateBattery(battery); });
            battery.addEventListener('chargingchange', function() { updateBattery(battery); });
        });
    }
})();

// ----- 状态栏时间 -----
function updateStatusTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.querySelectorAll('.status-time-small').forEach(el => { el.textContent = hours + ':' + minutes; });
}
updateStatusTime();
setInterval(updateStatusTime, 1000);

// ----- 天气组件时间 -----
function updateWeatherTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const days = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const wt = document.getElementById('weather-time');
    const wd = document.getElementById('weather-date');
    const wday = document.getElementById('weather-day');
    const icity = document.getElementById('icity-date');
    if (wt) wt.textContent = hours + ':' + minutes;
    if (wd) wd.textContent = month + '月' + date + '日';
    if (wday) wday.textContent = days[now.getDay()];
    if (icity) icity.textContent = month + '/' + date + ' ' + days[now.getDay()];
}
updateWeatherTime();
setInterval(updateWeatherTime, 1000);

// ----- 天气设置 -----
function openWeatherSetting() {
    document.getElementById('weather-modal').style.display = 'flex';
    const saved = JSON.parse(localStorage.getItem('ai-phone-weather') || '{}');
    if (saved.realCity) document.getElementById('weather-real-city').value = saved.realCity;
    if (saved.displayCity) document.getElementById('weather-display-city').value = saved.displayCity;
}
function closeWeatherSetting() { document.getElementById('weather-modal').style.display = 'none'; }
function saveWeatherSetting() {
    const realCity = document.getElementById('weather-real-city').value.trim();
    const displayCity = document.getElementById('weather-display-city').value.trim();
    if (!realCity) { alert('请填写真实城市名'); return; }
    const weatherData = { realCity, displayCity: displayCity || realCity };
    localStorage.setItem('ai-phone-weather', JSON.stringify(weatherData));
    document.getElementById('weather-city').textContent = displayCity || realCity;
    closeWeatherSetting();
    fetchWeather(realCity);
}

async function fetchWeather(city) {
    try {
        document.getElementById('weather-temp').textContent = '加载中...';
        const url = 'https://wttr.in/' + encodeURIComponent(city) + '?format=j1';
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.current_condition && data.current_condition[0]) {
            const current = data.current_condition[0];
            const temp = current.temp_C;
            const icon = getWeatherEmoji(parseInt(current.weatherCode));
            document.getElementById('weather-temp').textContent = temp + '°C';
            document.getElementById('weather-icon').textContent = icon;
            const saved = JSON.parse(localStorage.getItem('ai-phone-weather') || '{}');
            saved.cachedTemp = temp; saved.cachedIcon = icon; saved.lastUpdate = Date.now();
            localStorage.setItem('ai-phone-weather', JSON.stringify(saved));
        } else { document.getElementById('weather-temp').textContent = '获取失败'; }
    } catch (err) { document.getElementById('weather-temp').textContent = '网络错误'; }
}
function getWeatherEmoji(code) {
    if (code === 113) return '☀️'; if (code === 116) return '⛅'; if (code === 119 || code === 122) return '☁️';
    if (code === 143) return '🌫️'; if ([176,263,266].includes(code)) return '🌦️';
    if ([179,323,326].includes(code)) return '🌨️'; if (code === 200) return '⛈️';
    if ([227,230].includes(code)) return '❄️'; if (code >= 293 && code <= 356) return '🌧️';
    if (code >= 359) return '⛈️'; return '🌤️';
}
(function() {
    const saved = JSON.parse(localStorage.getItem('ai-phone-weather') || '{}');
    if (saved.displayCity) document.getElementById('weather-city').textContent = saved.displayCity;
    if (saved.cachedTemp) document.getElementById('weather-temp').textContent = saved.cachedTemp + '°C';
    if (saved.cachedIcon) document.getElementById('weather-icon').textContent = saved.cachedIcon;
    if (saved.realCity) { if (Date.now() - (saved.lastUpdate || 0) > 30*60*1000) fetchWeather(saved.realCity); }
})();
setInterval(function() { const s = JSON.parse(localStorage.getItem('ai-phone-weather') || '{}'); if (s.realCity) fetchWeather(s.realCity); }, 30*60*1000);

// ----- icity头像 -----
function setIcityAvatar() { document.getElementById('icity-avatar-modal').style.display = 'flex'; }
function closeIcityAvatar() { document.getElementById('icity-avatar-modal').style.display = 'none'; }
function saveIcityAvatar() {
    const url = document.getElementById('icity-avatar-url').value.trim();
    const fileInput = document.getElementById('icity-avatar-file');
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) { setAvatarImage(e.target.result); localStorage.setItem('ai-phone-icity-avatar', e.target.result); };
        reader.readAsDataURL(fileInput.files[0]);
    } else if (url) { setAvatarImage(url); localStorage.setItem('ai-phone-icity-avatar', url); }
    closeIcityAvatar();
}
function setAvatarImage(src) { document.getElementById('icity-avatar').innerHTML = '<img src="' + src + '" alt="">'; }
(function() { const s = localStorage.getItem('ai-phone-icity-avatar'); if (s) setAvatarImage(s); })();

// ----- icity文字 -----
document.getElementById('icity-text')?.addEventListener('blur', function() {
    const text = this.textContent.trim();
    if (text && text !== '写点什么...') localStorage.setItem('ai-phone-icity-text', text);
});
(function() { const s = localStorage.getItem('ai-phone-icity-text'); if (s) { const el = document.getElementById('icity-text'); if (el) el.textContent = s; } })();

// ----- 长按编辑模式 -----
(function() {
    const homeContent = document.querySelector('.home-content');
    if (!homeContent) return;
    let longPressTimer = null; let isEditing = false;
    homeContent.addEventListener('touchstart', function(e) {
        const target = e.target.closest('.home-app, .home-widget');
        if (!target) return;
        longPressTimer = setTimeout(function() { isEditing = true; homeContent.classList.add('editing'); if (navigator.vibrate) navigator.vibrate(50); }, 600);
    });
    homeContent.addEventListener('touchend', function() { clearTimeout(longPressTimer); });
    homeContent.addEventListener('touchmove', function() { clearTimeout(longPressTimer); });
    document.getElementById('page-home')?.addEventListener('click', function(e) {
        if (isEditing && !e.target.closest('.home-app, .home-widget')) { isEditing = false; homeContent.classList.remove('editing'); }
    });
    homeContent.addEventListener('mousedown', function(e) {
        const target = e.target.closest('.home-app, .home-widget');
        if (!target) return;
        longPressTimer = setTimeout(function() { isEditing = true; homeContent.classList.add('editing'); }, 600);
    });
    homeContent.addEventListener('mouseup', function() { clearTimeout(longPressTimer); });
})();

// ----- 微信Tab切换 -----
function switchWechatTab(tabName, tabEl) {
    document.querySelectorAll('.wechat-tab-content').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('tab-' + tabName);
    if (target) target.classList.add('active');
    document.querySelectorAll('.wechat-tab').forEach(el => el.classList.remove('active'));
    if (tabEl) tabEl.classList.add('active');
    const titles = { chats: '微信', contacts: '通讯录', moments: '朋友圈', profile: '我' };
    document.getElementById('wechat-title').textContent = titles[tabName] || '微信';
}
// ----- 聊天界面 -----
function closeChat() { switchPage('page-wechat'); }
function openCallChoice() { document.getElementById('call-modal').style.display = 'flex'; }
function closeCallChoice() { document.getElementById('call-modal').style.display = 'none'; }
function startCall(type) { closeCallChoice(); alert((type === 'voice' ? '语音' : '视频') + '通话 - 后续实现'); }

function toggleVoice() {
    const inputWrap = document.getElementById('chat-input-wrap');
    const voiceBtn = document.getElementById('chat-voice-btn');
    const toggle = document.getElementById('voice-toggle');
    if (voiceBtn.style.display === 'none') {
        voiceBtn.style.display = 'block'; inputWrap.style.display = 'none';
        toggle.innerHTML = '<img src="https://nos.netease.com/ysf/6bf52c7f6af2ecb998f806e1a4e511b9.png" alt="键盘" style="width:28px;height:28px;">';
    } else {
        voiceBtn.style.display = 'none'; inputWrap.style.display = 'block';
        toggle.innerHTML = '<img src="https://nos.netease.com/ysf/6bf52c7f6af2ecb998f806e1a4e511b9.png" alt="语音" style="width:28px;height:28px;">';
    }
    // 切换后重新检测按钮状态
    onChatInputChange();

}

function toggleEmoji() {
    const panel = document.getElementById('emoji-panel'); const plusPanel = document.getElementById('plus-panel');
    plusPanel.style.display = 'none';
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
}
function togglePlus() {
    const panel = document.getElementById('plus-panel'); const emojiPanel = document.getElementById('emoji-panel');
    emojiPanel.style.display = 'none';
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function toggleVoiceText(voiceEl) {
    const wrap = voiceEl.closest('.msg-bubble-wrap');
    const textEl = wrap.querySelector('.msg-voice-text');
    if (!textEl) return;
    textEl.style.display = textEl.style.display === 'none' ? 'block' : 'none';
}

// ----- 聊天设置 - 背景 -----
function openBgSetting() { document.getElementById('bg-modal').style.display = 'flex'; }
function closeBgSetting() { document.getElementById('bg-modal').style.display = 'none'; }
function saveBgSetting() {
    const url = document.getElementById('cs-bg-url').value.trim();
    const fileInput = document.getElementById('cs-bg-file');
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) { applyChatBg(e.target.result); localStorage.setItem('ai-phone-chat-bg', e.target.result); };
        reader.readAsDataURL(fileInput.files[0]);
    } else if (url) { applyChatBg(url); localStorage.setItem('ai-phone-chat-bg', url); }
    closeBgSetting();
}
function applyChatBg(src) {
    const preview = document.getElementById('cs-bg-preview');
    preview.innerHTML = '<img src="' + src + '" alt="背景">';
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) { chatMessages.style.backgroundImage = 'url(' + src + ')'; chatMessages.style.backgroundSize = 'cover'; chatMessages.style.backgroundPosition = 'center'; }
}
(function() { const s = localStorage.getItem('ai-phone-chat-bg'); if (s) applyChatBg(s); })();

// ----- 气泡CSS / 界面CSS -----
function saveBubbleCss() { const css = document.getElementById('bubble-css-editor').value; localStorage.setItem('ai-phone-bubble-css', css); applyCustomCss('bubble', css); alert('气泡样式已保存！'); }
function saveUiCss() { const css = document.getElementById('ui-css-editor').value; localStorage.setItem('ai-phone-ui-css', css); applyCustomCss('ui', css); alert('界面样式已保存！'); }
function applyCustomCss(type, css) {
    let styleEl = document.getElementById('custom-' + type + '-css');
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'custom-' + type + '-css'; document.head.appendChild(styleEl); }
    styleEl.textContent = css;
}
(function() {
    const bubbleCss = localStorage.getItem('ai-phone-bubble-css');
    const uiCss = localStorage.getItem('ai-phone-ui-css');
    if (bubbleCss) { applyCustomCss('bubble', bubbleCss); const e = document.getElementById('bubble-css-editor'); if (e) e.value = bubbleCss; }
    if (uiCss) { applyCustomCss('ui', uiCss); const e = document.getElementById('ui-css-editor'); if (e) e.value = uiCss; }
})();

// ----- 记忆总结 -----
document.getElementById('cs-memory-manual')?.addEventListener('change', function() { document.getElementById('cs-auto-setting').style.display = 'none'; });
document.getElementById('cs-memory-auto')?.addEventListener('change', function() { document.getElementById('cs-auto-setting').style.display = 'block'; });
function manualSummary() { alert('正在总结聊天记忆... - 后续实现'); }
function toggleAutoMsg() {
    const checked = document.getElementById('cs-auto-msg').checked;
    document.getElementById('cs-auto-msg-setting').style.display = checked ? 'block' : 'none';
}

// ----- 转账交互 -----
let currentTransferEl = null;
function acceptTransfer(el) {
    if (el.classList.contains('accepted')) return;
    currentTransferEl = el;
    const amount = el.querySelector('.tf-body-amount').textContent;
    document.getElementById('tf-modal-amount').innerHTML = '<span class="tf-modal-amount-symbol">¥</span>' + amount.replace('¥', '');
    document.getElementById('transfer-modal').style.display = 'flex';
}
function claimTransfer() {
    if (currentTransferEl) {
        currentTransferEl.classList.add('accepted');
        currentTransferEl.querySelector('.tf-footer').textContent = '已收款';
        currentTransferEl.querySelector('.tf-body-icon img').src = 'https://nos.netease.com/ysf/79ffacae38e3e924d8fa83cf8606e354.png';
        currentTransferEl.onclick = null;
        const amountText = currentTransferEl.querySelector('.tf-body-amount').textContent;
        const amount = parseFloat(amountText.replace(/[^0-9.]/g, ''));
        if (!isNaN(amount)) addToWallet(amount);
    }
    closeTransferModal();
}
function closeTransferModal() { document.getElementById('transfer-modal').style.display = 'none'; currentTransferEl = null; }

// ----- 钱包 -----
function getWalletBalance() { const s = localStorage.getItem('ai-phone-wallet'); return s ? parseFloat(s) : 10000; }
function setWalletBalance(amount) { localStorage.setItem('ai-phone-wallet', amount.toFixed(2)); }
function addToWallet(amount) { setWalletBalance(getWalletBalance() + amount); }
function subtractFromWallet(amount) { const b = getWalletBalance(); if (b >= amount) { setWalletBalance(b - amount); return true; } return false; }

// ----- 全局设置 -----
// 替换原来的 saveGlobalSettings 和 loadGlobalSettings

function saveGlobalSettings() {
    var settings = {
        apiKey: document.getElementById('global-api-key').value || '',
        apiUrl: document.getElementById('global-api-url').value || '',
        apiModel: document.getElementById('global-api-model').value || '',
        subApiKey: document.getElementById('global-sub-api-key').value || '',
        subApiUrl: document.getElementById('global-sub-api-url').value || '',
        subApiModel: document.getElementById('global-sub-api-model').value || '',
        minimaxKey: document.getElementById('global-minimax-key').value || '',
        minimaxGroup: document.getElementById('global-minimax-group').value || '',
        minimaxUrl: document.getElementById('global-minimax-url').value || '',
        imageKey: document.getElementById('global-image-key').value || '',
        imageUrl: document.getElementById('global-image-url').value || '',
        imageModel: document.getElementById('global-image-model').value || '',
    };
    
    // 调试：检查是否真的读到了值
    console.log('准备保存的API Key长度:', settings.apiKey.length);
    console.log('准备保存的API URL:', settings.apiUrl);
    console.log('准备保存的模型:', settings.apiModel);
    
    if (!settings.apiKey && !settings.apiUrl) {
        console.warn('警告：API Key和URL都为空！');
    }
    
    try {
        localStorage.setItem('ai-phone-global-settings', JSON.stringify(settings));
        
        // 验证保存是否成功
        var verify = localStorage.getItem('ai-phone-global-settings');
        if (verify) {
            var parsed = JSON.parse(verify);
            console.log('保存验证 - API Key长度:', parsed.apiKey.length);
            console.log('保存验证 - API URL:', parsed.apiUrl);
            showToast('设置已保存！✅');
        } else {
            console.error('保存后读取失败！');
            showToast('保存失败！localStorage可能不可用');
        }
    } catch(e) {
        console.error('保存失败:', e);
        showToast('保存失败：' + e.message);
    }
}

function loadGlobalSettings() {
    try {
        var saved = localStorage.getItem('ai-phone-global-settings');
        console.log('读取到的原始数据:', saved ? '有数据(长度' + saved.length + ')' : '无数据');
        
        if (!saved) {
            console.log('没有已保存的设置');
            return;
        }
        
        var s = JSON.parse(saved);
        console.log('解析成功，API Key长度:', (s.apiKey || '').length);
        
        var fields = {
            'global-api-key': s.apiKey,
            'global-api-url': s.apiUrl,
            'global-api-model': s.apiModel,
            'global-sub-api-key': s.subApiKey,
            'global-sub-api-url': s.subApiUrl,
            'global-sub-api-model': s.subApiModel,
            'global-minimax-key': s.minimaxKey,
            'global-minimax-group': s.minimaxGroup,
            'global-minimax-url': s.minimaxUrl,
            'global-image-key': s.imageKey,
            'global-image-url': s.imageUrl,
            'global-image-model': s.imageModel,
        };
        
        var loadedCount = 0;
        for (var id in fields) {
            var el = document.getElementById(id);
            if (el && fields[id]) {
                el.value = fields[id];
                loadedCount++;
            } else if (!el) {
                console.warn('找不到元素:', id);
            }
        }
        console.log('成功加载了', loadedCount, '个字段');
        
    } catch(e) {
        console.error('加载设置失败:', e);
    }
}

// ★ 删除原来的 DOMContentLoaded 监听器 ★
// 替换为：

(function initSettings() {
    function doLoad() {
        var keyEl = document.getElementById('global-api-key');
        if (!keyEl) {
            // 元素还不存在，稍后重试
            setTimeout(doLoad, 50);
            return;
        }
        loadGlobalSettings();
        loadChatSettings();
        
        // 再延迟一次，对抗浏览器自动填充
        setTimeout(function() {
            loadGlobalSettings();
        }, 500);
        
        console.log('✅ 所有设置已加载');
    }
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(doLoad, 0);
    } else {
        document.addEventListener('DOMContentLoaded', doLoad);
    }
})();

// ----- 聊天设置 保存/加载 -----
function saveChatSettings() {
    const cs = {
    	nickname: document.getElementById('cs-nickname').value,
        summaryWords: document.getElementById('cs-summary-words').value,
        replyMin: document.getElementById('cs-reply-min').value, replyMax: document.getElementById('cs-reply-max').value,
        memoryMode: document.querySelector('input[name="memory-mode"]:checked')?.value || 'manual',
        memoryCount: document.getElementById('cs-memory-count').value,
        translate: document.getElementById('cs-translate').checked,
        autoMsg: document.getElementById('cs-auto-msg').checked, autoMsgValue: document.getElementById('cs-auto-msg-value').value, autoMsgUnit: document.getElementById('cs-auto-msg-unit').value,
        minimaxVoiceId: document.getElementById('cs-minimax-voice-id').value,
        minimaxVoiceMsg: document.getElementById('cs-minimax-voice-msg').checked, minimaxCall: document.getElementById('cs-minimax-call').checked,
        imagePrompt: document.getElementById('cs-image-prompt').value,
        timeAware: document.getElementById('cs-time-aware').checked, blockAi: document.getElementById('cs-block-ai').checked, allowBlock: document.getElementById('cs-allow-block').checked,
    };
    localStorage.setItem('ai-phone-chat-settings', JSON.stringify(cs));
}
function loadChatSettings() {
    const saved = localStorage.getItem('ai-phone-chat-settings'); if (!saved) return;
    const s = JSON.parse(saved);
    if (s.nickname) document.getElementById('cs-nickname').value = s.nickname;
    if (s.summaryWords) document.getElementById('cs-summary-words').value = s.summaryWords;
    if (s.replyMin) document.getElementById('cs-reply-min').value = s.replyMin;
    if (s.replyMax) document.getElementById('cs-reply-max').value = s.replyMax;
    if (s.memoryMode === 'auto') { document.getElementById('cs-memory-auto').checked = true; document.getElementById('cs-auto-setting').style.display = 'block'; }
    if (s.memoryCount) document.getElementById('cs-memory-count').value = s.memoryCount;
    if (s.translate) document.getElementById('cs-translate').checked = true;
    if (s.autoMsg) { document.getElementById('cs-auto-msg').checked = true; document.getElementById('cs-auto-msg-setting').style.display = 'block'; }
    if (s.autoMsgValue) document.getElementById('cs-auto-msg-value').value = s.autoMsgValue;
    if (s.autoMsgUnit) document.getElementById('cs-auto-msg-unit').value = s.autoMsgUnit;
    if (s.minimaxVoiceId) document.getElementById('cs-minimax-voice-id').value = s.minimaxVoiceId;
    if (s.minimaxVoiceMsg) document.getElementById('cs-minimax-voice-msg').checked = true;
    if (s.minimaxCall) document.getElementById('cs-minimax-call').checked = true;
    if (s.imagePrompt) document.getElementById('cs-image-prompt').value = s.imagePrompt;
    if (s.timeAware) document.getElementById('cs-time-aware').checked = true;
    if (s.blockAi) document.getElementById('cs-block-ai').checked = true;
    if (s.allowBlock) document.getElementById('cs-allow-block').checked = true;
}

(function() {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) { if (m.target.id === 'page-chat-settings' && !m.target.classList.contains('active')) saveChatSettings(); });
    });
    const csp = document.getElementById('page-chat-settings');
    if (csp) observer.observe(csp, { attributes: true, attributeFilter: ['class'] });
})();

// ----- 删除确认弹窗 -----
let pendingSingleDelete = false;
function closeDeleteConfirm() { document.getElementById('delete-confirm-modal').style.display = 'none'; pendingSingleDelete = false; }
function confirmDelete() {
    if (pendingSingleDelete && currentMsgRow) {
        currentMsgRow.classList.add('deleted'); currentMsgRow.setAttribute('data-deleted', 'true');
        showToast('已删除'); pendingSingleDelete = false;
    } else {
        const selected = document.querySelectorAll('.msg-row.selected');
        const count = selected.length;
        selected.forEach(el => { el.classList.add('deleted'); el.setAttribute('data-deleted', 'true'); });
        exitMultiSelect(); showToast('已删除 ' + count + ' 条消息');
    }
    closeDeleteConfirm();
}

// ===== 长按消息菜单 =====
let currentMsgRow = null;
let isMultiSelect = false;

(function() {
    const chatMessages = document.getElementById('chat-messages'); if (!chatMessages) return;
    let longPressTimer = null;
    chatMessages.addEventListener('touchstart', function(e) {
        const msgRow = e.target.closest('.msg-row'); if (!msgRow || isMultiSelect) return;
        longPressTimer = setTimeout(function() { showContextMenu(msgRow, e.touches[0].clientX, e.touches[0].clientY); if (navigator.vibrate) navigator.vibrate(30); }, 500);
    });
    chatMessages.addEventListener('touchmove', function() { clearTimeout(longPressTimer); });
    chatMessages.addEventListener('touchend', function(e) {
        clearTimeout(longPressTimer);
        if (isMultiSelect) { const msgRow = e.target.closest('.msg-row'); if (msgRow) { e.preventDefault(); msgRow.classList.toggle('selected'); } }
    });
    chatMessages.addEventListener('mousedown', function(e) {
        const msgRow = e.target.closest('.msg-row'); if (!msgRow || isMultiSelect) return;
        longPressTimer = setTimeout(function() { showContextMenu(msgRow, e.clientX, e.clientY); }, 500);
    });
    chatMessages.addEventListener('mouseup', function(e) {
        clearTimeout(longPressTimer);
        if (isMultiSelect) { const msgRow = e.target.closest('.msg-row'); if (msgRow) msgRow.classList.toggle('selected'); }
    });
    document.addEventListener('click', function(e) { if (!e.target.closest('.msg-context-menu')) hideContextMenu(); });
    document.addEventListener('touchstart', function(e) { if (!e.target.closest('.msg-context-menu') && !e.target.closest('.msg-row')) hideContextMenu(); });
})();

function showContextMenu(msgRow, x, y) {
    currentMsgRow = msgRow;
    const menu = document.getElementById('msg-context-menu');
    const items = document.getElementById('context-menu-items');
    const isRight = msgRow.classList.contains('msg-right');
    const isAi = msgRow.classList.contains('msg-left');
    let html = '';
    if (isAi) {
        html += '<div class="context-menu-item" onclick="rerollMsg()">重Roll</div>';
        html += '<div class="context-menu-item" onclick="editMsg()">修改</div>';
        html += '<div class="context-menu-item" onclick="translateMsg()">翻译</div>';
        html += '<div class="context-menu-item" onclick="favoriteMsg()">收藏</div>';
        html += '<div class="context-menu-item" onclick="enterMultiSelect()">多选</div>';
        html += '<div class="context-menu-item" onclick="deleteMsg()">删除</div>';
    } else if (isRight) {
        html += '<div class="context-menu-item" onclick="recallMsg()">撤回</div>';
        html += '<div class="context-menu-item" onclick="editMsg()">修改</div>';
        html += '<div class="context-menu-item" onclick="translateMsg()">翻译</div>';
        html += '<div class="context-menu-item" onclick="deleteMsg()">删除</div>';
        html += '<div class="context-menu-item" onclick="enterMultiSelect()">多选</div>';
    }
    items.innerHTML = html;
    menu.style.display = 'block';
    const menuRect = menu.getBoundingClientRect(); const viewW = window.innerWidth;
    let left = x - menuRect.width / 2; let top = y - menuRect.height - 10;
    if (left < 10) left = 10; if (left + menuRect.width > viewW - 10) left = viewW - menuRect.width - 10; if (top < 10) top = y + 10;
    menu.style.left = left + 'px'; menu.style.top = top + 'px';
}
function hideContextMenu() { document.getElementById('msg-context-menu').style.display = 'none'; }
//重roll
function rerollMsg() {
    hideContextMenu();
    if (!currentMsgRow) return;
    if (isGenerating) {
        showToast('AI正在回复中...');
        return;
    }

    var apiSettings = getAPISettings();
    if (!apiSettings.apiKey) {
        showToast('请先在设置中填写API Key');
        return;
    }

    var history = getChatHistory();

    // 找到最后一条用户消息的位置
    var lastUserIndex = -1;
    for (var i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'user') {
            lastUserIndex = i;
            break;
        }
    }

    if (lastUserIndex === -1) {
        showToast('找不到用户消息');
        return;
    }

    // 删掉这条用户消息之后的所有AI消息
    var userMsg = history[lastUserIndex];
    history = history.slice(0, lastUserIndex + 1);
    saveChatHistory(currentChatAI, history);

    // 从界面上删掉这些AI消息
    var container = document.getElementById('chat-messages');
    var rows = container.querySelectorAll('.msg-row');
    var foundUser = false;
    for (var j = rows.length - 1; j >= 0; j--) {
        if (rows[j].classList.contains('msg-right')) {
            // 碰到用户消息就停
            break;
        }
        if (rows[j].classList.contains('msg-left')) {
            rows[j].remove();
        }
    }

    // 调用AI重新生成
    var loadingEl = appendLoading();
    showStopButton();
    isGenerating = true;
    abortController = new AbortController();

    (async function() {
        try {
            var messages = buildMessages(history, userMsg.content);
            var data = await callAPI(apiSettings.apiKey, apiSettings.apiUrl, apiSettings.apiModel, messages, abortController.signal);

            if (!data && apiSettings.subApiKey && apiSettings.subApiUrl && isGenerating) {
                appendSystemMsg('⚠️ 主API不可用，切换到副API...');
                data = await callAPI(apiSettings.subApiKey, apiSettings.subApiUrl, apiSettings.subApiModel || apiSettings.apiModel, messages, abortController.signal);
            }

            loadingEl.remove();

            if (!isGenerating) {
                appendSystemMsg('⏹ 已终止生成');
                isGenerating = false;
                hideStopButton();
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
                    history.push({ role: 'assistant', content: replies[i], time: Date.now() });
                    if (chatSettings.translate && needsTranslation(replies[i])) {
                        await translateAndAppend(replies[i], msgEl);
                    }
                }

                saveChatHistory(currentChatAI, history);
                if (parsed.heartData.heart) saveHeartHistory(parsed.heartData);
                updateChatListPreview(replies[replies.length - 1]);
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

function editMsg() {
    hideContextMenu(); if (!currentMsgRow) return;
    const bubble = currentMsgRow.querySelector('.msg-bubble'); if (!bubble || bubble.classList.contains('msg-voice')) return;
    bubble.setAttribute('contenteditable', 'true'); bubble.focus(); bubble.style.outline = '2px solid #07c160';
    const range = document.createRange(); range.selectNodeContents(bubble); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    function saveEdit() { bubble.setAttribute('contenteditable', 'false'); bubble.style.outline = ''; bubble.removeEventListener('blur', saveEdit); bubble.removeEventListener('keydown', handleKey); }
    function handleKey(e) { if (e.key === 'Enter') { e.preventDefault(); bubble.blur(); } }
    bubble.addEventListener('blur', saveEdit); bubble.addEventListener('keydown', handleKey);
}
function translateMsg() {
    hideContextMenu(); if (!currentMsgRow) return;
    const wrap = currentMsgRow.querySelector('.msg-bubble-wrap'); const bubble = currentMsgRow.querySelector('.msg-bubble'); if (!wrap || !bubble) return;
    const existing = wrap.querySelector('.msg-translate'); if (existing) { existing.remove(); return; }
    const el = document.createElement('div'); el.className = 'msg-translate'; el.textContent = '翻译中...'; wrap.appendChild(el);
    setTimeout(function() { el.textContent = '（翻译功能将在接入API后生效）'; }, 800);
}
function favoriteMsg() {
    hideContextMenu(); if (!currentMsgRow) return;
    const bubble = currentMsgRow.querySelector('.msg-bubble'); const imageText = currentMsgRow.querySelector('.msg-image-text');
    const content = bubble ? bubble.textContent : (imageText ? imageText.textContent : ''); if (!content) return;
    const favorites = JSON.parse(localStorage.getItem('ai-phone-favorites') || '[]');
    favorites.push({ text: content.trim(), time: new Date().toLocaleString(), id: Date.now() });
    localStorage.setItem('ai-phone-favorites', JSON.stringify(favorites)); showToast('已收藏 ⭐');
}
function deleteMsg() {
    hideContextMenu(); if (!currentMsgRow) return;
    pendingSingleDelete = true;
    document.getElementById('delete-confirm-text').textContent = '确定删除这条消息？';
    document.getElementById('delete-confirm-modal').style.display = 'flex';
}
function recallMsg() {
    hideContextMenu(); if (!currentMsgRow) return;
    const bubble = currentMsgRow.querySelector('.msg-bubble'); if (!bubble) return;
    const content = bubble.textContent;
    const notice = document.createElement('div'); notice.className = 'msg-recall-notice';
    notice.innerHTML = '<span>你撤回了一条消息</span><span class="recall-view" onclick="viewRecalled(this)" data-content="' + content.replace(/"/g, '&quot;') + '">查看</span>';
    currentMsgRow.parentNode.insertBefore(notice, currentMsgRow);
    currentMsgRow.classList.add('deleted'); currentMsgRow.setAttribute('data-deleted', 'true');
}
function viewRecalled(el) {
    const content = el.getAttribute('data-content');
    const existing = el.parentNode.querySelector('.recall-content-popup');
    if (existing) { existing.remove(); } else { const p = document.createElement('div'); p.className = 'recall-content-popup'; p.textContent = content; el.parentNode.appendChild(p); }
}

function enterMultiSelect() {
    hideContextMenu(); isMultiSelect = true;
    document.getElementById('chat-messages').classList.add('multi-select-mode');
    document.getElementById('multi-select-bar').style.display = 'flex';
    document.querySelector('.chat-bottom').style.display = 'none';
    if (currentMsgRow) currentMsgRow.classList.add('selected');
}
function exitMultiSelect() {
    isMultiSelect = false;
    document.getElementById('chat-messages').classList.remove('multi-select-mode');
    document.querySelectorAll('.msg-row.selected').forEach(el => el.classList.remove('selected'));
    document.getElementById('multi-select-bar').style.display = 'none';
    document.querySelector('.chat-bottom').style.display = 'block';
}
function multiDelete() {
    const selected = document.querySelectorAll('.msg-row.selected');
    if (selected.length === 0) { showToast('请先选择消息'); return; }
    document.getElementById('delete-confirm-text').textContent = '确定删除选中的 ' + selected.length + ' 条消息？';
    document.getElementById('delete-confirm-modal').style.display = 'flex';
}
function multiFavorite() {
    const selected = document.querySelectorAll('.msg-row.selected');
    if (selected.length === 0) { showToast('请先选择消息'); return; }
    const favorites = JSON.parse(localStorage.getItem('ai-phone-favorites') || '[]'); let count = 0;
    selected.forEach(el => { const b = el.querySelector('.msg-bubble'); const it = el.querySelector('.msg-image-text'); const c = b ? b.textContent : (it ? it.textContent : '');
        if (c) { favorites.push({ text: c.trim(), time: new Date().toLocaleString(), id: Date.now() + count }); count++; } });
    localStorage.setItem('ai-phone-favorites', JSON.stringify(favorites)); exitMultiSelect(); showToast('已收藏 ' + count + ' 条消息 ⭐');
}
function multiForward() {
    const selected = document.querySelectorAll('.msg-row.selected');
    if (selected.length === 0) { showToast('请先选择消息'); return; }
    let text = ''; selected.forEach(el => { const b = el.querySelector('.msg-bubble'); if (b) text += (el.classList.contains('msg-left') ? 'AI: ' : '我: ') + b.textContent + '\n'; });
    if (navigator.clipboard) { navigator.clipboard.writeText(text).then(function() { showToast('已复制到剪贴板'); }); }
    else { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); showToast('已复制到剪贴板'); }
    exitMultiSelect();
}

// ===== Toast提示 =====
function showToast(msg) {
    let toast = document.getElementById('app-toast');
    if (!toast) { toast = document.createElement('div'); toast.id = 'app-toast'; toast.style.cssText = 'position:fixed;bottom:120px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:white;padding:8px 20px;border-radius:20px;font-size:14px;z-index:9999;transition:opacity 0.3s;pointer-events:none;'; document.body.appendChild(toast); }
    toast.textContent = msg; toast.style.opacity = '1';
    clearTimeout(toast._timer); toast._timer = setTimeout(function() { toast.style.opacity = '0'; }, 1500);
}

// ===== AI心声系统 =====
let currentHeartData = { heart: '', danmaku: [], bgm: '', strategy: '' };

function parseAIResponse(rawText) {
    if (!rawText) return { reply: '（AI未返回内容）', heartData: { heart: '', danmaku: [], bgm: '', strategy: '' } };

    var reply = rawText;
    var heartData = { heart: '', danmaku: [], bgm: '', strategy: '' };

    // 提取 [REPLY]
    var replyMatch = rawText.match(/\[REPLY\]([\s\S]*?)\[\/REPLY\]/);
    if (replyMatch) {
        reply = replyMatch[1].trim();
    }

    // 提取 [HEART]
    var heartMatch = rawText.match(/\[HEART\]([\s\S]*?)\[\/HEART\]/);
    if (heartMatch) heartData.heart = heartMatch[1].trim();

    // 提取 [DANMAKU]
    var danmakuMatch = rawText.match(/\[DANMAKU\]([\s\S]*?)\[\/DANMAKU\]/);
    if (danmakuMatch) heartData.danmaku = danmakuMatch[1].trim().split('|').map(function(s) { return s.trim(); }).filter(function(s) { return s; });

    // 提取 [BGM]
    var bgmMatch = rawText.match(/\[BGM\]([\s\S]*?)\[\/BGM\]/);
    if (bgmMatch) heartData.bgm = bgmMatch[1].trim();

    // 提取 [STRATEGY]
    var strategyMatch = rawText.match(/\[STRATEGY\]([\s\S]*?)\[\/STRATEGY\]/);
    if (strategyMatch) heartData.strategy = strategyMatch[1].trim().toLowerCase();

    // 如果没有[REPLY]标记，清除所有标记后剩余的就是回复
    if (!replyMatch) {
        reply = rawText
            .replace(/\[HEART\][\s\S]*?\[\/HEART\]/g, '')
            .replace(/\[DANMAKU\][\s\S]*?\[\/DANMAKU\]/g, '')
            .replace(/\[BGM\][\s\S]*?\[\/BGM\]/g, '')
            .replace(/\[STRATEGY\][\s\S]*?\[\/STRATEGY\]/g, '')
            .replace(/\[REPLY\]|\[\/REPLY\]/g, '')
            .trim();
    } else {
        // 有[REPLY]标记，也清理一下可能残留的标签
        reply = reply
            .replace(/\[REPLY\]|\[\/REPLY\]/g, '')
            .replace(/\[HEART\][\s\S]*?\[\/HEART\]/g, '')
            .replace(/\[DANMAKU\][\s\S]*?\[\/DANMAKU\]/g, '')
            .replace(/\[BGM\][\s\S]*?\[\/BGM\]/g, '')
            .replace(/\[STRATEGY\][\s\S]*?\[\/STRATEGY\]/g, '')
            .trim();
    }

    // 确保reply不为空，但不要用原始带标签的文本
    if (!reply) {
        reply = rawText
            .replace(/\[[\w]+\][\s\S]*?\[\/[\w]+\]/g, '')
            .replace(/\[[\w]+\]|\[\/[\w]+\]/g, '')
            .trim();
    }
    if (!reply) reply = '（AI未返回有效内容）';


    // 更新心声缓存
    if (heartData.heart || heartData.danmaku.length > 0) {
        currentHeartData = heartData;
        localStorage.setItem('ai-phone-heart-data', JSON.stringify(heartData));
    }

    return { reply: reply, heartData: heartData };
}

let danmakuTimer = null; let danmakuIndex = 0;

(function() {
    const chatMessages = document.getElementById('chat-messages'); if (!chatMessages) return;
    chatMessages.addEventListener('click', function(e) {
        const avatar = e.target.closest('.msg-avatar'); if (!avatar) return;
        const msgRow = avatar.closest('.msg-row'); if (!msgRow || !msgRow.classList.contains('msg-left')) return;
        if (isMultiSelect) return;
        e.stopPropagation(); openHeartModal();
    });
})();

function openHeartModal() {
    if (!currentHeartData.heart) { const s = localStorage.getItem('ai-phone-heart-data'); if (s) currentHeartData = JSON.parse(s); }
    const data = currentHeartData;
    document.getElementById('heart-text').textContent = data.heart || '还没有产生心声，发送消息后再来看看吧';
    document.getElementById('heart-bgm-text').textContent = data.bgm ? '当前BGM：' + data.bgm : '当前BGM：等待生成...';
    const pills = document.querySelectorAll('.heart-pill'); pills.forEach(p => p.classList.remove('active'));
    if (data.strategy) { const pill = document.querySelector('.heart-pill[data-key="' + data.strategy + '"]'); if (pill) pill.classList.add('active'); }
    if (data.danmaku && data.danmaku.length > 0) startDanmaku(data.danmaku);
    else document.getElementById('heart-danmaku').textContent = '等待生成...';
    document.getElementById('heart-modal').style.display = 'flex';
}
function closeHeartModal() { document.getElementById('heart-modal').style.display = 'none'; stopDanmaku(); }
function startDanmaku(list) {
    stopDanmaku(); if (!list || list.length === 0) return;
    const shuffled = [...list].sort(() => Math.random() - 0.5); danmakuIndex = 0;
    function showNext() { const el = document.getElementById('heart-danmaku'); if (!el) return; el.style.animation = 'none'; el.offsetHeight; el.style.animation = 'danmakuFade 1.5s ease-in-out'; el.textContent = shuffled[danmakuIndex]; danmakuIndex = (danmakuIndex + 1) % shuffled.length; }
    showNext(); danmakuTimer = setInterval(showNext, 1500);
}
function stopDanmaku() { if (danmakuTimer) { clearInterval(danmakuTimer); danmakuTimer = null; } }

// ----- 心声操作 -----
function favoriteHeart() {
    if (!currentHeartData.heart) { showToast('暂无心声可收藏'); return; }
    const favorites = JSON.parse(localStorage.getItem('ai-phone-favorites') || '[]');
    favorites.push({ text: '💭 ' + currentHeartData.heart + (currentHeartData.bgm ? '\n🎵 ' + currentHeartData.bgm : ''), time: new Date().toLocaleString(), id: Date.now() });
    localStorage.setItem('ai-phone-favorites', JSON.stringify(favorites));
    saveHeartHistory(currentHeartData); showToast('已收藏 ⭐');
}
function saveHeartHistory(data) {
    const history = JSON.parse(localStorage.getItem('ai-phone-heart-history') || '[]');
    history.unshift({ heart: data.heart, bgm: data.bgm, strategy: data.strategy, danmaku: data.danmaku, time: new Date().toLocaleString(), id: Date.now() });
    if (history.length > 50) history.length = 50;
    localStorage.setItem('ai-phone-heart-history', JSON.stringify(history));
}

function openHeartHistory() { loadHeartHistory(); document.getElementById('heart-history-modal').style.display = 'flex'; }
function closeHeartHistory() { document.getElementById('heart-history-modal').style.display = 'none'; }
function openHeartSettingsPopup() { document.getElementById('heart-settings-modal').style.display = 'flex'; }
function closeHeartSettingsPopup() { document.getElementById('heart-settings-modal').style.display = 'none'; }

function loadHeartHistory() {
    const history = JSON.parse(localStorage.getItem('ai-phone-heart-history') || '[]');
    const body = document.getElementById('heart-history-body');
    if (history.length === 0) { body.innerHTML = '<div class="heart-history-empty">暂无历史心声</div>'; return; }
    const names = { analyze: '⩌ ֊ ⩌ 分析你', guide: 'ᗜᴗᗜ 引导话题', hide: '⩌⌯⩌ 隐瞒想法', empathy: '՞⩌⌯⩌՞ ᶻ 共情模式', stuck: 'ᗜ‿ᗜꐦ 编不下去了' };
    let html = ''; history.forEach(item => {
        let pills = ''; ['analyze','guide','hide','empathy','stuck'].forEach(s => { pills += '<span class="heart-history-pill' + (item.strategy === s ? ' active' : '') + '">' + (names[s]||s) + '</span>'; });
        html += '<div class="heart-history-item"><div class="heart-history-time">' + item.time + '</div><div class="heart-history-text">💭 ' + item.heart + '</div>' + (item.bgm ? '<div class="heart-history-bgm">🎵 ' + item.bgm + '</div>' : '') + '<div class="heart-history-pills">' + pills + '</div></div>';
    });
    body.innerHTML = html;
}

function openHeartBgSetting() { document.getElementById('heart-bg-modal').style.display = 'flex'; }
function closeHeartBgSetting() { document.getElementById('heart-bg-modal').style.display = 'none'; }
function saveHeartBg() {
    const url = document.getElementById('heart-bg-url').value.trim(); const fi = document.getElementById('heart-bg-file');
    if (fi.files && fi.files[0]) { const r = new FileReader(); r.onload = function(e) { applyHeartBg(e.target.result); localStorage.setItem('ai-phone-heart-bg', e.target.result); }; r.readAsDataURL(fi.files[0]); }
    else if (url) { applyHeartBg(url); localStorage.setItem('ai-phone-heart-bg', url); }
    closeHeartBgSetting();
}
function applyHeartBg(src) {
    const box = document.getElementById('heart-modal-box'); if (box) { box.style.backgroundImage = 'url(' + src + ')'; box.style.backgroundSize = 'cover'; box.style.backgroundPosition = 'center'; }
    const preview = document.getElementById('heart-bg-preview'); if (preview) preview.innerHTML = '<img src="' + src + '" alt="背景" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">';
}
(function() { const s = localStorage.getItem('ai-phone-heart-bg'); if (s) applyHeartBg(s); })();

function saveHeartSettings() {
    const settings = { modBgm: document.getElementById('heart-mod-bgm').checked, modDanmaku: document.getElementById('heart-mod-danmaku').checked, modHeart: document.getElementById('heart-mod-heart').checked, modStrategy: document.getElementById('heart-mod-strategy').checked };
    localStorage.setItem('ai-phone-heart-settings', JSON.stringify(settings)); applyHeartModules(settings);
}
function applyHeartModules(s) {
    const bgm = document.querySelector('.heart-bgm'); const danmaku = document.querySelector('.heart-danmaku-area'); const heart = document.querySelector('.heart-content'); const strategy = document.querySelector('.heart-strategy');
    if (bgm) bgm.style.display = s.modBgm ? 'flex' : 'none'; if (danmaku) danmaku.style.display = s.modDanmaku ? 'flex' : 'none';
    if (heart) heart.style.display = s.modHeart ? 'block' : 'none'; if (strategy) strategy.style.display = s.modStrategy ? 'block' : 'none';
}
(function() {
    const saved = localStorage.getItem('ai-phone-heart-settings'); if (!saved) return;
    const s = JSON.parse(saved);
    const ids = { modBgm: 'heart-mod-bgm', modDanmaku: 'heart-mod-danmaku', modHeart: 'heart-mod-heart', modStrategy: 'heart-mod-strategy' };
    for (const [key, id] of Object.entries(ids)) { const el = document.getElementById(id); if (el && s[key] !== undefined) el.checked = s[key]; }
    applyHeartModules(s);
})();

function saveHeartCss() { const css = document.getElementById('heart-css-editor').value; localStorage.setItem('ai-phone-heart-css', css); applyCustomCss('heart', css); showToast('心声样式已保存'); }
(function() { const c = localStorage.getItem('ai-phone-heart-css'); if (c) { applyCustomCss('heart', c); const e = document.getElementById('heart-css-editor'); if (e) e.value = c; } })();

// ----- 占位函数 -----
function openSearch() { alert('搜索功能 - 后续实现'); }
function openAdd() { alert('添加功能 - 后续实现'); }

function postMoment() { alert('发朋友圈 - 后续实现'); }
function setMyAvatar() { alert('设置头像 - 后续实现'); }
function openMyPersona() { alert('我的人设 - 后续实现'); }
function openWallet() { alert('钱包 - 后续实现'); }
function openFavorites() { alert('收藏 - 后续实现'); }
function openWechatSettings() { alert('设置 - 后续实现'); }
function sendImage() { alert('发送图片 - 后续实现'); }
function sendLocation() { alert('发送位置 - 后续实现'); }
function sendTransfer() { alert('转账 - 后续实现'); }
function createDateInChat() { alert('线下约会 - 后续实现'); }
function manageEmoji() { alert('管理表情包 - 后续实现'); }
function clearChatHistory() { if(confirm('确定清除所有聊天记录？')) showToast('已清除'); }
function deleteAIFriend() { if(confirm('确定删除该AI好友？')) showToast('已删除'); }

// ===== 拉取模型列表 =====
async function fetchModels(type) {
    let apiKey, apiUrl, listId, inputId;
    
    if (type === 'main') {
        apiKey = document.getElementById('global-api-key').value.trim();
        apiUrl = document.getElementById('global-api-url').value.trim();
        listId = 'global-model-list';
        inputId = 'global-api-model';
    } else {
        apiKey = document.getElementById('global-sub-api-key').value.trim();
        apiUrl = document.getElementById('global-sub-api-url').value.trim();
        listId = 'global-sub-model-list';
        inputId = 'global-sub-api-model';
    }
    
    if (!apiKey) {
        showToast('请先填写API Key');
        return;
    }
    
    if (!apiUrl) {
        showToast('请先填写API地址');
        return;
    }
    
    // 从用户填的地址提取基础URL
    // 用户填的可能是：
    // https://xxx.com/v1
    // https://xxx.com/v1/
    // https://xxx.com/v1/chat/completions
    // https://xxx.com
    let baseUrl = apiUrl.replace(/\/+$/, ''); // 去掉末尾斜杠
    baseUrl = baseUrl.replace(/\/chat\/completions$/, ''); // 去掉 /chat/completions
    
    // 确保以 /v1 结尾
    if (!baseUrl.endsWith('/v1')) {
        baseUrl = baseUrl + '/v1';
    }
    
    const modelsUrl = baseUrl + '/models';
    
    showToast('正在拉取模型列表...');
    
    try {
        const response = await fetch(modelsUrl, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + apiKey
            }
        });
        
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
            const models = data.data
                .map(m => m.id)
                .sort((a, b) => a.localeCompare(b));
            
            if (models.length === 0) {
                showToast('未找到可用模型');
                return;
            }
            
            const select = document.getElementById(listId);
            select.innerHTML = '<option value="">选择模型（共' + models.length + '个）</option>';
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                select.appendChild(option);
            });
            
            select.style.display = 'block';
            showToast('找到 ' + models.length + ' 个模型');
        } else if (data.error) {
            showToast('拉取失败：' + data.error.message);
        } else {
            showToast('拉取失败，请检查API地址和Key');
        }
    } catch (err) {
        showToast('拉取失败：' + err.message);
    }
}

function selectModel(type) {
    let listId, inputId;
    
    if (type === 'main') {
        listId = 'global-model-list';
        inputId = 'global-api-model';
    } else {
        listId = 'global-sub-model-list';
        inputId = 'global-sub-api-model';
    }
    
    const select = document.getElementById(listId);
    const input = document.getElementById(inputId);
    
    if (select.value) {
        input.value = select.value;
    }
}
// 页面完全加载后再读取设置
window.addEventListener('DOMContentLoaded', function() {
    loadGlobalSettings();
    loadChatSettings();
});
