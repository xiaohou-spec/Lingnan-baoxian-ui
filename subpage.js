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

  function updateWizard() {
    if (wizardStep >= wizardSteps.length) {
      const savings = ["想给孩子存教育金", "想给自己存养老金", "怕存款贬值想保值增值"];
      const selectedSavings = answers.concerns.filter(item => savings.includes(item));
      const hasProtection = answers.concerns.some(item => !savings.includes(item));
      lastDirection = hasProtection && selectedSavings.length ? "先保障，再考虑储蓄" : hasProtection ? "优先了解保障类保险" : "先了解储蓄类保险";
      const concernText = answers.concerns.slice(0, 2).join("、") + (answers.concerns.length > 2 ? "等" : "");
      lastReason = `你选择为${answers.identity.replace(/^为/, "")}了解，并关注${concernText}。先看清保障责任与限制，再考虑长期储蓄安排。`;
      wizardContent.innerHTML = `<div class="wizard-result"><span>你的了解方向</span><h3>${lastDirection}</h3><p class="result-reason">${lastReason}</p><div class="result-layout"><div class="pyramid" role="img" aria-label="保险配置金字塔：先基础保障，再重疾和寿险，最后考虑年金与进阶储蓄"><div class="pyramid-layer top">年金与进阶储蓄</div><div class="pyramid-layer middle">重疾 / 定期寿险</div><div class="pyramid-layer base">医保 / 医疗 / 意外</div></div><div class="result-checklist"><strong>投保前核对</strong><ul><li>先确认已有社保与保障基础</li><li>阅读免责、等待期和健康告知</li><li>储蓄部分分清保证与非保证利益</li></ul></div></div><details class="matrix-details"><summary>查看人群配置参考矩阵</summary><div class="matrix-scroll"><table><caption>仅作学习顺序示意，不是产品推荐</caption><thead><tr><th>人群</th><th>医疗</th><th>意外</th><th>重疾</th><th>定寿</th><th>年金</th></tr></thead><tbody><tr><th>孩子</th><td>优先</td><td>优先</td><td>按需</td><td>通常不急</td><td>按需</td></tr><tr><th>成年人</th><td>优先</td><td>优先</td><td>优先</td><td>有责任时</td><td>有余力时</td></tr><tr><th>老人</th><td>先核条件</td><td>优先</td><td>先核条件</td><td>通常不急</td><td>谨慎了解</td></tr></tbody></table></div></details><p class="result-disclaimer">只提供了解方向，不构成投保建议、核保结论或收益承诺。</p><div class="result-actions"><button class="primary-button" id="share-result" type="button">生成结论卡</button><button class="secondary-button" id="wizard-restart" type="button">重新查询</button></div></div>`;
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
    yield: { quote: "“终身保证收益6%。”", title: "演示收益不等于保证收益", text: "没有写入合同保证利益的演示数字，不能当成确定收益。", questions: ["哪部分利益写进合同并保证？", "保证利率和演示利率分别是多少？", "提前退出会有什么损失？"], answers: ["要求指出合同中的具体条款位置，不只看宣传页。", "把保证与非保证部分分开记录，再理解浮动风险。", "查看不同保单年度的现金价值与退保约定。"], correct: "拿到完整合同，区分保证利益与演示利益。" },
    coverage: { quote: "“这款产品什么都保，闭眼买就行。”", title: "保障清单不等于赔付承诺", text: "每份保险都有保障范围、免责和赔付条件，“都保”省略了限制。", questions: ["哪些情况明确不赔？", "等待期和免赔额分别是多少？", "达到什么条件才符合赔付？"], answers: ["请对方指出责任免除条款的位置。", "问清金额、时间和计算方式，再核对合同。", "查看疾病或事故的合同约定定义。"], correct: "重点阅读保障责任、责任免除、等待期和赔付条件。" },
    health: { quote: "“健康告知不用细看，少写一点更省事。”", title: "口头承诺不能替代如实告知", text: "健康告知是书面问题，省略或误答可能影响后续承保与理赔。", questions: ["健康告知具体问哪些情况？", "已有检查异常需要怎样说明？", "能否保留告知内容和提交记录？"], answers: ["按书面问题如实回答，不凭口头建议省略。", "按已知情况提供资料，不自行判断“没住院就不算”。", "保存投保页面、问卷和提交凭证。"], correct: "逐项阅读书面问题，如实回答并保留记录。" }
  };
  const swapPitfall = createContentSwapper(document.querySelector(".pitfall-detail"));
  document.querySelectorAll("[data-scenario]").forEach(button => {
    button.addEventListener("click", () => {
      const scenario = scenarios[button.dataset.scenario];
      document.querySelectorAll("[data-scenario]").forEach(item => {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-selected", String(selected));
      });
      swapPitfall(() => {
        document.querySelector("#pitfall-quote").textContent = scenario.quote;
        document.querySelector("#risk-title").textContent = scenario.title;
        document.querySelector("#risk-text").textContent = scenario.text;
        ["one", "two", "three"].forEach((key, index) => {
          document.querySelector(`#question-${key}`).firstChild.textContent = scenario.questions[index];
          document.querySelector(`#answer-${key}`).textContent = scenario.answers[index];
        });
        document.querySelector("#correct-action-text").textContent = scenario.correct;
        document.querySelectorAll(".questions-block details").forEach((detail, index) => { detail.open = index === 0; });
      });
    });
  });
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
  renderMaterials("医疗险");
}
