// ==========================================================================
// 🛠️ 智能诗歌/散文双模华语课文渲染引擎 - script.js (完美修复版)
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
        // 修正刚才导致报错的 map 变量错误 ⬇️
        const titleText = lessonTitle.map(w => w[0]).join("");
        if (titleText.includes("汗水") || titleText.includes("诗") || titleText.includes("歌")) {
            isPoetry = true;
        }
    }

    // 3. 核心渲染逻辑 (lessonData + lessonAppreciation)
    if (typeof lessonData !== "undefined" && lessonData.length > 0) {
        contentContainer.innerHTML = ""; // 清空加载中提示

        let currentSectionIndex = 1; // 节/段的计数器
        let cardHtmlBuffer = "";     // 用来暂存当前卡片内所有字词卡片的 HTML 字符串

        // 辅助函数：负责把收集好的一个大卡片（一节/一段）渲染到页面上
        const renderSectionCard = (htmlContent, sectionNum) => {
            if (!htmlContent.trim()) return; // 如果是空的就跳过

            // 🌟 完美支持你提到的诗歌格式要求：是“第X节”，普通课文则是“第X段”
            const labelText = isPoetry ? `第${sectionNum}节` : `第${sectionNum}段`;
            
            // 安全获取对应的教师专属赏析数据
            const appreciationText = (typeof lessonAppreciation !== "undefined" && lessonAppreciation[sectionNum - 1]) 
                ? lessonAppreciation[sectionNum - 1] 
                : "";

            // 构建完整的大卡片 HTML 模板
            const cardElement = document.createElement("div");
            cardElement.className = "section-card";
            cardElement.innerHTML = `
                <!-- 智能切换：诗歌显示“第X节”，散文显示“第X段” -->
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

        // 4. 遍历生词数据集
        for (let i = 0; i < lessonData.length; i++) {
            const currentItem = lessonData[i];
            const nextItem = lessonData[i + 1];

            // 情况甲：遇到换行符标记
            if (currentItem[0] === "\n") {
                if (isPoetry) {
                    // 【诗歌模式逻辑】
                    // 如果遇到连续两个换行符，代表真正的换节
                    if (nextItem && nextItem[0] === "\n") {
                        renderSectionCard(cardHtmlBuffer, currentSectionIndex);
                        currentSectionIndex++;
                        cardHtmlBuffer = "";
                        i++; // 跳过下一个多余的 \n
                    } else {
                        // 如果只是单个独立的 \n，在新诗中代表“下一行”而不是“换节”
                        // 我们直接在流式布局内部塞入一个真正的 HTML 换行符，强制它左对齐换行！
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
});

// 🔊 点读发音辅助函数（支持马来西亚/新加坡华语标准语音 TTS）
function speakText(text) {
    if ('speechSynthesis' in window) {
        const cleanText = text.replace(/[，。？！、\n]/g, "").trim();
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'zh-CN'; 
        utterance.rate = 0.85; // 稍微放慢语速，照顾华语基础弱的小朋友
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn("当前浏览器不支持 TTS 语音发音功能");
    }
}
