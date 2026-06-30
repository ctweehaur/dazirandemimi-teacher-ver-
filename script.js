// ==========================================================================
// 🛠️ 智能诗歌/散文双模华语课文渲染引擎 + 智能答题计分系统 - script.js (整合修复版)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    // 获取 DOM 容器组件
    const titleContainer = document.getElementById("lesson-title");
    const contentContainer = document.getElementById("lesson-content");

    // 1. 渲染课文标题 (lessonTitle)
    if (typeof lessonTitle !== "undefined" && lessonTitle.length > 0) {
        let titleHtml = "";
        lessonTitle.forEach(word => {
            titleHtml += `
                <div class="word-card title-card" onclick="speakText('${word[0]}')">
                    <span class="pinyin">${word[1]}</span>
                    <span class="chinese">${word[0]}</span>
                    <span class="english">${word[2]}</span>
                    <span class="malay">${word[3]}</span>
                </div>
            `;
        });
        titleContainer.innerHTML = titleHtml;
    }

    // 2. 智能判断课文类型 (散文 Prose 或 诗歌 Poetry)
    let isPoetry = false;
    if (typeof lessonTitle !== "undefined" && lessonTitle.length > 0) {
        const titleText = lessonTitle.map(w => w[0]).join("");
        if (titleText.includes("汗水") || titleText.includes("诗") || titleText.includes("歌")) {
            isPoetry = true;
        }
    }

    // 3. 核心课文渲染逻辑 (lessonData + lessonAppreciation)
    if (typeof lessonData !== "undefined" && lessonData.length > 0) {
        contentContainer.innerHTML = ""; // 清空加载中提示

        let currentSectionIndex = 1; // 节/段的计数器
        let cardHtmlBuffer = "";     // 用来暂存当前卡片内所有字词卡片的 HTML 字符串

        // 辅助函数：负责把收集好的一个大卡片（一节/一段）渲染到页面上
        const renderSectionCard = (htmlContent, sectionNum) => {
            if (!htmlContent.trim()) return; // 如果是空的就跳过

            const labelText = isPoetry ? `第${sectionNum}节` : `第${sectionNum}段`;
            
            // 安全获取对应的教师专属赏析数据
            const appreciationText = (typeof lessonAppreciation !== "undefined" && lessonAppreciation[sectionNum - 1]) 
                ? lessonAppreciation[sectionNum - 1] 
                : "";

            // 构建完整的大卡片 HTML 模板
            const cardElement = document.createElement("div");
            cardElement.className = "section-card";
            cardElement.innerHTML = `
                <div class="section-tag">${labelText}</div>
                <div class="words-flow-container">
                    ${htmlContent}
                </div>
                ${appreciationText ? `
                    <div class="teacher-appreciation-box" class="teacher-mode-element">
                        💡 <strong>教学赏析：</strong>${appreciationText}
                    </div>
                ` : ""}
            `;
            contentContainer.appendChild(cardElement);
        };

        // 4. 遍历生词数据集
        for (let i = 0; i < lessonData.length; i++) {
            const currentItem = lessonData[i];
            const nextItem = lessonData[i + 1];

            // 情况甲：遇到换行符标记
            if (currentItem[0] === "\n") {
                if (isPoetry) {
                    // 【诗歌模式逻辑】如果遇到连续两个换行符，代表真正的换节
                    if (nextItem && nextItem[0] === "\n") {
                        renderSectionCard(cardHtmlBuffer, currentSectionIndex);
                        currentSectionIndex++;
                        cardHtmlBuffer = "";
                        i++; // 跳过下一个多余的 \n
                    } else {
                        // 如果只是单个独立的 \n，在诗中代表“下一行”，强制左对齐换行
                        cardHtmlBuffer += `<div class="poetry-line-break"></div>`;
                    }
                } else {
                    // 【散文模式逻辑】单个独立换行就直接切成下一段
                    renderSectionCard(cardHtmlBuffer, currentSectionIndex);
                    currentSectionIndex++;
                    cardHtmlBuffer = "";
                }
            } 
            // 情况乙：遇到正常的生词数据
            else {
                cardHtmlBuffer += `
                    <div class="word-card" onclick="speakText('${currentItem[0]}')">
                        <span class="pinyin">${currentItem[1]}</span>
                        <span class="chinese">${currentItem[0]}</span>
                        <span class="english">${currentItem[2]}</span>
                        <span class="malay">${currentItem[3]}</span>
                    </div>
                `;
            }
        }

        // 5. 渲染最后一个留在缓冲区里的一节/一段
        if (cardHtmlBuffer.trim()) {
            renderSectionCard(cardHtmlBuffer, currentSectionIndex);
        }
    }

    // ==========================================================================
    // 📝 选择题动态渲染注入 (对接 questions.js)
    // ==========================================================================
    const quizContainer = document.getElementById("quizContainer");
    const quizSection = document.getElementById("quizSection");

    if (quizContainer && typeof quizDataList !== "undefined" && quizDataList.length > 0) {
        if (quizSection) quizSection.style.display = "block"; // 显示选择题卡片
        
        let quizHtml = "";
        quizDataList.forEach((quiz, index) => {
            // 处理题目中的换行符（兼容 I, II, III 等挑战项排版）
            const formattedQuestion = quiz.question.replace(/\n/g, "<br>");
            
            quizHtml += `
                <div class="quiz-item" style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px dashed #eaefed; text-align: left;">
                    <p class="quiz-title" style="font-size: 16px; font-weight: bold; color: #34495e; margin-bottom: 12px; line-height: 1.6;">
                        ${index + 1}. ${formattedQuestion}
                    </p>
                    <div class="options-group" data-quiz-id="${quiz.id}" style="display: flex; flex-direction: column; gap: 8px;">
            `;
            
            quiz.options.forEach(option => {
                const optionValue = option.trim().charAt(0); // 获取 A/B/C/D 作为单选值
                quizHtml += `
                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px 15px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                        <input type="radio" name="quiz-${quiz.id}" value="${optionValue}" style="cursor: pointer;">
                        <span style="font-size: 15px; color: #2c3e50;">${option}</span>
                    </label>
                `;
            });
            
            quizHtml += `
                    </div>
                    <div id="analysis-${quiz.id}" class="teacher-analysis-box" style="display: none; margin-top: 12px; padding: 12px; background: #e8f4fd; border-left: 4px solid #3498db; border-radius: 4px; font-size: 14px; color: #2980b9; line-height: 1.5;">
                        <strong>💡 考点分析：</strong>${quiz.analysis}
                    </div>
                </div>
            `;
        });
        
        quizContainer.innerHTML = quizHtml;
        
        // 点击选项整行即可快速选中单选框，并触发高亮
        quizContainer.querySelectorAll("label").forEach(label => {
            label.addEventListener("click", function() {
                const radio = this.querySelector("input[type='radio']");
                if (radio) {
                    radio.checked = true;
                    const group = this.closest(".options-group");
                    group.querySelectorAll("label").forEach(l => l.style.background = "#f8f9fa");
                    this.style.background = "#e1f5fe";
                </div>
            });
        });
    }
});

