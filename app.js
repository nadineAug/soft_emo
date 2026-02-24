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
    isWiping: false,
    backgroundCleanup: null // 背景清理函数
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
    // 隐藏所有屏幕
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.setProperty('opacity', '0', 'important');
        screen.style.setProperty('visibility', 'hidden', 'important');
        screen.style.setProperty('display', 'none', 'important');
    });
    
    // 显示目标屏幕
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        targetScreen.style.setProperty('opacity', '1', 'important');
        targetScreen.style.setProperty('visibility', 'visible', 'important');
        targetScreen.style.setProperty('display', 'flex', 'important');
        
        AppState.currentScreen = screenId;
        
        // 延迟验证，确保样式生效
        setTimeout(() => {
            const finalStyle = window.getComputedStyle(targetScreen);
            const hasActive = targetScreen.classList.contains('active');
            
            if (finalStyle.opacity === '0' || finalStyle.visibility === 'hidden' || !hasActive) {
                // 强制修复
                targetScreen.classList.add('active');
                targetScreen.style.setProperty('opacity', '1', 'important');
                targetScreen.style.setProperty('visibility', 'visible', 'important');
                targetScreen.style.setProperty('display', 'flex', 'important');
            }
        }, 100);
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
        emergencyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            startPanicIntervention();
        });
        emergencyBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            startPanicIntervention();
        });
        
        // 确保按钮可点击
        emergencyBtn.style.pointerEvents = 'auto';
        emergencyBtn.style.cursor = 'pointer';
    }
    
    // 绑定所有跳过按钮
    document.querySelectorAll('.skip-stage-btn').forEach(btn => {
        btn.addEventListener('click', skipCurrentStage);
    });
    
    // 绑定所有返回按钮
    document.querySelectorAll('.back-stage-btn').forEach(btn => {
        btn.addEventListener('click', goBackStage);
    });
    
    // 初始化照片上传功能
    initPhotoUpload();
    
    // 绑定长按事件
    setupLongPress();
}

// 初始化照片上传功能
function initPhotoUpload() {
    const photoUpload = document.getElementById('photoUpload');
    const previewContainer = document.getElementById('uploadedPhotosPreview');
    
    if (!photoUpload || !previewContainer) return;
    
    // 显示已上传的照片
    function displayUploadedPhotos() {
        const savedPhotos = getSafePhotos();
        previewContainer.innerHTML = '';
        
        if (savedPhotos.length > 0) {
            savedPhotos.forEach((photo, index) => {
                const photoItem = document.createElement('div');
                photoItem.className = 'uploaded-photo-item';
                photoItem.innerHTML = `
                    <img src="${photo}" alt="安全照片${index + 1}">
                    <button class="remove-photo-btn" data-index="${index}">×</button>
                `;
                previewContainer.appendChild(photoItem);
            });
        }
    }
    
    // 上传照片
    photoUpload.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const photoData = event.target.result;
                    addSafePhoto(photoData);
                    displayUploadedPhotos();
                };
                reader.readAsDataURL(file);
            }
        });
        
        // 清空input，允许重复选择同一文件
        e.target.value = '';
    });
    
    // 删除照片
    previewContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-photo-btn')) {
            const index = parseInt(e.target.dataset.index);
            removeSafePhoto(index);
            displayUploadedPhotos();
        }
    });
    
    // 初始显示
    displayUploadedPhotos();
}

// 获取所有安全照片
function getSafePhotos() {
    const photosJson = localStorage.getItem('safePhotos');
    if (photosJson) {
        try {
            return JSON.parse(photosJson);
        } catch (e) {
            return [];
        }
    }
    // 兼容旧版本的单张照片
    const oldPhoto = localStorage.getItem('safePhoto');
    if (oldPhoto) {
        const photos = [oldPhoto];
        localStorage.setItem('safePhotos', JSON.stringify(photos));
        localStorage.removeItem('safePhoto');
        return photos;
    }
    return [];
}

