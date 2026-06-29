// ==========================================================================
// 🛠️ 智能诗歌/散文双模华语课文渲染引擎 - script.js
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. 获取 DOM 容器组件
    const titleContainer = document.getElementById("lesson-title");
    const contentContainer = document.getElementById("lesson-content");

    // 2. 渲染课文标题 (lessonTitle)
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

    // 3. 智能判断课文类型 (散文 Prose 或 诗歌 Poetry)
    // 自动检测标题或全局变量，如果包含“汗水”或“诗”等关键词，自动启用诗歌模式
    let isPoetry = false;
    if (typeof lessonTitle !== "undefined" && lessonTitle.length > 0) {
        const titleText = lessonTitle.map(w => word[0]).join("");
        if (titleText.includes("汗水") || titleText.includes("诗") || titleText.includes("歌")) {
            isPoetry = true;
        }
    }

    // 4. 核心渲染核心逻辑 (lessonData + lessonAppreciation)
    if (typeof lessonData !== "undefined" && lessonData.length > 0) {
        contentContainer.innerHTML = ""; // 清空容器

        let currentSectionIndex = 1; // 节/段的计数器
        let cardHtmlBuffer = "";     // 用来暂存当前卡片内所有字词卡片的 HTML 字符串

        // 辅助函数：负责把收集好的一个大卡片（一节/一段）渲染到页面上
        const renderSectionCard = (htmlContent, sectionNum) => {
            if (!htmlContent.trim()) return; // 如果是空的就跳过

            // 智能根据课文类型，把标签文字切换为 "第X节" 或 "第X段"
            const labelText = isPoetry ? `第${sectionNum}节` : `第${sectionNum}段`;
            
            // 安全获取对应的教师专属赏析数据
            const appreciationText = (typeof lessonAppreciation !== "undefined" && lessonAppreciation[sectionNum - 1]) 
                ? lessonAppreciation[sectionNum - 1] 
                : "";

            // 构建完整的大卡片 HTML 模板
            const cardElement = document.createElement("div");
            cardElement.className = "section-card";
            cardElement.innerHTML = `
                <!-- 智能小标签 -->
                <div class="section-tag">${labelText}</div>
                
                <!-- 生词流式排列区 -->
                <div class="words-flow-container">
                    ${htmlContent}
                </div>
                
                <!-- 教师专属隐藏福利：逐段赏析区 -->
                ${appreciationText ? `
                    <div class="teacher-appreciation-box">
                        💡 <strong>教学赏析：</strong>${appreciationText}
                    </div>
                ` : ""}
            `;
            contentContainer.appendChild(cardElement);
        };

        // 5. 遍历生词数据集
        for (let i = 0; i < lessonData.length; i++) {
            const currentItem = lessonData[i];
            const nextItem = lessonData[i + 1];

            // 情况甲：遇到换行符标记
            if (currentItem[0] === "\n") {
                if (isPoetry) {
                    // 【诗歌模式逻辑】
                    // 检查是不是连续两个换行符，或者当前是最后一个元素（代表真正的换节）
                    if (nextItem && nextItem[0] === "\n") {
                        // 1. 先把当前积累满的这一节生词卡片渲染出来
                        renderSectionCard(cardHtmlBuffer, currentSectionIndex);
                        // 2. 计数器累加，清空缓存，并跳过下一个多余的 \n
                        currentSectionIndex++;
                        cardHtmlBuffer = "";
                        i++; 
                    } else {
                        // 如果只是单个独立的 \n，在新诗中代表“下一行”而不是“换节”
                        // 我们直接在流式布局内部塞入一个真正的 HTML 换行符，强制它左对齐换行！
                        cardHtmlBuffer += `<div class="poetry-line-break"></div>`;
                    }
                } else {
                    // 【散文模式逻辑】
                    // 散文遇到独立的 \n 就会直接独立成段
                    renderSectionCard(cardHtmlBuffer, currentSectionIndex);
                    currentSectionIndex++;
                    cardHtmlBuffer = "";
                }
            } 
            // 情况乙：遇到正常的生词数据
            else {
                // 生成标准的、可单独点击的点读生词字词卡片
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

        // 6. 循环结束后，别忘了把最后留在缓冲区里的一节/一段渲染出来
        if (cardHtmlBuffer.trim()) {
            renderSectionCard(cardHtmlBuffer, currentSectionIndex);
        }
    }
});

// 🔊 点读发音辅助函数（支持马来西亚/新加坡华语标准语音 TTS）
function speakText(text) {
    if ('speechSynthesis' in window) {
        // 过滤掉标点符号和空白
        const cleanText = text.replace(/[，。？！、\n]/g, "").trim();
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'zh-CN'; // 设定为标准华语
        utterance.rate = 0.85;    // 稍微放慢语速，方便六年级华语不好的学生听清
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn("当前浏览器不支持 TTS 语音发音功能");
    }
}
