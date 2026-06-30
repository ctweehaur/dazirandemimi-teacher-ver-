document.addEventListener("DOMContentLoaded", () => {
    const titleContainer = document.getElementById("lesson-title");
    const contentContainer = document.getElementById("lesson-content");

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

    let isPoetry = false;
    if (typeof lessonTitle !== "undefined" && lessonTitle.length > 0) {
        const titleText = lessonTitle.map(w => w[0]).join("");
        if (titleText.includes("汗水") || titleText.includes("诗") || titleText.includes("歌")) {
            isPoetry = true;
        }
    }

    if (typeof lessonData !== "undefined" && lessonData.length > 0 && contentContainer) {
        contentContainer.innerHTML = "";

        let currentSectionIndex = 1;
        let cardHtmlBuffer = "";

        const renderSectionCard = (htmlContent, sectionNum) => {
            if (!htmlContent.trim()) return;

            const labelText = isPoetry ? `第${sectionNum}节` : `第${sectionNum}段`;
            const appreciationText = (typeof lessonAppreciation !== "undefined" && lessonAppreciation[sectionNum - 1]) 
                ? lessonAppreciation[sectionNum - 1] 
                : "";

            const cardElement = document.createElement("div");
            cardElement.className = "section-card";
            cardElement.innerHTML = `
                <div class="section-tag">${labelText}</div>
                <div class="words-flow-container">
                    ${htmlContent}
                </div>
                ${appreciationText ? `
                    <div class="teacher-appreciation-box">
                        💡 <strong>教学赏析：</strong>${appreciationText}
                    </div>
                ` : ""}
            `;
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
                        cardHtmlBuffer += `<div class="poetry-line-break"></div>`;
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
                        <span class="chinese">${currentItem[currentItem[0] === "won't" ? 0 : 0]}</span>
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

function toggleTheme() {}
function toggleGameMode() {}
function toggleTeacherMode() {}
function forceClearNotebook() {}
