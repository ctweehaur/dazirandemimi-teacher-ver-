// 🎯 选择题渲染器：内容随机洗牌，但开头的 A, B, C, D 顺序绝对固定。
// 👨‍🏫 教师模式特权：未提交前，正确选项右侧会自动标注 (⭐ 答案) 给老师提前知晓！
function renderMultipleChoiceQuizzes() {
    if (typeof quizDataList === 'undefined' || quizDataList.length === 0) return;
    
    const section = document.getElementById('quizSection');
    const container = document.getElementById('quizContainer');
    container.innerHTML = "";
    section.style.display = "block"; 
    
    // 初始化状态
    userSelectedAnswers = {};
    document.getElementById('quizResultScore').style.display = "none";
    const submitBtn = document.getElementById('submitQuizBtn');
    submitBtn.disabled = false;
    submitBtn.style.background = "#34495e";
    submitBtn.innerText = "提交检查 🚀";

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
        
        // 剥离原先库里的 A/B/C/D 前缀，只把纯粹的内容拿出来洗牌
        let pureContents = q.options.map(opt => opt.replace(/^[A-D]\s+/, ""));
        let shuffledContents = [...pureContents].sort(() => Math.random() - 0.5);

        // 固定顺序的字母模板
        const prefixes = ["A", "B", "C", "D"];

        shuffledContents.forEach((content, index) => {
            const prefix = prefixes[index];
            let finalOptText = `${prefix} ${content}`; // 重新拼接成顺序完美的 "A 内容"

            const btn = document.createElement('button');
            btn.innerText = finalOptText;
            btn.className = "quiz-choice-btn";
            
            // 核心纽带：映射回原库里的整行文本
            const originalMatch = q.options.find(o => o.endsWith(content));
            btn.setAttribute("data-original-text", originalMatch);

            // 🔍 挖出原库里的真实字母
            const btnLetter = originalMatch.trim().charAt(0); 

            // 👨‍🏫 【教师专享高光改动】：如果处于教师模式，且该选项是正确答案，提前在按钮文本后面加上星号标记！
            if (isTeacherMode && btnLetter === q.answer) {
                btn.innerText = finalOptText + "  (⭐ 答案)";
                btn.style.color = "#e67e22"; // 老师看的时候，正确答案会呈现微微的暖橙色
            }

            // 基础结构样式
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
                    // 还原非选中状态下的教师颜色和常规颜色
                    const bOrig = b.getAttribute("data-original-text");
                    if (isTeacherMode && bOrig.trim().charAt(0) === q.answer) {
                        b.style.color = "#e67e22";
                    } else {
                        b.style.color = "inherit";
                    }
                    b.style.fontWeight = "normal";
                    b.style.boxShadow = "none";
                });

                // 选中的高级标记高亮
                btn.classList.add('selected');
                btn.style.background = "#f0f8ff";          
                btn.style.borderColor = "#2980b9";         
                btn.style.color = "#2980b9";               
                btn.style.fontWeight = "700";              
                btn.style.boxShadow = "0 4px 15px rgba(41, 128, 185, 0.15)"; 

                // 录入临时答案缓存
                userSelectedAnswers[q.id] = finalOptText;
            };
            optionsBox.appendChild(btn);
        });

        qBox.appendChild(optionsBox);

        // 渲染教师考点分析卡片
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
