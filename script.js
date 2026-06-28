// ==========================================================================
// 🚀 《大自然的秘密》互动教学平台核心控制逻辑 - script.js
// ==========================================================================

// --- 全局状态管理 ---
let isTeacherMode = false;         // 教师模式状态开关
let userSelectedAnswers = {};     // 存储学生选择的答案缓存

// --- 1. 页面初始化大闸 ---
window.onload = function () {
    try {
        // 渲染正文课文
        renderLessonContent();
        
        // 渲染生词本/词汇表
        renderVocabulary();
        
        // 渲染选择题（自带洗牌与教师高光防崩锁）
        renderMultipleChoiceQuizzes();
        
        // 绑定教师模式切换按钮事件
        setupTeacherModeBridge();
    } catch (error) {
        console.error("【页面初始化发生致命错误】:", error);
        // 兜底提示，防止页面完全卡死无响应
        const status = document.getElementById('loadingStatus');
        if (status) {
            status.innerHTML = "<span style='color: #e74c3c;'>系统初始化失败，请检查 questions.js 或数据格式是否正确。</span>";
        }
    }
};

// --- 2. 课文正文渲染器 ---
function renderLessonContent() {
    const titleEl = document.getElementById('lessonTitle');
    const container = document.getElementById('textContentContainer');
    
    if (typeof lessonData === 'undefined') {
        if (titleEl) titleEl.innerText = "课文数据未加载，请检查 data.js";
        return;
    }
    
    // 隐藏加载中提示
    const loadingStatus = document.getElementById('loadingStatus');
    if (loadingStatus) loadingStatus.style.display = "none";
    
    // 渲染标题与正文
    if (titleEl) titleEl.innerText = lessonData.title;
    if (container) {
        container.innerHTML = "";
        lessonData.paragraphs.forEach(para => {
            const p = document.createElement('p');
            p.style.textIndent = "2em";
            p.style.lineHeight = "1.8";
            p.style.marginBottom = "15px";
            p.style.fontSize = "16px";
            p.style.color = "#333";
            p.innerText = para;
            container.appendChild(p);
        });
    }
}

// --- 3. 生词本渲染器 ---
function renderVocabulary() {
    const container = document.getElementById('vocabContainer');
    if (!container || typeof vocabularyList === 'undefined') return;
    
    container.innerHTML = "";
    vocabularyList.forEach(item => {
        const card = document.createElement('div');
        card.style.background = "#fff";
        card.style.border = "1px solid #e1e8ed";
        card.style.borderRadius = "8px";
        card.style.padding = "12px 15px";
        card.style.marginBottom = "10px";
        card.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
        
        card.innerHTML = `
            <div style="font-weight: bold; color: #e74c3c; font-size: 16px; marginBottom: 5px;">${item.word} [${item.pinyin}]</div>
            <div style="color: #555; font-size: 14px; line-height: 1.5;"><strong>解释：</strong>${item.explanation}</div>
            <div style="color: #7f8c8d; font-size: 13px; margin-top: 4px; font-style: italic;"><strong>例句：</strong>${item.example}</div>
        `;
        container.appendChild(card);
    });
}