// 🚀 提交检查与智能计分函数
function submitAllAnswers() {
    if (typeof quizDataList === "undefined" || quizDataList.length === 0) return;
    
    let score = 0;
    const totalQuestions = quizDataList.length;
    
    quizDataList.forEach(quiz => {
        const selectedRadio = document.querySelector(`input[name="quiz-${quiz.id}"]:checked`);
        const analysisBox = document.getElementById(`analysis-${quiz.id}`);
        
        // 展开题目考点赏析
        if (analysisBox) analysisBox.style.display = "block";
        
        if (selectedRadio) {
            const userAnswer = selectedRadio.value;
            if (userAnswer === quiz.answer) {
                score++;
                if (selectedRadio.closest("label")) selectedRadio.closest("label").style.background = "#e8f5e9"; // 答对绿底
            } else {
                if (selectedRadio.closest("label")) selectedRadio.closest("label").style.background = "#ffebee"; // 答错红底
            }
        }
    });
    
    // 页面打印最终成绩
    const scoreResult = document.getElementById("quizResultScore");
    if (scoreResult) {
        scoreResult.innerText = `检查完毕！得分：${score} / ${totalQuestions} (${Math.round((score/totalQuestions)*100)}%)`;
        scoreResult.style.display = "block";
        scoreResult.scrollIntoView({ behavior: 'smooth' });
    }
}

// 🔊 点读发音辅助函数
function speakText(text) {
    if ('speechSynthesis' in window) {
        const cleanText = text.replace(/[，。？！、\n]/g, "").trim();
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
         utterance.lang = 'zh-CN'; 
        utterance.rate = 0.85; // 语速微调
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn("当前浏览器不支持 TTS 语音发音功能");
    }
}

// 占位函数防止 HTML 报错崩溃
function toggleTheme() { document.body.style.filter = document.body.style.filter ? '' : 'dark-mode'; }
function toggleGameMode() { alert("生词测试面板准备就绪！"); }
function toggleTeacherMode() { alert("教师模式已切换！"); }
function forceClearNotebook() { alert("生词本已清空！"); }
