// ==========================================================================
// ⚙️ 全互动式华文教学系统阅读器大脑 - script.js (含提交后重做/看答案功能)
// ==========================================================================

let currentIdx = -1; 
let saved = JSON.parse(localStorage.getItem('saved_104')) || [];
let quizData = [];
let currentQuizIdx = 0;
let isLocked = false;
let userSelectedAnswers = {}; // 存储学生当前选中的临时答案 (格式： { 题目ID: "选中的选项完整文本" })
let isTeacherMode = false;    // 👨‍🏫 全局记录教师模式是否激活

window.onload = function() {
    // 初始化网页标题
    if (typeof lessonTitle !== 'undefined') {
        document.getElementById('articleTitle').innerText = lessonTitle;
        document.title = lessonTitle;
    }

    // 渲染课文基底、生词本和选择题
    if (typeof lessonData !== 'undefined') { 
        render(); 
        renderNB(); 
        renderMultipleChoiceQuizzes(); 
    }
    
    // 初始化气泡弹窗事件，点击空白处自动收回激活状态
    const popover = document.getElementById('buddyPopover');
    if (popover) {
        document.body.appendChild(popover);
    }
    document.addEventListener('click', () => { 
        const pop = document.getElementById('buddyPopover');
        if (pop) pop.style.display = 'none'; 
        document.querySelectorAll('ruby').forEach(r => r.classList.remove('is-active'));
    });
};

// 👨‍🏫 教师专用隐藏门验证与切换逻辑
function toggleTeacherMode() {
    const btn = document.getElementById('teacherModeBtn');
    if (!btn) return;
    if (!isTeacherMode) {
        let password = prompt("🔐 请输入教师专属特权密码:");
        if (password === "1234") {
            isTeacherMode = true;
            btn.innerText = "🔒 退出教师模式";
            btn.style.background = "#2c3e50";
            alert("👨‍🏫 验证成功！课文逐段赏析与习题考点剖析已全面解锁。");
        } else if (password !== null) {
            alert("❌ 密码错误！该功能仅供授课教师教学研讨使用。");
            return;
        } else { return; }
    } else {
        isTeacherMode = false;
        btn.innerText = "👨‍🏫 教师模式";
        btn.style.background = "#e67e22";
    }
    // 状态切换后自动重刷界面，实时隐藏/展现解析面板
    render();
    renderMultipleChoiceQuizzes();
}

// 📖 正文渲染器：支持华文首行空两格，并将灰色段号悬浮在左侧，同时动态支持教师赏析卡片
function render() {
    const cnt = document.getElementById('content'); 
    if (!cnt) return;
    cnt.innerHTML = "";
    let pNum = 1; 
    let p = document.createElement("p"); 
    
    function finalizeParagraph(paragraphElement) {
        if (paragraphElement.childNodes.length === 0) return;
        const textContent = paragraphElement.innerText.trim();
        const isAuthorLineAtEnd = (textContent.startsWith("（") && textContent.includes("《"));
        
        if (isAuthorLineAtEnd) {
            paragraphElement.style.textIndent = "0";
            paragraphElement.style.textAlign = "right";  
            paragraphElement.style.color = "#7f8c8d";    
            paragraphElement.style.fontSize = "15px";     
            paragraphElement.style.marginTop = "30px";    
            cnt.appendChild(paragraphElement);
        } else {
            paragraphElement.style.position = "relative";
            paragraphElement.style.textIndent = "2em"; 
            paragraphElement.style.paddingLeft = "0"; 
            
            let s = document.createElement("span");
            s.className = "p-index";
            s.innerText = "第" + pNum + "段";
            
            s.style.position = "absolute";
            s.style.left = "-55px"; 
            s.style.top = "4px"; 
            s.style.textIndent = "0"; 
            
            paragraphElement.insertBefore(s, paragraphElement.firstChild); 
            cnt.appendChild(paragraphElement);

            // 👨‍🏫 教师模式特权：若配有赏析文本，则在段落下方动态塞入一个优雅的浅绿茶色赏析面板
            if (isTeacherMode && typeof lessonAppreciation !== 'undefined' && lessonAppreciation[pNum - 1]) {
                const appBox = document.createElement("div");
                appBox.style.background = "#f4f9f4";
                appBox.style.borderLeft = "4px solid #2ecc71";
                appBox.style.padding = "10px 15px";
                appBox.style.margin = "10px 0 25px 0";
                appBox.style.fontSize = "14px";
                appBox.style.color = "#27ae60";
                appBox.style.textIndent = "0";
                appBox.style.borderRadius = "4px";
                appBox.style.lineHeight = "1.6";
                appBox.innerHTML = `<strong>💡 教学赏析：</strong>${lessonAppreciation[pNum - 1]}`;
                cnt.appendChild(appBox);
            }
            pNum++; 
        }
    }

    lessonData.forEach((d, i) => {
        if (d[0] === "\n") { finalizeParagraph(p); p = document.createElement("p"); }
        else if (d[1] === "") { let s = document.createElement("span"); s.innerText = d[0]; p.appendChild(s); }
        else {
            let r = document.createElement("ruby"); 
            r.setAttribute("data-word-index", i);
            r.onclick = (e) => { 
                e.stopPropagation(); 
                document.querySelectorAll('ruby').forEach(x=>x.classList.remove('is-active')); 
                r.classList.add('is-active'); 
                openPop(e.currentTarget, i);
            };
            r.innerHTML = `${d[0]}<rt>${d[1]}</rt>`; 
            p.appendChild(r);
        }
    });
    finalizeParagraph(p);
}