// 添加安全照片
function addSafePhoto(photoData) {
    const photos = getSafePhotos();
    photos.push(photoData);
    // 限制最多保存20张
    if (photos.length > 20) {
        photos.shift();
    }
    localStorage.setItem('safePhotos', JSON.stringify(photos));
}

// 删除安全照片
function removeSafePhoto(index) {
    const photos = getSafePhotos();
    photos.splice(index, 1);
    localStorage.setItem('safePhotos', JSON.stringify(photos));
    
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

// 阶段1：生理锚定（4组呼吸：吸气4秒，屏息4秒，呼气8秒）
function startStage1() {
    switchScreen('stage1Screen');
    
    // 初始化统一背景
    const cleanup = initUnifiedBackground('Stage1');
    if (cleanup) AppState.backgroundCleanup = cleanup;
    
    const ball = document.getElementById('breathingBall');
    const text = document.getElementById('breathingText');
    const timeLeftEl = document.getElementById('timeLeft');
    
    // 每组16秒（4+4+8），4组共64秒
    const totalTime = 64;
    let timeLeft = totalTime;
    let cycleCount = 0;
    const maxCycles = 4;
    
    // 初始化呼吸球为小状态（呼气状态）
    if (ball) {
        ball.className = 'breathing-ball exhale';
        // 强制重绘，确保初始状态正确
        ball.offsetHeight;
    }
    if (text) text.textContent = '准备';
    
    // 更新倒计时
    AppState.stageTimer = setInterval(() => {
        timeLeft--;
        if (timeLeftEl) timeLeftEl.textContent = timeLeft + '秒';
        
        if (timeLeft <= 0 || cycleCount >= maxCycles) {
            clearInterval(AppState.stageTimer);
            if (AppState.backgroundCleanup) AppState.backgroundCleanup();
            goToStage(2);
        }
    }, 1000);
    
    // 4-4-8呼吸节奏（吸气4秒，屏息4秒，呼气8秒）
    function breatheCycle() {
        if (cycleCount >= maxCycles || timeLeft <= 0) {
            return;
        }
        
        cycleCount++;
        
        // 吸气 4秒 - 立即开始动画
        if (ball) {
            // 先重置到小状态，然后立即切换到吸气状态
            ball.className = 'breathing-ball';
            // 使用双重 requestAnimationFrame 确保动画立即开始
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (ball) ball.className = 'breathing-ball inhale';
                });
            });
        }
        if (text) text.textContent = '吸气';
        
        setTimeout(() => {
            if (cycleCount >= maxCycles || timeLeft <= 0) return;
            
            // 屏息 4秒
            if (ball) ball.className = 'breathing-ball hold';
            if (text) text.textContent = '屏息';
            
            setTimeout(() => {
                if (cycleCount >= maxCycles || timeLeft <= 0) return;
                
                // 呼气 8秒
                if (ball) ball.className = 'breathing-ball exhale';
                if (text) text.textContent = '呼气';
                
                setTimeout(() => {
                    if (cycleCount < maxCycles && timeLeft > 0) {
                        breatheCycle();
                    } else {
                        // 完成所有循环，进入下一阶段
                        clearInterval(AppState.stageTimer);
                        if (AppState.backgroundCleanup) AppState.backgroundCleanup();
                        goToStage(2);
                    }
                }, 8000);
            }, 4000);
        }, 4000);
    }
    
    // 延迟一小段时间后开始第一次呼吸，确保页面渲染完成
    setTimeout(() => {
        breatheCycle();
    }, 100);
}

