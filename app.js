// 应用状态管理
const AppState = {
    currentScreen: 'mainScreen',
    currentStage: 1,
    startTime: null,
    totalDuration: 0,
    breathingInterval: null,
    stageTimer: null,
    longPressTimer: null,
    speechSynthesis: null,
    selectedVoice: null, // 选中的女声
    heartbeatAudio: null,
    isWiping: false
};

// 恐慌干预阶段配置
const PanicStages = {
    1: { duration: 60000, name: '生理锚定' },
    2: { duration: 15000, name: '安全确认' },
    3: { duration: 30000, name: '自我关怀' },
    4: { duration: 20000, name: '安全照片' },
    5: { duration: 45000, name: '感官落地' },
    6: { duration: 30000, name: '思维擦拭' },
    7: { duration: 0, name: '结束与见证' }
};

// 感官落地步骤配置
const SensorySteps = [
    { text: '请环顾四周，说出你能看到的5样东西', voice: '现在，观察一下环境，数一数你可以看到的5种物品', duration: 9000 },
    { text: '仔细聆听，说出你能听到的4种声音', voice: '现在，静下心，留心你能听到的4种不同声音', duration: 9000 },
    { text: '感受并说出你能触摸到的3种物体或质感', voice: '请触摸一下身边的物体，说出3个不同的触感，比如衣服的质感、椅子的表面', duration: 9000 },
    { text: '注意你现在能闻到的2种气味', voice: '深呼吸一下，感受身边2种不同的气味，可以是空气、香薰或食物的味道', duration: 9000 },
    { text: '关注你嘴巴里的1种味道', voice: '觉察一下你口中还能尝到的味道，也许是水，或刚刚吃过的东西', duration: 9000 }
];

// 屏幕切换函数
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        AppState.currentScreen = screenId;
    }
}

// 初始化应用
function initApp() {
    // 初始化语音合成
    if ('speechSynthesis' in window) {
        AppState.speechSynthesis = window.speechSynthesis;
        // 初始化语音选择
        initVoiceSelection();
    }
    
    // 绑定主界面事件
    const emergencyBtn = document.getElementById('emergencyBtn');
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', startPanicIntervention);
    }
    
    // 绑定所有跳过按钮
    document.querySelectorAll('.skip-stage-btn').forEach(btn => {
        btn.addEventListener('click', skipCurrentStage);
    });
    
    // 绑定长按事件
    setupLongPress();
    
    // 绑定阶段7的按钮
    const restBtn = document.getElementById('restBtn');
    const recordBtn = document.getElementById('recordBtn');
    const confirmRestBtn = document.getElementById('confirmRestBtn');
    const cancelRestBtn = document.getElementById('cancelRestBtn');
    
    if (restBtn) restBtn.addEventListener('click', () => switchScreen('mainScreen'));
    if (recordBtn) recordBtn.addEventListener('click', recordIntervention);
    if (confirmRestBtn) confirmRestBtn.addEventListener('click', () => {
        hideRestModal();
        goToStage7();
    });
    if (cancelRestBtn) cancelRestBtn.addEventListener('click', hideRestModal);
    
    // 绑定快捷操作按钮
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            handleQuickAction(action);
        });
    });
    
    // 初始化思维擦拭画布
    initWipeCanvas();
    
    // 初始化触摸反馈
    initTouchFeedback();
}

// 开始恐慌干预流程
function startPanicIntervention() {
    AppState.startTime = Date.now();
    AppState.currentStage = 1;
    goToStage(1);
}

// 进入指定阶段
function goToStage(stageNum) {
    AppState.currentStage = stageNum;
    
    // 清除之前的定时器
    clearAllTimers();
    
    switch(stageNum) {
        case 1:
            startStage1();
            break;
        case 2:
            startStage2();
            break;
        case 3:
            startStage3();
            break;
        case 4:
            startStage4();
            break;
        case 5:
            startStage5();
            break;
        case 6:
            startStage6();
            break;
        case 7:
            startStage7();
            break;
    }
}