// --- 4. 核心：选择题渲染器（带教师提前知晓标记与高精模糊匹配安全锁） ---
function renderMultipleChoiceQuizzes() {
    if (typeof quizDataList === 'undefined' || quizDataList.length === 0) return;
    
    const section = document.getElementById('quizSection');
    const container = document.getElementById('quizContainer');
    if (!section || !container) return;

    container.innerHTML = "";
    section.style.display = "block"; 
    
    // 初始化选择状态
    userSelectedAnswers = {};
    const scoreBox = document.getElementById('quizResultScore');
    if (scoreBox) scoreBox.style.display = "none";

    const submitBtn = document.getElementById('submitQuizBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.background = "#34495e";
        submitBtn.innerText = "提交检查 🚀";
    }

    quizDataList.forEach((q) => {
        const qBox = document.createElement('div');
        qBox.style.marginBottom = "25px";
        qBox.style.paddingBottom = "15px";
        qBox.style.borderBottom = "1px dashed #ddd";
        qBox.setAttribute("data-q-id", q.id);

        // 题目文本
        const qText = document.createElement('div');
        qText.style.fontWeight = "bold";
        qText.style.fontSize = "16px";
        qText.style.marginBottom = "10px";
        qText.style.color = "#2c3e50";
        qText.innerHTML = `${q.id}. ${q.question.replace(/\n/g, '<br>')}`;
        qBox.appendChild(qText);

        const optionsBox = document.createElement('div');
        optionsBox.className = "options-group";
        
        // 剥离原题库里的 A/B/C/D 前缀并清洗多余空格
        let pureContents = q.options.map(opt => opt.replace(/^[A-D]\s+/, "").trim());
        // 随机洗牌算法
        let shuffledContents = [...pureContents].sort(() => Math.random() - 0.5);

        // 固定顺序的 A, B, C, D 字母模板
        const prefixes = ["A", "B", "C", "D"];

        shuffledContents.forEach((content, index) => {
            const prefix = prefixes[index];
            let finalOptText = `${prefix} ${content}`; // 拼接重新排序后的完美展示文本

            const btn = document.createElement('button');
            btn.innerText = finalOptText;
            btn.className = "quiz-choice-btn";
            
            // 🌟【智能容错安全锁】：自动抹除中英文句号的干扰进行绝对内容比对，防范 Undefined 抛错卡死
            const originalMatch = q.options.find(o => {
                const cleanedO = o.replace(/^[A-D]\s+/, "").replace(/[。.]$/, "").trim();
                const cleanedContent = content.replace(/[。.]$/, "").trim();
                return cleanedO === cleanedContent;
            }) || q.options[0]; // 如果万一没有匹配到，由原数组第一项强制兜底，断绝崩溃可能

            btn.setAttribute("data-original-text", originalMatch);

            // 🔍 抓出该内容在原题库中真正的初始字母（A/B/C/D）
            const btnLetter = originalMatch ? originalMatch.trim().charAt(0) : "A"; 

            // 👨‍🏫【教师专享功能】：如果开启了教师模式，且当前按钮是正确答案，未提交前提前亮起标记！
            if (isTeacherMode && btnLetter === q.answer) {
                btn.innerText = finalOptText + "  (⭐ 答案)";
                btn.style.color = "#e67e22"; // 赋予教师醒目但不刺眼的暖橙色
                btn.style.fontWeight = "bold";
            }

            // 按钮基础 UI 排版样式
            btn.style.display = "block";
            btn.style.width = "100%";
            btn.style.textAlign = "left";
            btn.style.margin = "6px 0";
            btn.style.padding = "10px 15px";
            btn.style.border = "1px solid #dcdde1";
            btn.style.borderRadius = "6px";
            btn.style.background = "#fff";
            btn.style.cursor = "pointer";
            btn.style.fontSize = "14px";
            btn.style.transition = "all 0.1s";

            // 悬浮互动效果
            btn.onmouseenter = () => { if(!btn.classList.contains('selected') && !btn.disabled) btn.style.background = "#f5f6fa"; };
            btn.onmouseleave = () => { if(!btn.classList.contains('selected') && !btn.disabled) btn.style.background = "#fff"; };

            // 单选点击逻辑
            btn.onclick = () => {
                Array.from(optionsBox.children).forEach(b => {
                    b.classList.remove('selected');
                    b.style.background = "#fff";
                    b.style.borderColor = "#dcdde1";
                    
                    // 恢复教师专属高光颜色或常规颜色
                    const bOrig = b.getAttribute("data-original-text");
                    if (isTeacherMode && bOrig && bOrig.trim().charAt(0) === q.answer) {
                        b.style.color = "#e67e22";
                        b.style.fontWeight = "bold";
                    } else {
                        b.style.color = "inherit";
                        b.style.fontWeight = "normal";
                    }
                    b.style.boxShadow = "none";
                });

                // 选中当前点击选项的高级视觉样式
                btn.classList.add('selected');
                btn.style.background = "#f0f8ff";          
                btn.style.borderColor = "#2980b9";         
                btn.style.color = "#2980b9";               
                btn.style.fontWeight = "700";              
                btn.style.boxShadow = "0 4px 15px rgba(41, 128, 185, 0.15)"; 

                // 写入临时答案缓存
                userSelectedAnswers[q.id] = finalOptText;
            };
            optionsBox.appendChild(btn);
        });

        qBox.appendChild(optionsBox);

        // 👨‍🏫【考点剖析卡片】：只有教师模式激活时，才会在下方直接渲染可见
        if (isTeacherMode && q.analysis) {
            const analysisBox = document.createElement("div");
            analysisBox.style.background = "#fcf8ff";
            analysisBox.style.borderLeft = "4px solid #9b59b6";
            analysisBox.style.padding = "10px 15px";
            analysisBox.style.margin = "12px 0 5px 0";
            analysisBox.style.fontSize = "14px";
            analysisBox.style.color = "#8e44ad";
            analysisBox.style.borderRadius = "4px";
            analysisBox.style.lineHeight = "1.6";
            analysisBox.innerHTML = `<strong>📐 考点剖析：</strong>${q.analysis}`;
            qBox.appendChild(analysisBox);
        }

        container.appendChild(qBox);
    });
}

