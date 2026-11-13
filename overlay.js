const currentPage = document.body.dataset.page || "home";
const pageLabels = { home: "首页", direction: "险种查询", dictionary: "大白话词典", pitfalls: "避坑指南", claims: "理赔流程" };
const photoLinks = {
  direction: "https://www.pexels.com/photo/antique-compass-on-a-table-6593994/",
  dictionary: "https://www.pexels.com/photo/open-books-on-a-wooden-surface-11197155/",
  pitfalls: "https://www.pexels.com/photo/selective-focus-photo-of-terms-and-conditions-written-on-a-paper-7821937/",
  claims: "https://www.pexels.com/photo/person-working-on-documents-7821540/"
};
const links = [["home", "index.html"], ["direction", "direction.html"], ["dictionary", "dictionary.html"], ["pitfalls", "pitfalls.html"], ["claims", "claims.html"]];

const floatingButton = document.createElement("button");
floatingButton.type = "button";
floatingButton.className = "floating-menu-button";
floatingButton.setAttribute("aria-label", "打开功能菜单");
floatingButton.innerHTML = `<svg aria-hidden="true"><use href="icons.svg#i-menu"></use></svg><span>功能菜单</span>`;
document.body.append(floatingButton);

const menuDialog = document.createElement("dialog");
menuDialog.className = "overlay-menu";
menuDialog.setAttribute("aria-labelledby", "overlay-menu-title");
menuDialog.innerHTML = `
  <button class="dialog-close icon-button" type="button" data-overlay-close aria-label="关闭功能菜单"><svg><use href="icons.svg#i-close"></use></svg></button>
  <p class="overlay-kicker">当前页面：${pageLabels[currentPage]}</p>
  <h2 id="overlay-menu-title">选择功能</h2>
  <nav class="overlay-menu-list" aria-label="功能菜单">${links.map(([name, href]) => `<a class="menu-link${name === currentPage ? " active" : ""}" href="${href}"${name === currentPage ? ' aria-current="page"' : ""}><span>${pageLabels[name]}</span><svg aria-hidden="true"><use href="icons.svg#i-arrow"></use></svg></a>`).join("")}</nav>
  <button class="menu-info-button" id="menu-info-open" type="button"><svg><use href="icons.svg#i-info"></use></svg>平台与页面说明</button>`;
document.body.append(menuDialog);

const infoDialog = document.createElement("dialog");
infoDialog.className = "page-info-dialog";
infoDialog.setAttribute("aria-labelledby", "page-info-title");
infoDialog.innerHTML = `
  <button class="dialog-close icon-button" type="button" data-overlay-close aria-label="关闭页面说明"><svg><use href="icons.svg#i-close"></use></svg></button>
  <div class="dialog-badge"><svg><use href="icons.svg#i-shield"></use></svg>纯公益保险科普</div>
  <h2 id="page-info-title">平台与页面说明</h2>
  <dl class="page-info-list">
    <div><dt>服务边界</dt><dd>只做知识科普，不推荐具体产品，不提供投保代办，不承诺理赔结果。</dd></div>
    <div><dt>内容与隐私</dt><dd>当前为界面评审原型，示例内容仅供参考。无需登录，不收集敏感隐私。</dd></div>
    ${photoLinks[currentPage] ? `<div><dt>图片素材</dt><dd>本页照片来自 <a href="${photoLinks[currentPage]}" target="_blank" rel="noopener">Pexels 免费图库</a>。</dd></div>` : ""}
  </dl>
  <button class="secondary-button" id="info-correction-open" type="button">我要纠错</button>`;
document.body.append(infoDialog);

floatingButton.addEventListener("click", () => menuDialog.showModal());
document.querySelector("#menu-info-open").addEventListener("click", () => { menuDialog.close(); infoDialog.showModal(); });
infoDialog.addEventListener("close", () => floatingButton.focus());
document.querySelector("#info-correction-open").addEventListener("click", () => { infoDialog.close(); document.querySelector("#correction-dialog").showModal(); });
document.querySelectorAll("[data-overlay-close]").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
menuDialog.querySelectorAll("a").forEach(link => link.addEventListener("click", () => menuDialog.close()));
[menuDialog, infoDialog].forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });
});