// 阶段1：生理锚定（60秒，4-7-8呼吸）
function startStage1() {
    switchScreen('stage1Screen');
    
    const ball = document.getElementById('breathingBall');
    const text = document.getElementById('breathingText');
    const timeLeftEl = document.getElementById('timeLeft');
    
    let timeLeft = 60;
    let cycleCount = 0;
    
    // 更新倒计时
    AppState.stageTimer = setInterval(() => {
        timeLeft--;
        if (timeLeftEl) timeLeftEl.textContent = timeLeft + '秒';
        
        if (timeLeft <= 0) {
            clearInterval(AppState.stageTimer);
            goToStage(2);
        }
    }, 1000);
    
    // 4-7-8呼吸节奏
    function breatheCycle() {
        if (timeLeft <= 0) return;
        
        // 吸气 4秒
        if (ball) ball.className = 'breathing-ball inhale';
        if (text) text.textContent = '吸气';
        
        setTimeout(() => {
            if (timeLeft <= 0) return;
            // 屏息 7秒
            if (ball) ball.className = 'breathing-ball hold';
            if (text) text.textContent = '屏息';
            
            setTimeout(() => {
                if (timeLeft <= 0) return;
                // 呼气 8秒
                if (ball) ball.className = 'breathing-ball exhale';
                if (text) text.textContent = '呼气';
                
                setTimeout(() => {
                    if (timeLeft > 0) {
                        breatheCycle();
                    }
                }, 8000);
            }, 7000);
        }, 4000);
    }
    
    breatheCycle();
}

// 阶段2：安全确认（15秒）
function startStage2() {
    switchScreen('stage2Screen');
    
    // 初始化星光粒子
    initStarsCanvas();
    
    // 逐词淡入动画
    animateWords();
    
    const message = "你此刻是安全的。这不是真正的危险。";
    speakText(message);
    
    let timeLeft = 15;
    const timeLeftEl = document.querySelector('#stage2Screen .time-left');
    
    AppState.stageTimer = setInterval(() => {
        timeLeft--;
        if (timeLeftEl) timeLeftEl.textContent = timeLeft + '秒';
        if (timeLeft <= 0) {
            clearInterval(AppState.stageTimer);
            goToStage(3);
        }
    }, 1000);
}

// 逐词淡入动画
function animateWords() {
    const words = document.querySelectorAll('#stage2Screen .word');
    words.forEach((word, index) => {
        setTimeout(() => {
            word.classList.add('visible');
        }, index * 300); // 每个词间隔300ms，温柔地逐词显示
    });
}