// 阶段2：安全确认（15秒）
function startStage2() {
    switchScreen('stage2Screen');
    
    // 强制确保屏幕显示
    const screen = document.getElementById('stage2Screen');
    if (screen) {
        screen.classList.add('active');
        screen.style.setProperty('opacity', '1', 'important');
        screen.style.setProperty('visibility', 'visible', 'important');
        screen.style.setProperty('display', 'flex', 'important');
        
        // 延迟再次确认（防止被覆盖）
        setTimeout(() => {
            screen.classList.add('active');
            screen.style.setProperty('opacity', '1', 'important');
            screen.style.setProperty('visibility', 'visible', 'important');
            screen.style.setProperty('display', 'flex', 'important');
        }, 10);
        
        setTimeout(() => {
            screen.classList.add('active');
            screen.style.setProperty('opacity', '1', 'important');
            screen.style.setProperty('visibility', 'visible', 'important');
            screen.style.setProperty('display', 'flex', 'important');
        }, 50);
    }
    
    // 等待屏幕切换完成
    setTimeout(() => {
        // 再次确认屏幕显示
        if (screen) {
            screen.classList.add('active');
            screen.style.setProperty('opacity', '1', 'important');
            screen.style.setProperty('visibility', 'visible', 'important');
            screen.style.setProperty('display', 'flex', 'important');
        }
        
        // 初始化统一背景
        const cleanup = initUnifiedBackground('Stage2');
        if (cleanup) AppState.backgroundCleanup = cleanup;
        
        // 确保文字容器可见
        const textContainer = document.querySelector('#stage2Screen .safety-confirmation-text');
        if (textContainer) {
            textContainer.style.opacity = '1';
            textContainer.style.visibility = 'visible';
            textContainer.style.display = 'flex';
        }
        
        // 逐句+逐词淡入动画
        animateTextWords('#stage2Screen .safety-confirmation-text');
        
        const message = "你此刻是安全的，这不是真正的危险";
        speakText(message);
        
        let timeLeft = 15;
        const timeLeftEl = document.querySelector('#stage2Screen .time-left');
        
        AppState.stageTimer = setInterval(() => {
            timeLeft--;
            if (timeLeftEl) timeLeftEl.textContent = timeLeft + '秒';
            if (timeLeft <= 0) {
                clearInterval(AppState.stageTimer);
                fadeOutAllText('#stage2Screen .safety-confirmation-text');
                setTimeout(() => {
                    if (AppState.backgroundCleanup) AppState.backgroundCleanup();
                    goToStage(3);
                }, 1000);
            }
        }, 1000);
    }, 100);
}

// 阶段结束淡出所有文字
function fadeOutAllText(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const allText = container.querySelectorAll('.word, .sentence');
    allText.forEach(element => {
        element.style.transition = 'opacity 1s ease';
        element.style.opacity = '0';
    });
}

