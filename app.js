// 应用状态管理
const AppState = {
    currentScreen: 'mainScreen',
    currentEmotion: null,
    currentGroundingStep: 1,
    usageCount: 0,
    tapCount: 0,
    breathingInterval: null
};

// 屏幕切换函数
function switchScreen(screenId) {
    // 隐藏所有屏幕
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // 显示目标屏幕
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        AppState.currentScreen = screenId;
    }
}

// 初始化应用
function initApp() {
    // 从本地存储加载使用次数
    const savedCount = localStorage.getItem('emotionAidUsageCount');
    if (savedCount) {
        AppState.usageCount = parseInt(savedCount);
    }
    
    // 绑定主界面事件
    document.getElementById('emergencyBtn').addEventListener('click', startEmergencyMode);
    
    // 绑定情绪选择按钮
    document.querySelectorAll('.emotion-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const emotion = e.currentTarget.dataset.emotion;
            selectEmotion(emotion);
        });
    });
    
    // 绑定恐慌模式下一步按钮
    document.getElementById('nextStepBtn').addEventListener('click', nextGroundingStep);
    
    // 绑定暴怒模式滑块
    const rageSlider = document.getElementById('rageSlider');
    rageSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('rageProgress').textContent = value;
        
        // 当滑到80%以上时显示完成按钮
        if (value >= 80) {
            document.getElementById('rageDoneBtn').style.display = 'block';
        }
    });
    
    // 绑定暴怒模式点击区域
    const tapZone = document.getElementById('tapZone');
    tapZone.addEventListener('click', () => {
        AppState.tapCount++;
        document.getElementById('tapCount').textContent = AppState.tapCount + '次';
        
        // 添加点击动画效果
        tapZone.style.transform = 'scale(0.98)';
        setTimeout(() => {
            tapZone.style.transform = 'scale(1)';
        }, 100);
        
        // 当点击超过30次时显示完成按钮
        if (AppState.tapCount >= 30) {
            document.getElementById('rageDoneBtn').style.display = 'block';
        }
    });
    
    // 绑定暴怒模式完成按钮
    document.getElementById('rageDoneBtn').addEventListener('click', () => {
        completeIntervention();
    });
    
    // 绑定悲伤模式完成按钮
    document.getElementById('sadnessDoneBtn').addEventListener('click', () => {
        completeIntervention();
    });
    
    // 绑定返回首页按钮
    document.getElementById('backHomeBtn').addEventListener('click', () => {
        resetApp();
        switchScreen('mainScreen');
    });
    
    // 绑定跳过呼吸练习按钮
    document.getElementById('skipBreathingBtn').addEventListener('click', () => {
        skipBreathing();
    });
    
    // 绑定干预界面返回按钮
    document.getElementById('panicBackBtn').addEventListener('click', () => {
        backToEmotionSelect();
    });
    
    document.getElementById('rageBackBtn').addEventListener('click', () => {
        backToEmotionSelect();
    });
    
    document.getElementById('sadnessBackBtn').addEventListener('click', () => {
        backToEmotionSelect();
    });
}

// 开始紧急模式
function startEmergencyMode() {
    // 增加使用次数
    AppState.usageCount++;
    localStorage.setItem('emotionAidUsageCount', AppState.usageCount.toString());
    
    // 切换到呼吸引导界面
    switchScreen('breathingScreen');
    
    // 开始呼吸练习
    startBreathingExercise();
}

