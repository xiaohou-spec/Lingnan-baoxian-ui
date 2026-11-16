const pageType = document.body.dataset.page;
const terms = window.insuranceTerms || {};
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const easeOut = "cubic-bezier(0.23, 1, 0.32, 1)";

function createContentSwapper(element, axis = "y") {
  let animation;
  let version = 0;
  return async (update, direction = 1, immediate = false) => {
    version += 1;
    const currentVersion = version;
    if (immediate || reduceMotion.matches) {
      animation?.cancel();
      update();
      return;
    }
    const computed = getComputedStyle(element);
    const currentOpacity = Number(computed.opacity);
    const currentTransform = computed.transform === "none" ? "translateY(0)" : computed.transform;
    animation?.cancel();
    const exitTransform = axis === "x" ? `translateX(${-8 * direction}px)` : "translateY(-5px)";
    const exit = element.animate([{ opacity: currentOpacity, transform: currentTransform }, { opacity: 0, transform: exitTransform }], { duration: 120, easing: easeOut, fill: "forwards" });
    animation = exit;
    await exit.finished.catch(() => {});
    if (currentVersion !== version) return;
    update();
    exit.cancel();
    const enterTransform = axis === "x" ? `translateX(${10 * direction}px)` : "translateY(5px)";
    animation = element.animate([{ opacity: 0, transform: enterTransform }, { opacity: 1, transform: "translate(0, 0)" }], { duration: 180, easing: easeOut });
  };
}

const elderToggle = document.querySelector("#elder-toggle");
const elderToolbar = document.querySelector("#elder-toolbar");
const elderReadButton = document.querySelector("#elder-read-page");
const mainNav = document.querySelector("#main-nav");
const menuToggle = document.querySelector("#menu-toggle");
const pageCopy = {
  direction: ["险种查询", "五步了解保障方向，不推荐产品。"],
  dictionary: ["大白话词典", "查名词，看白话解释。"],
  pitfalls: ["避坑指南", "识话术，看条款，学会追问。"],
  claims: ["理赔流程", "看流程，备材料。"]
};

function resetElderReadButton() {
  elderReadButton.setAttribute("aria-pressed", "false");
  elderReadButton.querySelector("span").textContent = "朗读本页";
}

function setElderCopy(enabled) {
  const title = document.querySelector(".module-hero h1");
  const description = document.querySelector(".module-hero .container > p:last-child");
  [title, description].forEach(element => {
    if (!element.dataset.standardHtml) element.dataset.standardHtml = element.innerHTML;
  });
  title.innerHTML = enabled ? pageCopy[pageType][0] : title.dataset.standardHtml;
  description.innerHTML = enabled ? pageCopy[pageType][1] : description.dataset.standardHtml;
}

elderToggle.addEventListener("click", () => {
  const enabled = document.documentElement.classList.toggle("elder-mode");
  elderToggle.setAttribute("aria-pressed", String(enabled));
  elderToggle.querySelector("span").textContent = enabled ? "退出长辈模式" : "长辈模式";
  elderToolbar.hidden = !enabled;
  setElderCopy(enabled);
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  window.speechSynthesis?.cancel();
  resetElderReadButton();
  window.scrollTo({ top: 0, behavior: "instant" });
});

elderReadButton.addEventListener("click", () => {
  if (!("speechSynthesis" in window)) { showToast("当前浏览器暂不支持语音朗读。"); return; }
  if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); resetElderReadButton(); return; }
  const text = document.querySelector("#main").innerText.replace(/\s+/g, " ").trim();
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.9;
  utterance.onend = resetElderReadButton;
  utterance.onerror = resetElderReadButton;
  elderReadButton.setAttribute("aria-pressed", "true");
  elderReadButton.querySelector("span").textContent = "停止朗读";
  window.speechSynthesis.speak(utterance);
});

menuToggle.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
  menuToggle.querySelector("use").setAttribute("href", open ? "icons.svg#i-close" : "icons.svg#i-menu");
});
mainNav.addEventListener("click", event => {
  if (!event.target.closest("a")) return;
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.querySelector("use").setAttribute("href", "icons.svg#i-menu");
});

const correctionDialog = document.querySelector("#correction-dialog");
document.querySelectorAll(".correction-open").forEach(button => button.addEventListener("click", () => correctionDialog.showModal()));
document.querySelectorAll("[data-close-dialog]").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });
});

