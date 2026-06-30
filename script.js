document.addEventListener("DOMContentLoaded", () => {
    const titleContainer = document.getElementById("lesson-title");
    const contentContainer = document.getElementById("lesson-content");

    // 1. 渲染标题
    if (typeof lessonTitle !== "undefined" && lessonTitle.length > 0 && titleContainer) {
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

    // 2. 判断诗歌还是散文
    let isPoetry = false;
    if (typeof lessonTitle !== "undefined" && lessonTitle.length > 0) {
        const titleText = lessonTitle.map(w => w[0]).join("");
        if (titleText.includes("汗水") || titleText.includes("诗") || titleText.includes("歌")) {
            isPoetry = true;
        }
    }

    // 3. 核心课文渲染
    if (typeof lessonData !== "undefined" && lessonData.length > 0 && contentContainer) {
        contentContainer.innerHTML = "";

        let currentSectionIndex = 1;
        let cardHtmlBuffer = "";

        const renderSectionCard = (htmlContent, sectionNum) => {
            if (!htmlContent.trim()) return;

            const labelText = isPoetry ? `第${sectionNum}节` : `第${sectionNum}段`;
            
            // 安全提取赏析文本
            let appreciationText = "";
            if (typeof lessonAppreciation !== "undefined" && lessonAppreciation[sectionNum - 1]) {
                appreciationText = lessonAppreciation[sectionNum - 1];
            }

            // 拆开拼接，确保绝无标签嵌套冲突
            let cardHtml = "";
            cardHtml += '<div class="section-tag">' + labelText + '</div>';
            cardHtml += '<div class="words-flow-container">' + htmlContent + '</div>';
            
            if (appreciationText) {
                cardHtml += '<div class="teacher-appreciation-box">💡 <strong>教学赏析：</strong>' + appreciationText + '</div>';
            }

            const cardElement = document.createElement("div");
            cardElement.className = "section-card";
            cardElement.innerHTML = cardHtml;
            contentContainer.appendChild(cardElement);
        };

        for (let i = 0; i < lessonData.length; i++) {
            const currentItem = lessonData[i];
            const nextItem = lessonData[i + 1];

            if (currentItem[0] === "\n") {
                if (isPoetry) {
                    if (nextItem && nextItem[0] === "\n") {
                        renderSectionCard(cardHtmlBuffer, currentSectionIndex);
                        currentSectionIndex++;
                        cardHtmlBuffer = "";
                        i++;
                    } else {
                        cardHtmlBuffer += '<div class="poetry-line-break"></div>';
                    }
                } else {
                    renderSectionCard(cardHtmlBuffer, currentSectionIndex);
                    currentSectionIndex++;
                    cardHtmlBuffer = "";
                }
            } else {
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

        if (cardHtmlBuffer.trim()) {
            renderSectionCard(cardHtmlBuffer, currentSectionIndex);
        }
    }

    // 4. 渲染选择题 (来自 questions.js)
    const quizContainer = document.getElementById("quizContainer");
    const quizSection = document.getElementById("quizSection");

    if (quizContainer && typeof quizDataList !== "undefined" && quizDataList.length > 0) {
        if (quizSection) quizSection.style.display = "block";
        
        let quizHtml = "";
        quizDataList.forEach((quiz, index) => {
            const formattedQuestion = quiz.question.replace(/\n/g, "<br>");
            
            quizHtml += `
                <div class="quiz-item" style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px dashed #eaefed; text-align: left;">
                    <p class="quiz-title" style="font-size: 16px; font-weight: bold; color: #34495e; margin-bottom: 12px; line-height: 1.6;">
                        ${index + 1}. ${formattedQuestion}
                    </p>
                    <div class="options-group" data-quiz-id="${quiz.id}" style="display: flex; flex-direction: column; gap: 8px;">
            `;
            
            quiz.options.forEach(option => {
                const optionValue = option.trim().charAt(0);
                quizHtml += `
                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px 15px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                        <input type="radio" name="quiz-${quiz.id}" value="${optionValue}">
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

// 5. 提交检查计分
function submitAllAnswers() {
    if (typeof quizDataList === "undefined" || quizDataList.length === 0) return;
    
    let score = 0;
    const totalQuestions = quizDataList.length;
    
    quizDataList.forEach(quiz => {
        const selectedRadio = document.querySelector(`input[name="quiz-${quiz.id}"]:checked`);
        const analysisBox = document.getElementById(`analysis-${quiz.id}`);
        
        if (analysisBox) analysisBox.style.display = "block";
        
        if (selectedRadio) {
            const userAnswer = selectedRadio.value;
            if (userAnswer === quiz.answer) {
                score++;
                if (selectedRadio.closest("label")) selectedRadio.closest("label").style.background = "#e8f5e9";
            } else {
                if (selectedRadio.closest("label")) selectedRadio.closest("label").style.background = "#ffebee";
            }
        }
    });
    
    const scoreResult = document.getElementById("quizResultScore");
    if (scoreResult) {
        scoreResult.innerText = `检查完毕！得分：${score} / ${totalQuestions} (${Math.round((score/totalQuestions)*100)}%)`;
        scoreResult.style.display = "block";
        scoreResult.scrollIntoView({ behavior: 'smooth' });
    }
}

// 6. 语音点读
function speakText(text) {
    if ('speechSynthesis' in window) {
        const cleanText = text.replace(/[，。？！、\n]/g, "").trim();
        if (!cleanText) return;
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    }
}

// 预留空函数防止报错
function toggleTheme() {}
function toggleGameMode() {}
function toggleTeacherMode() {}
function forceClearNotebook() {}