// 初始化星光粒子画布
function initStarsCanvas() {
    const canvas = document.getElementById('starsCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 创建星星粒子
    const stars = [];
    const starCount = 30;
    
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.3 + 0.1,
            speed: Math.random() * 0.5 + 0.2
        });
    }
    
    // 动画循环
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        stars.forEach(star => {
            // 更新位置（缓慢流动）
            star.y += star.speed;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
            
            // 绘制星星
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(245, 230, 211, ${star.opacity})`;
            ctx.fill();
            
            // 添加微弱的闪烁效果
            star.opacity += Math.sin(Date.now() * 0.001 + star.x) * 0.05;
            star.opacity = Math.max(0.1, Math.min(0.4, star.opacity));
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // 窗口大小改变时重新调整画布
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// 阶段3：自我关怀（30秒）
function startStage3() {
    switchScreen('stage3Screen');
    
    const message = "我在这里，我不会离开你";
    speakText(message);
    
    let timeLeft = 30;
    const timeLeftEl = document.querySelector('#stage3Screen .time-left');
    
    AppState.stageTimer = setInterval(() => {
        timeLeft--;
        if (timeLeftEl) timeLeftEl.textContent = timeLeft + '秒';
        if (timeLeft <= 0) {
            clearInterval(AppState.stageTimer);
            goToStage(4);
        }
    }, 1000);
}

// 阶段4：安全照片（20秒）
function startStage4() {
    switchScreen('stage4Screen');
    
    const message = "看看这个让你感到安全的存在";
    speakText(message);
    
    // 加载安全照片
    const container = document.getElementById('safePhotoContainer');
    if (container) {
        const savedPhoto = localStorage.getItem('safePhoto');
        if (savedPhoto) {
            const img = document.createElement('img');
            img.src = savedPhoto;
            img.className = 'safe-photo';
            img.style.opacity = '0';
            container.innerHTML = '';
            container.appendChild(img);
            setTimeout(() => {
                img.style.transition = 'opacity 2s';
                img.style.opacity = '1';
            }, 100);
        } else {
            container.innerHTML = '<div class="safe-photo-placeholder">🖼️</div>';
        }
    }
    
    let timeLeft = 20;
    const timeLeftEl = document.querySelector('#stage4Screen .time-left');
    
    AppState.stageTimer = setInterval(() => {
        timeLeft--;
        if (timeLeftEl) timeLeftEl.textContent = timeLeft + '秒';
        if (timeLeft <= 0) {
            clearInterval(AppState.stageTimer);
            goToStage(5);
        }
    }, 1000);
}

// 阶段5：感官落地（45秒，五感正念）
function startStage5() {
    switchScreen('stage5Screen');
    
    let currentStep = 0;
    
    function showNextStep() {
        if (currentStep >= SensorySteps.length) {
            goToStage(7);
            return;
        }
        
        const step = SensorySteps[currentStep];
        const titleEl = document.querySelector('.sensory-title');
        const countdownEl = document.getElementById('sensoryCountdown');
        
        if (titleEl) titleEl.textContent = step.text;
        speakText(step.voice);
        
        let stepTimeLeft = Math.floor(step.duration / 1000);
        if (countdownEl) countdownEl.textContent = stepTimeLeft + '秒';
        
        const stepTimer = setInterval(() => {
            stepTimeLeft--;
            if (countdownEl) countdownEl.textContent = stepTimeLeft + '秒';
            
            if (stepTimeLeft <= 0) {
                clearInterval(stepTimer);
                currentStep++;
                setTimeout(showNextStep, 500);
            }
        }, 1000);
    }
    
    showNextStep();
}

// 阶段6：思维擦拭（可选，30秒）
function startStage6() {
    switchScreen('stage6Screen');
    
    const affirmations = ["这也会过去", "我能够应对", "我是安全的"];
    const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
    
    const affirmationEl = document.getElementById('affirmationText');
    if (affirmationEl) {
        affirmationEl.textContent = randomAffirmation;
        affirmationEl.classList.add('hidden');
    }
    
    speakText(randomAffirmation);
    
    let timeLeft = 30;
    
    AppState.stageTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(AppState.stageTimer);
            goToStage(7);
        }
    }, 1000);
}

// 阶段7：结束与见证
function startStage7() {
    switchScreen('stage7Screen');
    
    // 计算总耗时
    if (AppState.startTime) {
        AppState.totalDuration = Math.floor((Date.now() - AppState.startTime) / 1000);
        const minutes = Math.floor(AppState.totalDuration / 60);
        const seconds = AppState.totalDuration % 60;
        
        const completionText = document.getElementById('completionText');
        if (completionText) {
            if (minutes > 0) {
                completionText.textContent = `你刚刚和情绪浪潮一起度过了${minutes}分${seconds}秒。它来了，也会走。`;
            } else {
                completionText.textContent = `你刚刚和情绪浪潮一起度过了${seconds}秒。它来了，也会走。`;
            }
        }
    }
    
    // 播放潮汐动画
    const tideEl = document.getElementById('tideAnimation');
    if (tideEl) {
        tideEl.classList.add('animate');
    }
}

// 跳过当前阶段
function skipCurrentStage() {
    if (AppState.currentStage < 7) {
        goToStage(AppState.currentStage + 1);
    } else {
        goToStage7();
    }
}

// 直接跳到阶段7
function goToStage7() {
    goToStage(7);
}

// 设置长按功能
function setupLongPress() {
    let pressTimer = null;
    const longPressDelay = 800; // 800ms
    
    document.addEventListener('touchstart', (e) => {
        if (AppState.currentScreen.includes('stage')) {
            pressTimer = setTimeout(() => {
                showRestModal();
            }, longPressDelay);
        }
    });
    
    document.addEventListener('touchend', () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    });
    
    document.addEventListener('touchmove', () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    });
}

// 显示休息确认弹窗
function showRestModal() {
    const modal = document.getElementById('restConfirmModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// 隐藏休息确认弹窗
function hideRestModal() {
    const modal = document.getElementById('restConfirmModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// 初始化语音选择（选择最温和的女声）
function initVoiceSelection() {
    function selectBestVoice() {
        if (!AppState.speechSynthesis) return;
        
        const voices = AppState.speechSynthesis.getVoices();
        if (voices.length === 0) {
            // 如果语音列表还没加载，等待加载完成
            AppState.speechSynthesis.addEventListener('voiceschanged', selectBestVoice, { once: true });
            return;
        }
        
        // 优先选择的中文女声名称（按优先级排序）
        const preferredVoiceNames = [
            'Microsoft Xiaoxiao',      // 微软小晓（温和女声）
            'Microsoft Xiaoyi',       // 微软小艺（温和女声）
            'Microsoft Yunxi',        // 微软云希（温和女声）
            'Xiaoxiao',               // 小晓
            'Xiaoyi',                 // 小艺
            'Yunxi',                  // 云希
            'Ting-Ting',              // 中文女声
            'Sinji',                  // 中文女声
            'Mei-Jia',                // 中文女声
        ];
        
        // 查找最合适的女声
        let selectedVoice = null;
        
        // 首先尝试按名称匹配
        for (const name of preferredVoiceNames) {
            selectedVoice = voices.find(voice => 
                voice.lang.includes('zh') && 
                voice.name.includes(name)
            );
            if (selectedVoice) break;
        }
        
        // 如果没有找到，尝试查找任何中文女声
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
                voice.lang.includes('zh') && 
                (voice.name.toLowerCase().includes('female') ||
                 voice.name.includes('女') ||
                 voice.name.includes('Female'))
            );
        }
        
        // 如果还是没有，选择任何中文语音
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.lang.includes('zh'));
        }
        
        // 如果找到了合适的语音，保存它
        if (selectedVoice) {
            AppState.selectedVoice = selectedVoice;
            console.log('已选择语音:', selectedVoice.name, selectedVoice.lang);
        }
    }
    
    // 立即尝试选择
    selectBestVoice();
    
    // 某些浏览器需要等待 voiceschanged 事件
    if (AppState.speechSynthesis.getVoices().length === 0) {
        AppState.speechSynthesis.addEventListener('voiceschanged', selectBestVoice);
    }
}

// 语音播放 - 使用温和的女声
function speakText(text) {
    if (AppState.speechSynthesis && text) {
        // 停止之前的语音
        AppState.speechSynthesis.cancel();
        
        // 检查是否有用户录制的版本
        const userVoice = localStorage.getItem('userVoice_' + text);
        if (userVoice) {
            // 播放用户录制的版本（这里简化处理，实际需要音频播放）
            const audio = new Audio(userVoice);
            audio.play().catch(() => {});
        } else {
            // 使用系统语音 - 温和的女声设置
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            
            // 使用选中的女声
            if (AppState.selectedVoice) {
                utterance.voice = AppState.selectedVoice;
            }
            
            // 温和、有安全感的语音参数
            utterance.rate = 0.75;   // 语速稍慢，更温柔（原来是0.9）
            utterance.pitch = 0.85;  // 音调稍低，更柔和、有安全感（原来是1.0）
            utterance.volume = parseFloat(localStorage.getItem('speechVolume') || '0.8');
            
            // 在标点符号后添加短暂停顿，让语音更自然
            const textWithPauses = text
                .replace(/。/g, '。 ')
                .replace(/，/g, '， ')
                .replace(/！/g, '！ ')
                .replace(/？/g, '？ ');
            utterance.text = textWithPauses;
            
            AppState.speechSynthesis.speak(utterance);
        }
    }
}

// 初始化思维擦拭画布
function initWipeCanvas() {
    const canvas = document.getElementById('wipeCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 绘制模糊层
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let isDrawing = false;
    
    canvas.addEventListener('touchstart', (e) => {
        isDrawing = true;
        AppState.isWiping = true;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        wipeAt(ctx, touch.clientX - rect.left, touch.clientY - rect.top);
    });
    
    canvas.addEventListener('touchmove', (e) => {
        if (isDrawing) {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            wipeAt(ctx, touch.clientX - rect.left, touch.clientY - rect.top);
        }
    });
    
    canvas.addEventListener('touchend', () => {
        isDrawing = false;
        checkWipeComplete(ctx, canvas);
    });
}

// 擦拭操作
function wipeAt(ctx, x, y) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, Math.PI * 2);
    ctx.fill();
}

// 检查擦拭是否完成
function checkWipeComplete(ctx, canvas) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    
    for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 128) {
            transparentPixels++;
        }
    }
    
    const transparency = transparentPixels / (pixels.length / 4);
    if (transparency > 0.3) {
        const affirmationEl = document.getElementById('affirmationText');
        if (affirmationEl) {
            affirmationEl.classList.remove('hidden');
        }
    }
}

// 初始化触摸反馈
function initTouchFeedback() {
    const handArea = document.getElementById('handArea');
    if (!handArea) return;
    
    handArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handArea.classList.add('touching');
        
        // 播放心跳声（简化处理，实际需要音频文件）
        playHeartbeat();
        
        // 脉冲光效果
        const pulse = document.querySelector('.pulse-effect');
        if (pulse) {
            pulse.classList.add('active');
        }
    });
    
    handArea.addEventListener('touchend', () => {
        handArea.classList.remove('touching');
        const pulse = document.querySelector('.pulse-effect');
        if (pulse) {
            pulse.classList.remove('active');
        }
    });
}

// 播放心跳声
function playHeartbeat() {
    // 简化处理：使用震动模拟心跳
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 100]);
    }
}

// 处理快捷操作
function handleQuickAction(action) {
    switch(action) {
        case 'breathing':
            goToStage(1);
            break;
        case 'selfcare':
            goToStage(3);
            break;
        case 'sensory':
            goToStage(5);
            break;
        case 'photo':
            goToStage(4);
            break;
        case 'wipe':
            goToStage(6);
            break;
    }
}

// 记录干预
function recordIntervention() {
    const record = {
        timestamp: new Date().toISOString(),
        duration: AppState.totalDuration,
        stages: AppState.currentStage
    };
    
    const records = JSON.parse(localStorage.getItem('interventionRecords') || '[]');
    records.push(record);
    localStorage.setItem('interventionRecords', JSON.stringify(records));
    
    alert('已记录本次干预');
}

// 清除所有定时器
function clearAllTimers() {
    if (AppState.breathingInterval) {
        clearInterval(AppState.breathingInterval);
        AppState.breathingInterval = null;
    }
    if (AppState.stageTimer) {
        clearInterval(AppState.stageTimer);
        AppState.stageTimer = null;
    }
    if (AppState.longPressTimer) {
        clearTimeout(AppState.longPressTimer);
        AppState.longPressTimer = null;
    }
    if (AppState.speechSynthesis) {
        AppState.speechSynthesis.cancel();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    
    // 阻止默认的双指缩放
    document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
    });
    
    // 阻止双击缩放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});

// 震动反馈
function vibrate(pattern = 50) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// 导出给控制台调试用
window.AppState = AppState;
window.switchScreen = switchScreen;
window.goToStage = goToStage;