// 初始化统一背景（星光粒子 + 光晕流动）
function initUnifiedBackground(stageId) {
    const canvasId = `starsCanvas${stageId}`;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 创建星星粒子：5-8个
    const stars = [];
    // const starCount = Math.floor(Math.random() * 4) + 5; // 5-8个
    const starCount = 30; // 5-8个
    
    for (let i = 0; i < starCount; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        
        // 随机初始方向（0-2π），让粒子朝各个方向移动
        const initialAngle = Math.random() * Math.PI * 2;
        // 随机速度（极慢）
        const speed = 0.01; // 0.05-0.25 px/frame
        // const speed = Math.random() * 0.2 + 0.05; // 0.05-0.25 px/frame
        
        stars.push({
            startX: startX,
            startY: startY,
            x: startX,
            y: startY,
            radius: Math.random() * 4 + 2, // 2-6px
            baseOpacity: Math.random() * 0.2 + 0.4, // 0.1-0.3
            opacity: Math.random() * 0.2 + 0.1,
            // 移动参数 - 让粒子在各个方向随机移动
            angle: initialAngle, // 当前移动方向（0-2π）
            speed: speed,
            // 方向变化参数（让方向缓慢变化，形成曲线路径）
            angleChangeRate: Math.random() * 0.008 + 0.003, // 方向变化速率
            angleChangePhase: Math.random() * Math.PI * 2, // 方向变化的相位
            // 路径波动参数（创建更复杂的随机路径）
            pathAmplitudeX: Math.random() * 150 + 80, // X方向波动幅度
            pathAmplitudeY: Math.random() * 150 + 80, // Y方向波动幅度
            pathFrequencyX: Math.random() * 0.002 + 0.0005, // X方向波动频率
            pathFrequencyY: Math.random() * 0.002 + 0.0005, // Y方向波动频率
            pathPhaseX: Math.random() * Math.PI * 2, // X方向相位
            pathPhaseY: Math.random() * Math.PI * 2, // Y方向相位
            time: 0
        });
    }
    
    // 动画循环 - 30秒完成一个来回
    const cycleDuration = 30000; // 30秒
    let animationId;
    let lastFrameTime = Date.now();
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const currentTime = Date.now();
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        
        stars.forEach(star => {
            // 更新时间（归一化到0-1，30秒循环）
            star.time = (currentTime % cycleDuration) / cycleDuration;
            
            // 方向缓慢变化（使用正弦波让方向平滑变化，形成曲线路径）
            const angleChange = Math.sin(currentTime * star.angleChangeRate + star.angleChangePhase) * 0.01;
            star.angle += angleChange;
            
            // 添加额外的随机波动（让路径更随机，但保持平滑）
            const randomWobble = (Math.random() - 0.5) * 0.015; // 小的随机摆动
            star.angle += randomWobble;
            
            // 计算基础移动（基于角度和速度）
            const baseDx = Math.cos(star.angle) * star.speed;
            const baseDy = Math.sin(star.angle) * star.speed;
            
            // 添加路径波动（使用不同频率的正弦波，让路径更复杂）
            const pathX = Math.sin(currentTime * star.pathFrequencyX + star.pathPhaseX) * star.pathAmplitudeX;
            const pathY = Math.cos(currentTime * star.pathFrequencyY + star.pathPhaseY) * star.pathAmplitudeY;
            
            // 更新位置（结合基础移动和路径波动）
            star.x = star.startX + pathX + baseDx * (currentTime % cycleDuration) / 40;
            star.y = star.startY + pathY + baseDy * (currentTime % cycleDuration) / 40;
            
            // 如果超出屏幕边界，从对侧重新进入（保持连续性）
            if (star.x < -50) {
                star.x = canvas.width + 50;
                star.startX = canvas.width;
            } else if (star.x > canvas.width + 50) {
                star.x = -50;
                star.startX = 0;
            }
            
            if (star.y < -50) {
                star.y = canvas.height + 50;
                star.startY = canvas.height;
            } else if (star.y > canvas.height + 50) {
                star.y = -50;
                star.startY = 0;
            }
            
            // 透明度缓慢变化（0.1-0.3）
            star.opacity = star.baseOpacity + Math.sin(currentTime * 0.001 + star.angleChangePhase) * 0.1;
            star.opacity = Math.max(0.1, Math.min(0.3, star.opacity));
            
            // 绘制星星
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(245, 230, 211, ${star.opacity})`;
            ctx.fill();
        });
        
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
    
    // 窗口大小改变时重新调整画布
    const resizeHandler = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeHandler);
    
    // 返回清理函数
    return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resizeHandler);
    };
}

// 文字动态效果：逐句淡入 + 逐词淡入
function animateTextWords(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    // 确保容器可见
    container.style.opacity = '1';
    container.style.visibility = 'visible';
    
    // 重置所有文字元素状态（重要：返回时重新显示）
    const allSentences = container.querySelectorAll('.sentence');
    const allWords = container.querySelectorAll('.word');
    
    // 重置句子和词的状态
    allSentences.forEach(sentence => {
        sentence.classList.remove('visible');
        sentence.style.opacity = '';
        sentence.style.visibility = '';
    });
    
    allWords.forEach(word => {
        word.classList.remove('visible');
        word.style.opacity = '';
        word.style.visibility = '';
        word.style.transform = '';
        word.style.filter = '';
    });
    
    const sentences = container.querySelectorAll('.sentence');
    
    if (sentences.length === 0) {
        // 如果没有句子结构，直接处理词
        const words = container.querySelectorAll('.word');
        words.forEach((word, index) => {
            setTimeout(() => {
                word.classList.add('visible');
            }, index * 300);
        });
        return;
    }
    
    let sentenceIndex = 0;
    
    function showNextSentence() {
        if (sentenceIndex >= sentences.length) return;
        
        const sentence = sentences[sentenceIndex];
        sentence.classList.add('visible');
        
        const words = sentence.querySelectorAll('.word');
        
        words.forEach((word, wordIndex) => {
            setTimeout(() => {
                word.classList.add('visible');
            }, wordIndex * 300);
        });
        
        // 等待所有词显示完成后，立即显示下一句（不停留，不间隔）
        const totalWordTime = words.length * 300;
        setTimeout(() => {
            sentenceIndex++;
            if (sentenceIndex < sentences.length) {
                showNextSentence(); // 立即显示下一句，无间隔
            }
        }, totalWordTime);
    }
    
    showNextSentence();
}

// 阶段3：自我关怀（30秒）
function startStage3() {
    switchScreen('stage3Screen');
    
    // 初始化统一背景
    const cleanup = initUnifiedBackground('Stage3');
    if (cleanup) AppState.backgroundCleanup = cleanup;
    
    // 逐词淡入动画
    setTimeout(() => {
        animateTextWords('#stage3Screen .self-care-instruction');
    }, 100);
    
    const message = "我在这里，我不会离开你";
    speakText(message);
    
    // 初始化触摸反馈（拥抱图片）
    initHugTouchFeedback();
    
    let timeLeft = 30;
    const timeLeftEl = document.querySelector('#stage3Screen .time-left');
    
    AppState.stageTimer = setInterval(() => {
        timeLeft--;
        if (timeLeftEl) timeLeftEl.textContent = timeLeft + '秒';
        if (timeLeft <= 0) {
            clearInterval(AppState.stageTimer);
            fadeOutAllText('#stage3Screen .self-care-instruction');
            setTimeout(() => {
                if (AppState.backgroundCleanup) AppState.backgroundCleanup();
                goToStage(4);
            }, 1000);
        }
    }, 1000);
}

// 初始化拥抱图片触摸反馈
function initHugTouchFeedback() {
    const hugImage = document.getElementById('hugImage');
    if (!hugImage) return;
    
    hugImage.addEventListener('touchstart', (e) => {
        e.preventDefault();
        hugImage.classList.add('touching');
        
        // 播放心跳声（简化处理，使用震动模拟）
        playHeartbeat();
        
        // 脉冲光效果
        const pulse = document.querySelector('#hugImage .pulse-effect');
        if (pulse) {
            pulse.classList.add('active');
        }
    });
    
    hugImage.addEventListener('touchend', () => {
        hugImage.classList.remove('touching');
        const pulse = document.querySelector('#hugImage .pulse-effect');
        if (pulse) {
            pulse.classList.remove('active');
        }
    });
}

// 阶段4：安全照片（20秒）
function startStage4() {
    switchScreen('stage4Screen');
    
    // 初始化统一背景
    const cleanup = initUnifiedBackground('Stage4');
    if (cleanup) AppState.backgroundCleanup = cleanup;
    
    const message = "看看这个让你感到安全的存在";
    speakText(message);
    
    // 加载并显示安全照片（随机3张，支持滑动）
    const slider = document.getElementById('safePhotoSlider');
    const indicators = document.querySelector('#stage4Screen .photo-indicators');
    const allPhotos = getSafePhotos();
    
    if (slider) {
        if (allPhotos.length > 0) {
            // 随机选择3张照片（如果照片数量少于3张，则全部显示）
            const selectedPhotos = [];
            const photoCount = Math.min(3, allPhotos.length);
            const shuffled = [...allPhotos].sort(() => Math.random() - 0.5);
            
            for (let i = 0; i < photoCount; i++) {
                selectedPhotos.push(shuffled[i]);
            }
            
            // 清空容器
            slider.innerHTML = '';
            if (indicators) indicators.innerHTML = '';
            
            // 创建照片元素
            selectedPhotos.forEach((photo, index) => {
                const photoWrapper = document.createElement('div');
                photoWrapper.className = 'safe-photo-slide';
                if (index === 0) photoWrapper.classList.add('active');
                
                const img = document.createElement('img');
                img.src = photo;
                img.className = 'safe-photo';
                img.style.opacity = '0';
                photoWrapper.appendChild(img);
                slider.appendChild(photoWrapper);
                
                // 淡入显示第一张
                if (index === 0) {
                    setTimeout(() => {
                        img.style.transition = 'opacity 2s';
                        img.style.opacity = '1';
                    }, 100);
                }
                
                // 创建指示器
                if (indicators && selectedPhotos.length > 1) {
                    const indicator = document.createElement('div');
                    indicator.className = 'photo-indicator';
                    if (index === 0) indicator.classList.add('active');
                    indicator.dataset.index = index;
                    indicators.appendChild(indicator);
                }
            });
            
            // 初始化滑动功能
            if (selectedPhotos.length > 1) {
                initPhotoSlider(selectedPhotos.length);
            }
        } else {
            slider.innerHTML = '<div class="safe-photo-placeholder">🖼️</div>';
            if (indicators) indicators.innerHTML = '';
        }
    }
    
    let timeLeft = 20;
    const timeLeftEl = document.querySelector('#stage4Screen .time-left');
    
    AppState.stageTimer = setInterval(() => {
        timeLeft--;
        if (timeLeftEl) timeLeftEl.textContent = timeLeft + '秒';
        if (timeLeft <= 0) {
            clearInterval(AppState.stageTimer);
            if (AppState.backgroundCleanup) AppState.backgroundCleanup();
            goToStage(5);
        }
    }, 1000);
}

// 初始化照片滑动功能
function initPhotoSlider(totalPhotos) {
    const slider = document.getElementById('safePhotoSlider');
    const indicators = document.querySelectorAll('.photo-indicator');
    let currentIndex = 0;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    if (!slider || totalPhotos <= 1) return;
    
    // 切换到指定照片
    function goToPhoto(index) {
        if (index < 0 || index >= totalPhotos) return;
        
        currentIndex = index;
        const slides = slider.querySelectorAll('.safe-photo-slide');
        const photos = slider.querySelectorAll('.safe-photo');
        
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
            if (i === index) {
                const img = photos[i];
                if (img.style.opacity !== '1') {
                    img.style.transition = 'opacity 2s';
                    img.style.opacity = '1';
                }
            }
        });
        
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });
    }
    
    // 触摸事件
    slider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });
    
    slider.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.touches[0].clientX;
    });
    
    slider.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        
        const diffX = startX - currentX;
        const threshold = 50; // 滑动阈值
        
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                // 向左滑动，下一张
                goToPhoto(currentIndex + 1);
            } else {
                // 向右滑动，上一张
                goToPhoto(currentIndex - 1);
            }
        }
    });
    
    // 鼠标事件（桌面端支持）
    slider.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        isDragging = true;
        e.preventDefault();
    });
    
    slider.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        currentX = e.clientX;
    });
    
    slider.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        
        const diffX = startX - currentX;
        const threshold = 50;
        
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                goToPhoto(currentIndex + 1);
            } else {
                goToPhoto(currentIndex - 1);
            }
        }
    });
    
    slider.addEventListener('mouseleave', () => {
        isDragging = false;
    });
    
    // 指示器点击
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            goToPhoto(index);
        });
    });
}

// 阶段5：感官落地（45秒，五感正念）
function startStage5() {
    switchScreen('stage5Screen');
    
    // 初始化统一背景
    const cleanup = initUnifiedBackground('Stage5');
    if (cleanup) AppState.backgroundCleanup = cleanup;
    
    let currentStep = 0;
    const titleEl = document.querySelector('.sensory-title');
    
    function showNextStep() {
        if (currentStep >= SensorySteps.length) {
            if (AppState.backgroundCleanup) AppState.backgroundCleanup();
            goToStage(7);
            return;
        }
        
        const step = SensorySteps[currentStep];
        const countdownEl = document.getElementById('sensoryCountdown');
        
        // 清空并重新构建文字（逐词淡入）
        if (titleEl) {
            titleEl.innerHTML = '';
            const words = step.text.split('');
            words.forEach((char, index) => {
                const span = document.createElement('span');
                span.className = 'word';
                span.textContent = char === ' ' ? '\u00A0' : char;
                titleEl.appendChild(span);
            });
            
            // 启动逐词淡入动画
            setTimeout(() => {
                animateTextWords('.sensory-title');
            }, 100);
        }
        
        speakText(step.voice);
        
        let stepTimeLeft = Math.floor(step.duration / 1000);
        if (countdownEl) countdownEl.textContent = stepTimeLeft + '秒';
        
        const stepTimer = setInterval(() => {
            stepTimeLeft--;
            if (countdownEl) countdownEl.textContent = stepTimeLeft + '秒';
            
            if (stepTimeLeft <= 0) {
                clearInterval(stepTimer);
                fadeOutAllText('.sensory-title');
                currentStep++;
                setTimeout(showNextStep, 1000);
            }
        }, 1000);
    }
    
    showNextStep();
}

// 阶段6：思维擦拭（可选，30秒）
function startStage6() {
    switchScreen('stage6Screen');
    
    // 初始化统一背景
    const cleanup = initUnifiedBackground('Stage6');
    if (cleanup) AppState.backgroundCleanup = cleanup;
    
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
            if (AppState.backgroundCleanup) AppState.backgroundCleanup();
            goToStage(7);
        }
    }, 1000);
}

// 阶段7：结束与见证
function startStage7() {
    switchScreen('stage7Screen');
    
    // 初始化统一背景
    const cleanup = initUnifiedBackground('Stage7');
    if (cleanup) AppState.backgroundCleanup = cleanup;
    
    // 计算总耗时
    if (AppState.startTime) {
        AppState.totalDuration = Math.floor((Date.now() - AppState.startTime) / 1000);
        const minutes = Math.floor(AppState.totalDuration / 60);
        const seconds = AppState.totalDuration % 60;
        
        const completionText = document.getElementById('completionText');
        if (completionText) {
            const text = minutes > 0 
                ? `你刚刚和情绪浪潮一起度过了${minutes}分${seconds}秒。它来了，也会走。`
                : `你刚刚和情绪浪潮一起度过了${seconds}秒。它来了，也会走。`;
            
            // 构建逐词结构
            completionText.innerHTML = '';
            const words = text.split('');
            words.forEach((char, index) => {
                const span = document.createElement('span');
                span.className = 'word';
                span.textContent = char === ' ' ? '\u00A0' : char;
                completionText.appendChild(span);
            });
            
            // 启动逐词淡入动画
            setTimeout(() => {
                animateTextWords('#completionText');
            }, 100);
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

// 返回上一步
function goBackStage() {
    if (AppState.currentStage > 1) {
        goToStage(AppState.currentStage - 1);
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

// 初始化触摸反馈（保留旧函数以兼容）
function initTouchFeedback() {
    // 这个函数现在由 initHugTouchFeedback 替代
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