let toastTimer;
function showToast(message) {
  const toast = document.querySelector("#toast");
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}
document.querySelector("#correction-form").addEventListener("submit", event => {
  event.preventDefault();
  correctionDialog.close();
  event.target.reset();
  showToast("外观原型演示完成，未发送或保存任何数据。");
});

if (pageType === "dictionary") {
  const termTitle = document.querySelector("#term-title");
  const termPlain = document.querySelector("#term-plain");
  const termExample = document.querySelector("#term-example");
  const termMisconception = document.querySelector("#term-misconception");
  const relatedTerms = document.querySelector("#related-terms");
  const termList = document.querySelector("#term-list");
  const termArticle = document.querySelector(".term-article");
  const swapTerm = createContentSwapper(termArticle);
  let activeTerm = "";

  Object.keys(terms).forEach(term => {
    const button = document.createElement("button");
    button.className = "term-tab";
    button.type = "button";
    button.role = "tab";
    button.dataset.term = term;
    button.setAttribute("aria-selected", "false");
    const label = document.createElement("span");
    label.textContent = term;
    button.append(label);
    button.addEventListener("click", () => renderTerm(term));
    termList.append(button);
  });

  function renderTerm(term, immediate = false) {
    const content = terms[term];
    if (!content) return;
    termList.querySelectorAll(".term-tab").forEach(tab => {
      const selected = tab.dataset.term === term;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
    if (activeTerm === term) return;
    swapTerm(() => {
      activeTerm = term;
      termTitle.textContent = term;
      termPlain.textContent = content.plain;
      termExample.textContent = content.example;
      termMisconception.textContent = content.misconception;
      relatedTerms.replaceChildren(...content.related.map(related => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.openTerm = related;
        button.textContent = related;
        return button;
      }));
    }, 1, immediate);
  }

  relatedTerms.addEventListener("click", event => {
    const button = event.target.closest("[data-open-term]");
    if (button) renderTerm(button.dataset.openTerm);
  });
  document.querySelector("#term-filter").addEventListener("input", event => {
    const query = event.target.value.trim();
    termList.querySelectorAll(".term-tab").forEach(tab => { tab.hidden = Boolean(query) && !tab.dataset.term.includes(query); });
  });
  document.querySelector("#read-term").addEventListener("click", () => {
    if (!("speechSynthesis" in window)) { showToast("当前浏览器暂不支持语音朗读。"); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${activeTerm}。${terms[activeTerm].plain}`);
    utterance.lang = "zh-CN";
    window.speechSynthesis.speak(utterance);
  });
  const requestedTerm = new URLSearchParams(window.location.search).get("term");
  renderTerm(requestedTerm && terms[requestedTerm] ? requestedTerm : "免赔额", true);
}

if (pageType === "direction") {
  const wizardContent = document.querySelector("#wizard-content");
  const wizardProgressBar = document.querySelector("#wizard-progress-bar");
  const swapWizard = createContentSwapper(wizardContent, "x");
  const shareDialog = document.querySelector("#share-card-dialog");
  const wizardSteps = [
    { key: "identity", question: "这份保障为谁了解？", options: ["为自己", "为父母", "为孩子", "为配偶"] },
    { key: "responsibility", question: "你目前承担哪些家庭责任？", options: ["暂无负担", "有房贷等负债", "要赡养父母", "要抚养孩子"] },
    { key: "concerns", question: "最担心哪些问题？可多选。", multi: true, options: ["怕生大病没钱治", "怕意外拖累家人", "怕身后家人没保障", "想给孩子存教育金", "想给自己存养老金", "怕存款贬值想保值增值"] },
    { key: "social", question: "目前有哪些社保基础？", options: ["职工医保", "仅居民医保", "无社保"] },
    { key: "budget", question: "目前更倾向哪种安排？", options: ["先保基础", "有余力做进阶"] }
  ];
  const answers = {};
  let wizardStep = 0;
  let lastDirection = "";
  let lastReason = "";

  function renderMatrix(type) {
    const group = answers.identity === "为父母" ? "老人" : answers.identity === "为孩子" ? "孩子" : "成年人";
    const groups = ["孩子", "成年人", "老人"];
    const rows = {
      protection: [
        ["医疗险", ["yes", "yes", "yes"], ["医保 + 百万医疗", "医保 + 百万医疗", "同成年人"]],
        ["意外险", ["yes", "yes", "yes"], ["优先", "优先", "优先"]],
        ["重疾险", ["yes", "yes", "no"], ["优先", "优先", "先核保费与条件"]],
        ["定期寿险", ["no", "yes", "no"], ["通常不急", "有责任时", "通常不急"]],
        ["中高端医疗", ["conditional", "conditional", "conditional"], ["追求服务可考虑", "追求服务可考虑", "追求服务可考虑"]]
      ],
      savings: [
        ["终身寿险", ["yes", "yes", "yes"], ["教育金 / 传承", "增值 / 传承", "给子女 / 孙辈"]],
        ["养老年金", ["no", "yes", "yes"], ["通常不急", "提前做养老储备", "有一笔钱做养老储备"]],
        ["教育年金", ["conditional", "no", "no"], ["灵活度不高", "通常不急", "通常不急"]]
      ]
    };
    const marks = { yes: '<span class="matrix-yes" aria-label="优先了解">✓</span>', no: '<span class="matrix-no" aria-label="目前不急">×</span>', conditional: '<span class="matrix-conditional" aria-label="按需了解">•</span>' };
    document.querySelectorAll("[data-matrix-type]").forEach(button => button.classList.toggle("active", button.dataset.matrixType === type));
    document.querySelector("#matrix-container").innerHTML = `<table><caption>参考导师配置矩阵 · ${group}视角已高亮</caption><thead><tr><th>保险类型</th>${groups.map(name => `<th class="${name === group ? "selected-group" : ""}">${name}</th>`).join("")}</tr></thead><tbody>${rows[type].map(([name, values, notes]) => `<tr><th scope="row">${name}</th>${values.map((value, index) => `<td class="${groups[index] === group ? "selected-group" : ""}">${marks[value]}<small>${notes[index]}</small></td>`).join("")}</tr>`).join("")}</tbody></table>`;
    document.querySelectorAll("[data-matrix-type]").forEach(button => { button.onclick = () => renderMatrix(button.dataset.matrixType); });
  }

  function updateWizard() {
    if (wizardStep >= wizardSteps.length) {
      const savings = ["想给孩子存教育金", "想给自己存养老金", "怕存款贬值想保值增值"];
      const selectedSavings = answers.concerns.filter(item => savings.includes(item));
      const hasProtection = answers.concerns.some(item => !savings.includes(item));
      lastDirection = hasProtection && selectedSavings.length ? "先保障，再考虑储蓄" : hasProtection ? "优先了解保障类保险" : "先了解储蓄类保险";
      const concernText = answers.concerns.slice(0, 2).join("、") + (answers.concerns.length > 2 ? "等" : "");
      lastReason = `你选择为${answers.identity.replace(/^为/, "")}了解，并关注${concernText}。先看清保障责任与限制，再考虑长期储蓄安排。`;
      wizardContent.innerHTML = `<div class="wizard-result"><span>你的了解方向</span><h3>${lastDirection}</h3><p class="result-reason">${lastReason}</p><div class="result-layout"><div class="pyramid" role="img" aria-label="家庭风险管理金字塔：损失性风险、支出性风险和所有性风险"><div class="pyramid-layer top">所有性风险 · 婚姻 / 税务 / 债务</div><div class="pyramid-layer middle">支出性风险 · 养老 / 教育 / 工作责任</div><div class="pyramid-layer base">损失性风险 · 疾病 / 意外 / 身故</div></div><div class="result-checklist"><strong>投保前核对</strong><ul><li>先确认已有社保与保障基础</li><li>阅读免责、等待期和健康告知</li><li>储蓄部分分清保证与非保证利益</li></ul></div></div><details class="matrix-details"><summary>查看人群配置参考矩阵</summary><div class="matrix-tabs" role="tablist" aria-label="矩阵类型"><button class="active" type="button" data-matrix-type="protection">保障类</button><button type="button" data-matrix-type="savings">储蓄类</button></div><div class="matrix-scroll" id="matrix-container"></div></details><p class="result-disclaimer">只提供了解方向，不构成投保建议、核保结论或收益承诺。</p><div class="result-actions"><button class="primary-button" id="share-result" type="button">生成结论卡</button><button class="secondary-button" id="wizard-restart" type="button">重新查询</button></div></div>`;
      renderMatrix(selectedSavings.length && !hasProtection ? "savings" : "protection");
      document.querySelector("#wizard-restart").addEventListener("click", () => {
        Object.keys(answers).forEach(key => delete answers[key]);
        wizardStep = 0;
        renderWizard(-1);
      });
      document.querySelector("#share-result").addEventListener("click", showShareCard);
      return;
    }

    const step = wizardSteps[wizardStep];
    if (step.multi) {
      const selected = answers[step.key] || [];
      wizardContent.innerHTML = `<span class="wizard-step-label">第 ${wizardStep + 1} 步，共 5 步</span><p class="wizard-question">${step.question}</p><div class="wizard-options multi">${step.options.map(option => `<label class="wizard-choice"><input type="checkbox" value="${option}"${selected.includes(option) ? " checked" : ""}><span>${option}</span></label>`).join("")}</div><div class="wizard-navigation"><button class="secondary-button" type="button" data-back>上一步</button><button class="primary-button" id="wizard-next" type="button"${selected.length ? "" : " disabled"}>继续</button></div>`;
      const checkboxes = [...wizardContent.querySelectorAll("input[type=checkbox]")];
      const next = wizardContent.querySelector("#wizard-next");
      checkboxes.forEach(input => input.addEventListener("change", () => { next.disabled = !checkboxes.some(item => item.checked); }));
      next.addEventListener("click", () => {
        answers[step.key] = checkboxes.filter(item => item.checked).map(item => item.value);
        if (!answers[step.key].length) return;
        wizardStep += 1;
        renderWizard(1);
      });
    } else {
      wizardContent.innerHTML = `<span class="wizard-step-label">第 ${wizardStep + 1} 步，共 5 步</span><p class="wizard-question">${step.question}</p><div class="wizard-options">${step.options.map(option => `<button type="button" data-answer="${option}">${option}</button>`).join("")}</div>${wizardStep > 0 ? '<button class="secondary-button wizard-back" type="button" data-back>上一步</button>' : ""}`;
      wizardContent.querySelectorAll("[data-answer]").forEach(button => {
        button.addEventListener("click", () => {
          answers[step.key] = button.dataset.answer;
          wizardStep += 1;
          renderWizard(1);
        });
      });
    }
    wizardContent.querySelector("[data-back]")?.addEventListener("click", () => { wizardStep = Math.max(0, wizardStep - 1); renderWizard(-1); });
  }

  function renderWizard(direction = 1, immediate = false) {
    wizardProgressBar.style.transform = `scaleX(${(wizardStep + 1) / (wizardSteps.length + 1)})`;
    swapWizard(updateWizard, direction, immediate);
  }

  document.querySelectorAll("[data-direction-view]").forEach(button => {
    button.addEventListener("click", () => {
      const view = button.dataset.directionView;
      document.querySelectorAll("[data-direction-view]").forEach(item => {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-selected", String(selected));
      });
      document.querySelector("#direction-wizard-view").hidden = view !== "wizard";
      document.querySelector("#direction-tree-view").hidden = view !== "tree";
    });
  });

  const requestedView = new URLSearchParams(window.location.search).get("view");
  if (requestedView === "tree") document.querySelector('[data-direction-view="tree"]').click();

  function showShareCard() {
    document.querySelector("#share-card-body").innerHTML = `<span class="share-brand">明白保 · 公益保险科普</span><h3>${lastDirection}</h3><p>${lastReason}</p><ul><li>先确认已有社保与保障基础</li><li>看清免责、等待期和健康告知</li><li>分清保证与非保证利益</li></ul><small>无广告 · 无产品推荐<br>来源：产品方案示例 · 更新于 2026-11-13</small>`;
    shareDialog.showModal();
  }

  function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines = 5) {
    let line = "";
    let lines = 0;
    for (const character of text) {
      if (context.measureText(line + character).width > maxWidth && line) {
        context.fillText(line, x, y);
        y += lineHeight;
        lines += 1;
        line = character;
        if (lines >= maxLines - 1) break;
      } else line += character;
    }
    if (line && lines < maxLines) { context.fillText(line, x, y); y += lineHeight; }
    return y;
  }

  document.querySelector("#download-card").addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1200;
    const context = canvas.getContext("2d");
    context.fillStyle = "#f6f8f5";
    context.fillRect(0, 0, 900, 1200);
    context.fillStyle = "#173c35";
    context.fillRect(0, 0, 900, 170);
    context.fillStyle = "#ffffff";
    context.font = "bold 44px sans-serif";
    context.fillText("明白保 · 公益保险科普", 70, 105);
    context.fillStyle = "#176b57";
    context.font = "28px sans-serif";
    context.fillText("我的保险了解方向", 70, 245);
    context.fillStyle = "#0d2c27";
    context.font = "bold 56px sans-serif";
    let y = drawWrappedText(context, lastDirection, 70, 340, 760, 76, 2);
    context.fillStyle = "#52675f";
    context.font = "30px sans-serif";
    y = drawWrappedText(context, lastReason, 70, y + 50, 760, 48, 4);
    context.fillStyle = "#176b57";
    context.font = "bold 30px sans-serif";
    context.fillText("投保前核对", 70, y + 60);
    context.fillStyle = "#334b43";
    context.font = "28px sans-serif";
    ["先确认已有社保与保障基础", "看清免责、等待期和健康告知", "分清保证与非保证利益"].forEach((item, index) => context.fillText(`✓ ${item}`, 70, y + 125 + index * 54));
    context.fillStyle = "#60726d";
    context.font = "24px sans-serif";
    context.fillText("无广告 · 无产品推荐 · 不构成投保建议", 70, 1080);
    context.fillText("来源：产品方案示例 · 更新于 2026-11-13", 70, 1125);
    canvas.toBlob(blob => {
      if (!blob) { showToast("图片生成失败，请稍后再试。"); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "明白保-科普结论卡.png";
      link.click();
      URL.revokeObjectURL(url);
      showToast("结论卡图片已生成。");
    }, "image/png");
  });
  renderWizard(1, true);
}

if (pageType === "pitfalls") {
  const scenarios = {
    yield: { quote: "“终身保证收益6%。”", title: "演示收益不等于保证收益", text: "没有写入合同保证利益的演示数字，不能当成确定收益。", questions: ["哪部分利益写进合同并保证？", "保证利率和演示利率分别是多少？", "提前退出会有什么损失？"], answers: ["要求指出合同中的具体条款位置，不只看宣传页。", "把保证与非保证部分分开记录，再理解浮动风险。", "查看不同保单年度的现金价值与退保约定。"], correct: "拿到完整合同，区分保证利益与演示利益。", practice: ["看到“终身保证收益6%”，先核实什么？", "是否写入合同保证", "广告是否足够吸引人"] },
    coverage: { quote: "“这款产品什么都保，闭眼买就行。”", title: "保障清单不等于赔付承诺", text: "每份保险都有保障范围、免责和赔付条件，“都保”省略了限制。", questions: ["哪些情况明确不赔？", "等待期和免赔额分别是多少？", "达到什么条件才符合赔付？"], answers: ["请对方指出责任免除条款的位置。", "问清金额、时间和计算方式，再核对合同。", "查看疾病或事故的合同约定定义。"], correct: "重点阅读保障责任、责任免除、等待期和赔付条件。", practice: ["“什么都保”最先看哪部分？", "免责和赔付条件", "广告里的保额数字"] },
    health: { quote: "“健康告知不用细看，少写一点更省事。”", title: "口头承诺不能替代如实告知", text: "健康告知是书面问题，省略或误答可能影响后续承保与理赔。", questions: ["健康告知具体问哪些情况？", "已有检查异常需要怎样说明？", "能否保留告知内容和提交记录？"], answers: ["按书面问题如实回答，不凭口头建议省略。", "按已知情况提供资料，不自行判断“没住院就不算”。", "保存投保页面、问卷和提交凭证。"], correct: "逐项阅读书面问题，如实回答并保留记录。", practice: ["已有检查异常应该怎么处理？", "按书面问题如实告知", "没住院就不用说"] }
  };
  const riskDetails = {
    "免责条款": ["免责条款：先看不赔什么", "责任免除列明不承担责任的情形，与保障范围同样重要。", "哪些情况明确不赔？", "要求指出责任免除条款的位置，而不是只听口头概括。"],
    "等待期": ["等待期：生效不等于立即可赔", "等待期内发生约定事故，可能无法按约定赔付，不同责任可能不同。", "等待期有多长，哪些责任受影响？", "问清等待期的天数、适用责任和特殊例外。"],
    "健康告知": ["健康告知：决定未来理赔的重要依据", "书面问题需要如实回答，省略或误答可能影响承保与理赔。", "这项检查异常需要告知吗？", "按书面问题和已有情况如实回答，并保留提交记录。"],
    "免赔额": ["免赔额：先承担多少，再谈报销", "赔付前需要先扣除约定免赔额，金额和计算方式因合同而异。", "免赔额是每次还是每年计算？", "确认免赔额类型、金额以及哪些费用可以累计。"],
    "现金价值": ["现金价值：提前退保不等于退回保费", "长期保险退保时按现金价值计算，提前退出可能有损失。", "第几年退保能拿回多少？", "查看对应保单年度的现金价值表和退保约定。"],
    "保证续保": ["保证续保：保证的是期间，不是终身", "保证续保有明确期间和条件，不等于保费、条款永远不变。", "保证续保多久，什么条件下有效？", "核对保证期间、续保条件和费率调整约定。"]
  };
  const practiceBank = [
    { category: "收益承诺", question: "看到“终身保证收益6%”，先核实什么？", options: ["是否写入合同保证利益", "宣传页是否足够精美", "销售人员从业多少年"], answer: 0, explanation: "演示数字不等于保证收益，先查看合同中的保证利益。" },
    { category: "收益承诺", question: "宣传页同时列出高、中、低档收益，应该怎么看？", options: ["把最高档当成确定收益", "分开核对保证与非保证部分", "只看平均值即可"], answer: 1, explanation: "不同档位是演示情景，保证利益与非保证利益要分开理解。" },
    { category: "现金价值", question: "想知道提前退保能拿回多少，应优先查看什么？", options: ["已交保费总额", "对应保单年度的现金价值表", "宣传页上的预期收益"], answer: 1, explanation: "退保通常按对应年度的现金价值计算，不等于退回全部保费。" },
    { category: "保障范围", question: "听到“这款产品什么都保”，最先核对哪部分？", options: ["免责条款和赔付条件", "广告里的保额数字", "产品名称是否响亮"], answer: 0, explanation: "保障责任、责任免除和赔付条件共同决定实际保障范围。" },
    { category: "等待期", question: "合同已经生效，为什么还要问等待期？", options: ["等待期会影响部分责任能否赔付", "等待期只影响发票打印", "生效后所有责任都立即可赔"], answer: 0, explanation: "等待期内发生约定事故可能无法赔付，还要核对适用责任与例外。" },
    { category: "免赔额", question: "了解免赔额时，哪组信息最重要？", options: ["金额、计算周期和累计方式", "广告颜色和代理人评分", "产品销量和海报大小"], answer: 0, explanation: "免赔额可能按次或按年计算，金额和累计方式会影响实际报销。" },
    { category: "健康告知", question: "投保前发现曾有检查异常，应该怎么做？", options: ["没住院就一律不说", "按书面问题如实回答并保留记录", "让销售人员口头决定是否填写"], answer: 1, explanation: "按健康告知的具体问题作答，不凭口头建议省略，并保存提交记录。" },
    { category: "健康告知", question: "销售人员说“这项不用告知”，更稳妥的做法是？", options: ["直接省略所有异常", "重新核对书面问卷并保留沟通记录", "只听从口头承诺"], answer: 1, explanation: "口头承诺不能替代书面告知，必要时应向保险公司官方渠道确认。" },
    { category: "续保条件", question: "看到“保证续保”，还需要核对什么？", options: ["保证期间、续保条件和费率调整约定", "是否可以终身无条件续保", "宣传页有没有写“终身”"], answer: 0, explanation: "保证续保有明确期间和条件，不等于保费与条款永远不变。" }
  ];
  const swapPitfall = createContentSwapper(document.querySelector(".pitfall-detail"));
  const practiceCard = document.querySelector("#practice-card");
  const practiceOptions = document.querySelector("#practice-options");
  const practiceQuestion = document.querySelector("#practice-question");
  const practiceFeedback = document.querySelector("#practice-feedback");
  const practiceNext = document.querySelector("#practice-next");
  const practiceResult = document.querySelector("#practice-result");
  const practiceProgressTrack = document.querySelector("#practice-progress-track");
  const practiceRoundSize = 3;
  let practiceRound = [];
  let practiceIndex = 0;
  let practiceScore = 0;
  let practiceAnswered = false;

  function drawPracticeRound() {
    const questions = [...practiceBank];
    for (let index = questions.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [questions[index], questions[randomIndex]] = [questions[randomIndex], questions[index]];
    }
    return questions.slice(0, practiceRoundSize);
  }

  function renderPracticeQuestion() {
    const item = practiceRound[practiceIndex];
    practiceAnswered = false;
    document.querySelector("#practice-category").textContent = item.category;
    practiceQuestion.textContent = item.question;
    document.querySelector("#practice-progress").textContent = `第 ${practiceIndex + 1} / ${practiceRoundSize} 题`;
    practiceProgressTrack.setAttribute("aria-valuenow", String(practiceIndex + 1));
    document.querySelector("#practice-progress-fill").style.transform = `scaleX(${(practiceIndex + 1) / practiceRoundSize})`;
    practiceFeedback.hidden = true;
    practiceFeedback.className = "practice-feedback";
    practiceNext.hidden = true;
    practiceOptions.replaceChildren(...item.options.map((option, optionIndex) => {
      const button = document.createElement("button");
      const letter = document.createElement("span");
      const text = document.createElement("span");
      button.type = "button";
      button.dataset.optionIndex = String(optionIndex);
      letter.className = "option-letter";
      letter.textContent = String.fromCharCode(65 + optionIndex);
      text.textContent = option;
      button.append(letter, text);
      button.addEventListener("click", () => answerPractice(optionIndex));
      return button;
    }));
  }

  function answerPractice(selectedIndex) {
    if (practiceAnswered) return;
    practiceAnswered = true;
    const item = practiceRound[practiceIndex];
    const correct = selectedIndex === item.answer;
    if (correct) practiceScore += 1;
    [...practiceOptions.children].forEach((button, optionIndex) => {
      button.disabled = true;
      if (optionIndex === item.answer) button.classList.add("correct");
      if (optionIndex === selectedIndex && !correct) button.classList.add("incorrect");
    });
    document.querySelector("#practice-feedback-title").textContent = correct ? "回答正确" : `正确答案：${item.options[item.answer]}`;
    document.querySelector("#practice-explanation").textContent = item.explanation;
    practiceFeedback.classList.add(correct ? "correct" : "incorrect");
    practiceFeedback.hidden = false;
    practiceNext.textContent = practiceIndex === practiceRoundSize - 1 ? "查看结果" : "下一题";
    practiceNext.hidden = false;
  }

  function showPracticeResult() {
    practiceCard.hidden = true;
    practiceResult.hidden = false;
    document.querySelector("#practice-progress").textContent = "本轮完成";
    document.querySelector("#practice-score").textContent = `${practiceScore} / ${practiceRoundSize}`;
    document.querySelector("#practice-result-title").textContent = practiceScore === 3 ? "全部答对，判断很稳" : practiceScore === 2 ? "掌握得不错" : "再练一轮会更熟悉";
    document.querySelector("#practice-result-copy").textContent = practiceScore === 3 ? "已经掌握这组避坑要点。" : "题目会重新随机抽取，帮你巩固判断方法。";
    document.querySelector("#practice-restart").focus({ preventScroll: true });
  }

  function startPracticeRound() {
    practiceRound = drawPracticeRound();
    practiceIndex = 0;
    practiceScore = 0;
    practiceResult.hidden = true;
    practiceCard.hidden = false;
    renderPracticeQuestion();
  }

  practiceNext.addEventListener("click", () => {
    if (!practiceAnswered) return;
    if (practiceIndex === practiceRoundSize - 1) { showPracticeResult(); return; }
    practiceIndex += 1;
    renderPracticeQuestion();
    practiceQuestion.focus({ preventScroll: true });
  });
  document.querySelector("#practice-restart").addEventListener("click", () => {
    startPracticeRound();
    practiceQuestion.focus({ preventScroll: true });
  });

  const viewTabs = [...document.querySelectorAll("[data-pitfall-view]")];
  function switchPitfallView(view, updateHash = true) {
    viewTabs.forEach(tab => {
      const selected = tab.dataset.pitfallView === view;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    document.querySelector("#learning-panel").hidden = view !== "learn";
    document.querySelector("#practice-panel").hidden = view !== "practice";
    if (updateHash) history.replaceState(null, "", view === "practice" ? "#practice-panel" : "#learning-panel");
  }
  viewTabs.forEach((tab, tabIndex) => {
    tab.addEventListener("click", () => switchPitfallView(tab.dataset.pitfallView));
    tab.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? viewTabs.length - 1 : (tabIndex + (event.key === "ArrowRight" ? 1 : -1) + viewTabs.length) % viewTabs.length;
      viewTabs[nextIndex].focus();
      switchPitfallView(viewTabs[nextIndex].dataset.pitfallView);
    });
  });
  window.addEventListener("hashchange", () => {
    if (["#practice-panel", "#learning-panel"].includes(window.location.hash)) switchPitfallView(window.location.hash === "#practice-panel" ? "practice" : "learn", false);
  });

  document.querySelectorAll("[data-scenario]").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.scenario;
      const scenario = scenarios[key];
      document.querySelectorAll("[data-scenario]").forEach(item => {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-selected", String(selected));
      });
      document.querySelectorAll("[data-risk]").forEach(item => item.classList.remove("active"));
      swapPitfall(() => {
        document.querySelector("#pitfall-quote").textContent = scenario.quote;
        document.querySelector("#risk-title").textContent = scenario.title;
        document.querySelector("#risk-text").textContent = scenario.text;
        ["one", "two", "three"].forEach((name, index) => {
          document.querySelector(`#question-${name}`).firstChild.textContent = scenario.questions[index];
          document.querySelector(`#answer-${name}`).textContent = scenario.answers[index];
        });
        document.querySelector("#correct-action-text").textContent = scenario.correct;
        document.querySelectorAll(".questions-block details").forEach((detail, index) => { detail.open = index === 0; });
      });
    });
  });

  document.querySelectorAll("[data-risk]").forEach(button => {
    button.addEventListener("click", () => {
      const [title, text, question, answer] = riskDetails[button.dataset.risk];
      document.querySelectorAll("[data-risk]").forEach(item => item.classList.toggle("active", item === button));
      document.querySelector("#risk-title").textContent = title;
      document.querySelector("#risk-text").textContent = text;
      document.querySelector("#question-one").firstChild.textContent = question;
      document.querySelector("#answer-one").textContent = answer;
      document.querySelectorAll(".questions-block details").forEach((detail, index) => { detail.open = index === 0; });
    });
  });
  startPracticeRound();
  if (window.location.hash === "#practice-panel") switchPitfallView("practice", false);
  const requestedScenario = new URLSearchParams(window.location.search).get("scenario");
  if (requestedScenario && scenarios[requestedScenario]) document.querySelector(`[data-scenario="${requestedScenario}"]`).click();
}