// 🎯 选择题渲染器
function renderMultipleChoiceQuizzes() {
    if (typeof quizDataList === 'undefined' || quizDataList.length === 0) return;
    
    const section = document.getElementById('quizSection');
    const container = document.getElementById('quizContainer');
    if (!section || !container) return;
    container.innerHTML = "";
    section.style.display = "block"; 
    
    // 初始化状态
    userSelectedAnswers = {};
    const resultScore = document.getElementById('quizResultScore');
    if (resultScore) {
        resultScore.style.display = "none";
        resultScore.innerHTML = "";
    }
    
    // 恢复原始提交检查按钮状态
    const submitBtn = document.getElementById('submitQuizBtn');
    if (submitBtn) {
        submitBtn.style.display = "inline-block";
        submitBtn.disabled = false;
        submitBtn.style.background = "#34495e";
        submitBtn.innerText = "提交检查 🚀";
    }

    // 清理可能残存的重做与看答案按钮组盒子
    const oldActionGroup = document.getElementById('postQuizActionGroup');
    if (oldActionGroup) oldActionGroup.remove();

    quizDataList.forEach((q) => {
        const qBox = document.createElement('div');
        qBox.style.marginBottom = "25px";
        qBox.style.paddingBottom = "15px";
        qBox.style.borderBottom = "1px dashed #ddd";
        qBox.setAttribute("data-q-id", q.id);

        const qText = document.createElement('div');
        qText.style.fontWeight = "bold";
        qText.style.fontSize = "16px";
        qText.style.marginBottom = "10px";
        qText.style.color = "#2c3e50";
        qText.innerHTML = `${q.id}. ${q.question.replace(/\n/g, '<br>')}`;
        qBox.appendChild(qText);

        const optionsBox = document.createElement('div');
        optionsBox.className = "options-group";
        
        let pureContents = q.options.map(opt => opt.replace(/^[A-D]\s+/, "").trim());
        let shuffledContents = [...pureContents].sort(() => Math.random() - 0.5);

        const prefixes = ["A", "B", "C", "D"];

        shuffledContents.forEach((content, index) => {
            const prefix = prefixes[index];
            let finalOptText = `${prefix} ${content}`; 

            const btn = document.createElement('button');
            btn.innerText = finalOptText;
            btn.className = "quiz-choice-btn";
            
            const originalMatch = q.options.find(o => {
                const cleanedO = o.replace(/^[A-D]\s+/, "").replace(/[。.]$/, "").trim();
                const cleanedContent = content.replace(/[。.]$/, "").trim();
                return cleanedO === cleanedContent;
            }) || q.options[0]; 

            btn.setAttribute("data-original-text", originalMatch);

            const btnLetter = originalMatch ? originalMatch.trim().charAt(0) : "A"; 

            if (isTeacherMode && btnLetter === q.answer) {
                btn.innerText = finalOptText + "  (⭐ 答案)";
                btn.style.color = "#e67e22"; 
                btn.style.fontWeight = "bold";
            }

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

            btn.onmouseenter = () => { if(!btn.classList.contains('selected') && !btn.disabled) btn.style.background = "#f5f6fa"; };
            btn.onmouseleave = () => { if(!btn.classList.contains('selected') && !btn.disabled) btn.style.background = "#fff"; };

            btn.onclick = () => {
                Array.from(optionsBox.children).forEach(b => {
                    b.classList.remove('selected');
                    b.style.background = "#fff";
                    b.style.borderColor = "#dcdde1";
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

                btn.classList.add('selected');
                btn.style.background = "#f0f8ff";          
                btn.style.borderColor = "#2980b9";         
                btn.style.color = "#2980b9";               
                btn.style.fontWeight = "700";              
                btn.style.boxShadow = "0 4px 15px rgba(41, 128, 185, 0.15)"; 

                userSelectedAnswers[q.id] = finalOptText;
            };
            optionsBox.appendChild(btn);
        });

        qBox.appendChild(optionsBox);

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

// 🚀 全局结算批改器：一次性核对并显现 ✅ ❌
function submitAllAnswers() {
    const totalQuestions = quizDataList.length;
    const answeredCount = Object.keys(userSelectedAnswers).length;

    if (answeredCount < totalQuestions) {
        alert(`⚠️ 老师发现你还有未填完的习题哦！目前完成了 (${answeredCount} / ${totalQuestions}) 题。`);
        return;
    }

    let score = 0;

    quizDataList.forEach(q => {
        const qBox = document.querySelector(`div[data-q-id="${q.id}"]`);
        const buttons = qBox.querySelectorAll('.quiz-choice-btn');
        const studentOptText = userSelectedAnswers[q.id];

        let selectedBtn = null;
        buttons.forEach(btn => {
            if (btn.innerText === studentOptText || btn.innerText.startsWith(studentOptText.substring(0, 5))) { 
                selectedBtn = btn; 
            }
        });

        const studentOriginalText = selectedBtn ? selectedBtn.getAttribute("data-original-text") : "";
        const studentLetter = studentOriginalText ? studentOriginalText.trim().charAt(0) : "";

        buttons.forEach(btn => {
            btn.disabled = true; 
            const btnOriginalText = btn.getAttribute("data-original-text");
            const btnLetter = btnOriginalText ? btnOriginalText.trim().charAt(0) : ""; 

            btn.style.background = "#fff";
            btn.style.color = "inherit";
            btn.style.borderColor = "#dcdde1";
            btn.style.boxShadow = "none";
            btn.style.paddingLeft = "15px"; 

            if (btnLetter === q.answer) {
                btn.style.background = "#2ecc71";
                btn.style.color = "white";
                btn.style.borderColor = "#2ecc71";
                btn.style.fontWeight = "bold";
                const baseText = btn.innerText.replace("  (⭐ 答案)", "");
                btn.innerText = baseText + "  ✅"; 
            }
            
            if (btn === selectedBtn && studentLetter !== q.answer) {
                btn.style.background = "#e74c3c";
                btn.style.color = "white";
                btn.style.borderColor = "#e74c3c";
                btn.style.fontWeight = "bold";
                btn.innerText = btn.innerText + "  ❌"; 
            }
        });

        if (studentLetter === q.answer) { score++; }
    });

    // 显现最终得分公告
    const resultBox = document.getElementById('quizResultScore');
    if (resultBox) {
        resultBox.style.display = "block";
        resultBox.innerHTML = `🎉 批改完成！您的最终得分是：<span style="font-size: 24px; color: #e67e22;">${score}</span> / ${totalQuestions} 分`;
    }
    
    // 隐藏传统的单独提交按钮
    const submitBtn = document.getElementById('submitQuizBtn');
    if (submitBtn) submitBtn.style.display = "none";

    // 🌟【核心增改】：动态生成“重新挑战”与“查看答案解析”双向交互选择按钮组
    const btnCenter = submitBtn.parentNode;
    const actionGroup = document.createElement("div");
    actionGroup.id = "postQuizActionGroup";
    actionGroup.style.marginTop = "20px";
    actionGroup.style.display = "flex";
    actionGroup.style.justifyContent = "center";
    actionGroup.style.gap = "15px";

    // A. 重新挑战按钮
    const retryBtn = document.createElement("button");
    retryBtn.innerText = "🔄 重新挑战一把";
    retryBtn.style.padding = "12px 25px";
    retryBtn.style.background = "#e67e22";
    retryBtn.style.color = "white";
    retryBtn.style.border = "none";
    retryBtn.style.borderRadius = "25px";
    retryBtn.style.fontSize = "15px";
    retryBtn.style.fontWeight = "bold";
    retryBtn.style.cursor = "pointer";
    retryBtn.onclick = () => { renderMultipleChoiceQuizzes(); }; // 一键还原并洗牌重刷
    actionGroup.appendChild(retryBtn);

    // B. 查看答案解析按钮
    const showAnsBtn = document.createElement("button");
    showAnsBtn.innerText = "📖 查看详细答案解析";
    showAnsBtn.style.padding = "12px 25px";
    showAnsBtn.style.background = "#2ecc71";
    showAnsBtn.style.color = "white";
    showAnsBtn.style.border = "none";
    showAnsBtn.style.borderRadius = "25px";
    showAnsBtn.style.fontSize = "15px";
    showAnsBtn.style.fontWeight = "bold";
    showAnsBtn.style.cursor = "pointer";
    showAnsBtn.onclick = () => {
        showAnsBtn.disabled = true;
        showAnsBtn.style.background = "#95a5a6";
        showAnsBtn.innerText = "解析已全面展开";
        revealExplanationsCard(); // 触发全卷深度订正提示卡浮现
    };
    actionGroup.appendChild(showAnsBtn);

    btnCenter.appendChild(actionGroup);
    resultBox.scrollIntoView({ behavior: "smooth", block: "center" });
}

// 🌟【新功能辅助】：全面铺开渲染订正反馈卡
function revealExplanationsCard() {
    quizDataList.forEach(q => {
        const qBox = document.querySelector(`div[data-q-id="${q.id}"]`);
        if (!qBox) return;

        const buttons = qBox.querySelectorAll('.quiz-choice-btn');
        let currentCorrectLetterOnPage = "";

        buttons.forEach(btn => {
            const btnOriginalText = btn.getAttribute("data-original-text");
            const btnLetter = btnOriginalText ? btnOriginalText.trim().charAt(0) : ""; 
            if (btnLetter === q.answer) {
                currentCorrectLetterOnPage = btn.innerText.trim().charAt(0);
            }
        });

        // 检查是否已经生成过，防止重复点击生成
        let existCard = qBox.querySelector('.dynamic-explanation-card');
        if (!existCard) {
            const feedBox = document.createElement("div");
            feedBox.className = "dynamic-explanation-card";
            feedBox.style.background = "#f4fdf7";
            feedBox.style.borderLeft = "4px solid #2ecc71";
            feedBox.style.padding = "12px 15px";
            feedBox.style.marginTop = "15px";
            feedBox.style.fontSize = "14px";
            feedBox.style.color = "#27ae60";
            feedBox.style.borderRadius = "4px";
            feedBox.style.lineHeight = "1.6";
            feedBox.innerHTML = `<strong>💡 本题正确答案是：<span style="font-size: 16px; color: #e67e22;">[ ${currentCorrectLetterOnPage} 选项 ]</span></strong><br><span style="color:#666; font-size:13px;">${q.analysis || '暂无深度解析。'}</span>`;
            qBox.appendChild(feedBox);
        }
    });
}

// ==================== 🛠 *字词字典弹窗及生词本核心逻辑* ============================
function openPop(el, i) {
    currentIdx = i; const d = lessonData[i];
    if (!d) return;
    document.getElementById('popWord').innerText = d[0];
    document.getElementById('popPinyin').innerText = `[${d[1]}]`;
    document.getElementById('popEn').innerText = d[2]; 
    document.getElementById('popBm').innerText = d[3];
    
    const pop = document.getElementById('buddyPopover'); 
    const arrow = document.getElementById('popArrow');
    if (!pop || !arrow) return;
    pop.style.display = 'block'; 
    
    const rect = el.getBoundingClientRect(); 
    const popRect = pop.getBoundingClientRect();
    
    let top = rect.top - popRect.height - 15; 
    let left = rect.left + (rect.width / 2) - (popRect.width / 2);
    
    if (left + popRect.width > window.innerWidth - 15) left = window.innerWidth - popRect.width - 15;
    if (left < 15) left = 15;
    
    arrow.style.left = `${(rect.left + rect.width / 2) - left}px`; 
    pop.style.top = `${top}px`; 
    pop.style.left = `${left}px`;
}

function saveToNotebook(e) { 
    e.stopPropagation(); 
    if (!saved.includes(currentIdx)) { 
        saved.push(currentIdx); 
        localStorage.setItem('saved_104', JSON.stringify(saved)); 
        renderNB(); 
    } 
    const btn = e.target; 
    btn.innerText = "✓ 已存"; 
    setTimeout(() => btn.innerText = "Copy 📋", 1000); 
}

function renderNB() { 
    const list = document.getElementById('notebookList'); 
    if (!list) return;
    if (saved.length === 0) { 
        list.innerHTML = "<span style='color:#999; font-size:13px;'>点击词语 Copy 记录生词</span>"; 
    } else { 
        list.innerHTML = ""; 
        saved.forEach(idx => { 
            const item = lessonData[idx]; 
            if(!item) return; 
            const div = document.createElement("div"); 
            div.className = "notebook-item"; 
            div.innerText = item[0]; 
            div.onclick = (e) => { 
                e.stopPropagation(); 
                const target = document.querySelector(`ruby[data-word-index="${idx}"]`); 
                if(target) { 
                    target.scrollIntoView({behavior: "smooth", block: "center"}); 
                    document.querySelectorAll('ruby').forEach(r => r.classList.remove('is-active')); 
                    setTimeout(() => { 
                        target.classList.add('is-active'); 
                        openPop(target, idx); 
                    }, 500); 
                } 
            }; 
            list.appendChild(div); 
        }); 
    } 
}

function forceClearNotebook() { localStorage.removeItem('saved_104'); saved = []; renderNB(); document.getElementById('gameContainer').style.display = 'none'; document.getElementById('gameToggleBtn').innerText = "🎯 生词测试"; }
function toggleGameMode() { const container = document.getElementById('gameContainer'); const btn = document.getElementById('gameToggleBtn'); if (!container || !btn) return; if (container.style.display === 'block') { container.style.display = 'none'; btn.innerText = "🎯 生词测试"; } else { if (saved.length < 1) { alert("生词本是空的哦！要先在正文里点生词进行 Copy 收集！"); return; } container.style.display = 'block'; btn.innerText = "📖 返回课文"; startQuizGame(); container.scrollIntoView({behavior: "smooth"}); } }
function startQuizGame() { quizData = [...saved].sort(() => Math.random() - 0.5); currentQuizIdx = 0; loadQuestion(); }

function loadQuestion() { 
    isLocked = false; 
    const targetIdx = quizData[currentQuizIdx]; 
    const data = lessonData[targetIdx]; 
    if (!data) return;
    document.getElementById('quizProgress').innerText = `第 ${currentQuizIdx + 1} / ${quizData.length} 题`; 
    document.getElementById('quizQuestion').innerText = data[0]; 
    document.getElementById('quizPinyin').innerText = `[${data[1]}]`; 
    
    const correctStr = (data[2].trim() + "；" + data[3].trim()); 
    let options = [correctStr]; 
    let others = lessonData.filter(d => d[1] !== "" && d[0] !== data[0]).map(d => (d[2].trim() + "；" + d[3].trim())); 
    others = [...new Set(others)].filter(s => s !== correctStr).sort(() => Math.random() - 0.5); 
    
    for(let i=0; i<3; i++) { if(others[i]) options.push(others[i]); } 
    options.sort(() => Math.random() - 0.5); 
    
    const optDiv = document.getElementById('quizOptions'); 
    if (!optDiv) return;
    optDiv.innerHTML = ""; 
    options.forEach(opt => { 
        const b = document.createElement('button'); 
        b.className = 'quiz-opt-btn'; 
        b.innerText = opt; 
        b.onclick = () => { 
            if(isLocked || b.classList.contains('wrong')) return; 
            if(opt.trim() === correctStr.trim()) { 
                isLocked = true; 
                b.classList.add('correct'); 
                setTimeout(() => { 
                    currentQuizIdx++; 
                    if(currentQuizIdx < quizData.length) loadQuestion(); 
                    else { alert("🎉 完成测试！你真棒！"); toggleGameMode(); } 
                }, 800); 
            } else { b.classList.add('wrong'); } 
        }; 
        optDiv.appendChild(b); 
    }); 
}

function toggleTheme() { document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme')==='dark'?'':'dark'); }