// 呼吸练习
function startBreathingExercise() {
    const ball = document.getElementById('breathingBall');
    const text = document.getElementById('breathingText');
    const timeLeftEl = document.getElementById('timeLeft');
    
    let timeLeft = 30;
    let cycleCount = 0;
    const cycles = 3; // 3个呼吸周期
    
    // 清除之前的倒计时（如果有）
    if (AppState.breathingInterval) {
        clearInterval(AppState.breathingInterval);
    }
    
    // 更新倒计时
    AppState.breathingInterval = setInterval(() => {
        timeLeft--;
        timeLeftEl.textContent = timeLeft + '秒';
        
        if (timeLeft <= 0) {
            clearInterval(AppState.breathingInterval);
            AppState.breathingInterval = null;
            // 呼吸练习结束，切换到情绪分类
            switchScreen('emotionScreen');
        }
    }, 1000);
    
    // 呼吸周期函数
    function breatheCycle() {
        if (cycleCount >= cycles) {
            return;
        }
        
        cycleCount++;
        
        // 吸气阶段 (4秒)
        ball.className = 'breathing-ball inhale';
        text.textContent = '吸气';
        
        setTimeout(() => {
            // 屏息阶段 (2秒)
            ball.className = 'breathing-ball hold';
            text.textContent = '保持';
            
            setTimeout(() => {
                // 呼气阶段 (6秒)
                ball.className = 'breathing-ball exhale';
                text.textContent = '呼气';
                
                setTimeout(() => {
                    // 下一个周期
                    breatheCycle();
                }, 6000);
            }, 2000);
        }, 4000);
    }
    
    // 开始第一个周期
    breatheCycle();
}

// 跳过呼吸练习
function skipBreathing() {
    // 清除倒计时
    if (AppState.breathingInterval) {
        clearInterval(AppState.breathingInterval);
        AppState.breathingInterval = null;
    }
    
    // 直接跳转到情绪分类界面
    switchScreen('emotionScreen');
}

// 返回情绪分类界面
function backToEmotionSelect() {
    switchScreen('emotionScreen');
}

// 选择情绪
function selectEmotion(emotion) {
    AppState.currentEmotion = emotion;
    
    // 根据不同情绪跳转到对应干预页面
    switch(emotion) {
        case 'panic':
            switchScreen('panicScreen');
            initPanicMode();
            break;
        case 'rage':
            switchScreen('rageScreen');
            initRageMode();
            break;
        case 'sadness':
            switchScreen('sadnessScreen');
            break;
    }
}

// 初始化恐慌模式
function initPanicMode() {
    // 重置到第一步
    AppState.currentGroundingStep = 1;
    
    // 隐藏所有步骤
    document.querySelectorAll('.grounding-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // 显示第一步
    document.querySelector('.grounding-step[data-step="1"]').classList.add('active');
}

// 下一个接地步骤
function nextGroundingStep() {
    // 隐藏当前步骤
    document.querySelector('.grounding-step[data-step="' + AppState.currentGroundingStep + '"]')
        .classList.remove('active');
    
    AppState.currentGroundingStep++;
    
    if (AppState.currentGroundingStep > 5) {
        // 完成所有步骤
        completeIntervention();
    } else {
        // 显示下一步
        document.querySelector('.grounding-step[data-step="' + AppState.currentGroundingStep + '"]')
            .classList.add('active');
        
        // 如果是最后一步，改变按钮文字
        if (AppState.currentGroundingStep === 5) {
            document.getElementById('nextStepBtn').textContent = '完成';
        }
    }
}

// 初始化暴怒模式
function initRageMode() {
    // 重置滑块和点击计数
    document.getElementById('rageSlider').value = 0;
    document.getElementById('rageProgress').textContent = '0';
    AppState.tapCount = 0;
    document.getElementById('tapCount').textContent = '0次';
    document.getElementById('rageDoneBtn').style.display = 'none';
}

// 完成干预
function completeIntervention() {
    // 更新统计数据
    document.getElementById('todayCount').textContent = AppState.usageCount;
    
    // 切换到完成界面
    switchScreen('completeScreen');
}

// 重置应用状态
function resetApp() {
    AppState.currentEmotion = null;
    AppState.currentGroundingStep = 1;
    AppState.tapCount = 0;
    
    // 重置按钮文字
    document.getElementById('nextStepBtn').textContent = '下一步';
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

// 添加震动反馈（如果设备支持）
function vibrate(pattern = 50) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// 在关键操作时添加震动反馈
document.addEventListener('DOMContentLoaded', () => {
    // 紧急按钮震动
    document.getElementById('emergencyBtn').addEventListener('click', () => {
        vibrate(100);
    });
    
    // 情绪按钮震动
    document.querySelectorAll('.emotion-button').forEach(button => {
        button.addEventListener('click', () => {
            vibrate([50, 30, 50]);
        });
    });
});

// 导出给控制台调试用
window.AppState = AppState;
window.switchScreen = switchScreen;
