// 🚀 全局结算批改器：一次性核对并揭晓全卷对错（包含教师解析字母动态修正）
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

        // 定位到学生刚才选的那个按钮
        let selectedBtn = null;
        buttons.forEach(btn => {
            if (btn.innerText === studentOptText) { selectedBtn = btn; }
        });

        // 挖出学生选择的内容在原始题库中对应的真实字母
        const studentOriginalText = selectedBtn.getAttribute("data-original-text");
        const studentLetter = studentOriginalText.trim().charAt(0);

        let currentCorrectLetterOnPage = ""; // 🌟 用来记录正确答案当前在网页上的真实字母 (A/B/C/D)

        buttons.forEach(btn => {
            btn.disabled = true; // 提交后全面锁死
            
            const btnOriginalText = btn.getAttribute("data-original-text");
            const btnLetter = btnOriginalText.trim().charAt(0); 
            const pageLetter = btn.innerText.trim().charAt(0); // 当前网页上显示的 A/B/C/D

            // 清理选中的临时底色
            btn.style.background = "#fff";
            btn.style.color = "inherit";
            btn.style.borderColor = "#dcdde1";
            btn.style.boxShadow = "none";

            // 💡 绿显正确选项
            if (btnLetter === q.answer) {
                currentCorrectLetterOnPage = pageLetter; // 🌟 抓到了！记下正确答案此时跑到了哪个字母
                btn.style.background = "#2ecc71";
                btn.style.color = "white";
                btn.style.borderColor = "#2ecc71";
                if (studentLetter === q.answer) {
                    btn.innerText = btn.innerText + "  ✅️";
                }
            }
            
            // 💡 红显原库判定选错的选项
            if (btn === selectedBtn && studentLetter !== q.answer) {
                btn.style.background = "#e74c3c";
                btn.style.color = "white";
                btn.style.borderColor = "#e74c3c";
                btn.innerText = btn.innerText + "  ❌";
            }
        });

        // 🌟 【智慧教学高光改动】：如果处于教师模式，且显示了考点剖析卡片
        // 我们动态把“当前真正正确的字母”塞进解析的最前面！
        if (isTeacherMode && q.analysis) {
            // 先在题目盒子里找到之前生成的解析板
            const analysisBox = qBox.querySelector('div[style*="border-left: 4px solid rgb(155, 89, 182)"]');
            if (analysisBox) {
                analysisBox.innerHTML = `<strong>📐 考点剖析 <span style="color:#e67e22;">[ 本次测试正确选项为：${currentCorrectLetterOnPage} ]</span>：</strong>${q.analysis}`;
            }
        }

        if (studentLetter === q.answer) { score++; }
    });

    // 显现公告成绩面板
    const resultBox = document.getElementById('quizResultScore');
    resultBox.style.display = "block";
    resultBox.innerHTML = `🎉 批改完成！您的最终得分是：<span style="font-size: 24px; color: #e67e22;">${score}</span> / ${totalQuestions} 分`;
    
    const submitBtn = document.getElementById('submitQuizBtn');
    submitBtn.disabled = true;
    submitBtn.style.background = "#95a5a6";
    submitBtn.innerText = "已完成提交";
    
    resultBox.scrollIntoView({ behavior: "smooth", block: "center" });
}