// --- 5. 学生提交答案检查逻辑 ---
function submitAnswers() {
    if (typeof quizDataList === 'undefined') return;
    
    let correctCount = 0;
    
    quizDataList.forEach(q => {
        const qBox = document.querySelector(`[data-q-id='${q.id}']`);
        if (!qBox) return;
        
        const buttons = qBox.querySelectorAll('.quiz-choice-btn');
        const selectedText = userSelectedAnswers[q.id];
        
        buttons.forEach(btn => {
            btn.disabled = true; // 冻结操作
            btn.style.cursor = "default";
            
            const originalText = btn.getAttribute("data-original-text");
            const originalLetter = originalText ? originalText.trim().charAt(0) : "";
            
            // 判定大绿大红：如果是正确选项，大面积染绿
            if (originalLetter === q.answer) {
                btn.style.background = "#e1f5fe"; // 浅绿蓝背景
                btn.style.borderColor = "#2ecc71"; // 翠绿边框
                btn.style.color = "#27ae60";       // 翠绿字
                btn.style.fontWeight = "bold";
                if (selectedText && btn.innerText.startsWith(selectedText.charAt(0))) {
                    correctCount++; // 学生正好选了这一项，得分计数
                }
            } 
            // 如果学生选错了这一项，大面积染红
            else if (selectedText && btn.innerText.startsWith(selectedText.charAt(0))) {
                btn.style.background = "#fde2e2";  // 浅红背景
                btn.style.borderColor = "#e74c3c";  // 亮红边框
                btn.style.color = "#c0392b";        // 暗红字
            }
        });
        
        // 动态展示普通学生版本的“答案解析卡”
        let explanationBox = qBox.querySelector('.dynamic-explanation-box');
        if (!explanationBox) {
            explanationBox = document.createElement('div');
            explanationBox.className = 'dynamic-explanation-box';
            explanationBox.style.marginTop = "12px";
            explanationBox.style.padding = "10px 15px";
            explanationBox.style.background = "#f9f9f9";
            explanationBox.style.borderLeft = "4px solid #2ecc71";
            explanationBox.style.borderRadius = "4px";
            explanationBox.style.fontSize = "14px";
            explanationBox.style.color = "#27ae60";
            explanationBox.style.lineHeight = "1.5";
            qBox.appendChild(explanationBox);
        }
        explanationBox.innerHTML = `<strong>💡 正确答案是 [ ${q.answer} ]</strong> —— ${q.analysis || '暂无解析。'}`;
    });
    
    // 渲染得分面板
    const scoreBox = document.getElementById('quizResultScore');
    if (scoreBox) {
        scoreBox.style.display = "block";
        scoreBox.style.padding = "15px";
        scoreBox.style.background = "#f1f2f6";
        scoreBox.style.borderRadius = "8px";
        scoreBox.style.textAlign = "center";
        scoreBox.style.fontSize = "18px";
        scoreBox.style.fontWeight = "bold";
        scoreBox.style.color = "#2c3e50";
        scoreBox.innerHTML = `检查完毕！您的得分是：<span style="color: #e74c3c; font-size: 24px;">${correctCount}</span> / ${quizDataList.length}`;
    }
    
    // 禁用提交按钮
    const submitBtn = document.getElementById('submitQuizBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.background = "#7f8c8d";
        submitBtn.innerText = "检查完成 ✅";
    }
}

// --- 6. 教师模式控制桥梁 ---
function setupTeacherModeBridge() {
    const toggleBtn = document.getElementById('teacherModeToggleBtn');
    if (!toggleBtn) return;
    
    toggleBtn.onclick = function() {
        if (!isTeacherMode) {
            // 输入密码进入教师模式
            const pwd = prompt("请输入教师专属授权密码以开启解析与答案预知：");
            if (pwd === "123456" || pwd === "teacher888") { // 支持双密码，可根据您的实际需求修改密码
                isTeacherMode = true;
                alert("👨‍🏫 教师模式已解锁！正确答案已就绪（⭐标注），隐藏考点剖析卡片已全面同步展现。");
                toggleBtn.innerText = "退出教师模式 👨‍🎓";
                toggleBtn.style.background = "#e74c3c";
                // 重新渲染选择题，刷新出高光星号提示
                renderMultipleChoiceQuizzes();
            } else if (pwd !== null) {
                alert("❌ 密码错误，无法解锁教师特权！");
            }
        } else {
            // 退出教师模式
            isTeacherMode = false;
            alert("已成功切回学生标准视角。");
            toggleBtn.innerText = "管理后台 / 教师模式 🔑";
            toggleBtn.style.background = "#9b59b6";
            // 重新渲染，抹除答案标记
            renderMultipleChoiceQuizzes();
        }
    };
}