if (pageType === "claims") {
  const materials = {
    "医疗险": ["理赔申请书", "身份与收款信息", "病历与诊断证明", "费用清单与票据"],
    "重疾险": ["理赔申请书", "身份与收款信息", "病理或诊断证明", "完整病历与检查报告"],
    "意外险": ["理赔申请书", "身份与收款信息", "意外事故证明", "就诊记录与费用票据"]
  };
  const materialList = document.querySelector("#material-list");
  const materialProgress = document.querySelector("#material-progress");

  function renderMaterials(type) {
    materialList.replaceChildren(...materials[type].map(name => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox"><span class="custom-check"><svg><use href="icons.svg#i-check"></use></svg></span><span><strong>${name}</strong><small>以保险公司官方要求为准</small></span>`;
      return label;
    }));
    document.querySelector("#material-type-label").textContent = `${type}材料示意`;
    materialProgress.textContent = `已准备 0 / ${materials[type].length} 项`;
    materialList.querySelectorAll("input").forEach(input => input.addEventListener("change", () => {
      const checked = [...materialList.querySelectorAll("input")].filter(item => item.checked).length;
      materialProgress.textContent = `已准备 ${checked} / ${materials[type].length} 项`;
    }));
  }

  document.querySelectorAll("[data-claim-type]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-claim-type]").forEach(item => {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-selected", String(selected));
      });
      renderMaterials(button.dataset.claimType);
    });
  });
  const requestedType = new URLSearchParams(window.location.search).get("type");
  if (requestedType && materials[requestedType]) document.querySelector(`[data-claim-type="${requestedType}"]`).click();
}
