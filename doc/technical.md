# Technical

## 1. 技术栈

评审页与完整游戏使用 Vite、HTML、CSS 和原生 JavaScript。响应式 DOM 展示品牌依据，9:16 游戏区域运行三轮状态机、随机藏花、相邻洗杯、限时选择、胜负结算和购买转化；Web Audio API 合成事件音效。构建 `base` 为 `./`，所有运行资源使用相对路径，可部署到任意子路径。

## 2. 目录结构

- `index.html`：平台与 GitHub Pages 根目录使用的正式游戏入口；`body.standalone-game` 会移除评审专用的手机外框、圆角和投影。
- `review.html`：评审页结构、Little 6 角色依据、游戏切片与商品购买链接。
- `play.html`：旧测试链接的兼容跳转页，立即转到正式根入口 `./`。
- `src/style.css`：暖白静物视觉系统、猫版画整合、钛杯与冰花资产、移动端布局。
- `src/assets/little6-papercut.svg`：游戏内黑白开脸剪纸猫头，眼睛与脸部为同一矢量坐标系。
- `src/assets/titanium-cup-inverted.svg`：静置倒扣视角，只绘制封闭杯底、金属杯身和贴桌杯口的前侧薄边，不绘制杯口内腔。
- `src/assets/titanium-cup-reveal.svg`：揭晓倾斜视角，只绘制朝向玩家的杯口与双层内壁；远端杯底仅保留背向轮廓，不绘制端面。
- `src/assets/ice-flower.svg`：带正面、侧切面、厚度、材质投影和 `LITTLE 6` 珐琅标识的六瓣实体冰花徽章。
- `src/main.js`：页内导航、zh/en 游戏文案、三轮状态机、随机相邻换位、计时、键盘/触控输入、Web Audio 音效与结算。
- `public/images/little6-avatar.png`：官网 Little 6 版画头像。
- `public/images/little6-photo.jpg`：官网 Little 6 真实照片。
- `public/images/espresso-hero.jpg`、`espresso-detail.jpg`：官网 4oz 钛杯产品摄影。
- `public/poster.png`：由 Aigram transit 生图并经过 160px 缩略图验收的正式海报。
- `doc/requirements.md`：三轮 shell game 的完整玩法规则。
- `doc/visual.md`：Little 6 角色、产品和界面视觉圣经。
- `_qa/capture.mjs`：旧评审切片的多尺寸截图脚本。
- `_qa/capture-game.mjs`：使用正常动态模式采集桌面开始/选择/揭晓、390px 三轮胜利、320px 错误/重试/超时及单轮结果牌的完整路径。

## 3. 核心模块

- 角色身份：官网照片锁定黑白开脸特征；游戏主持人使用独立剪纸 SVG，官网版画头像只用于品牌依据和结算签章。
- 状态管理：`phase` 明确维护 `idle → place → cover → shuffle → choose → reveal → complete/failed`；`runToken` 使重启后的旧异步序列自动失效，避免跨局动画继续执行。
- 藏花与洗杯：`flowerCupId` 绑定实体杯，`slotsByCup` 记录三只实体杯所在槽位；每次只交换相邻槽位，答案不会在洗杯结束后重抽。
- 核心输入：三只 `.shell-cup` 使用 `pointerdown` 触发“第一次试探、第二次确认”；第一次完成 420ms 阻尼回正后显示候选签，第二次点击同一实体杯直接进入揭晓，切换杯子会复位前一目标。键盘 1/2/3 复用同一逻辑，R 重开；首次开始同时创建或恢复 AudioContext。
- 轮次与计时：三轮分别执行 3/5/7 次换位和 520/420/340ms 过渡；选择阶段由 9 秒逻辑计时器与同步 CSS 计时线共同反馈。
- 猫表情与姿态：原 SVG 只保留眼白与虹膜；DOM 叠加的双瞳孔和双眉根据槽位、轻拨次数与揭晓阶段移动、收窄和下压。`data-phase` 控制猫头在洗杯阶段下沉 32px，`is-cat-emerging` 在选择开始时触发 520ms 探头，`is-probing` 在每次轻拨时触发 9px 上探；揭晓继续复用蓄势、侧倾与碰撞姿态。
- 猫爪：同一 DOM 长前腿根据目标槽位切换左右侧，宽 400px、锚点距边缘 345px，常态约 55px 留在画内；主体使用深棕色，42px 宽的 `:before` 伪元素形成白手套爪。轻拨目标点深入杯身约 72%，杯子层级遮住接触端，形成从画外连续伸入而非断肢的关系。
- 杯子物理：第一次以爪尖接触帧为冲量起点，执行 7px/3° 正向偏移、反向回摆、小幅余振，并在 420ms 内回到零位；第二次点击依序执行蓄势、爪垫接触、离桌翻滚、邻杯碰撞、第一次落桌和回弹。静止与揭晓 SVG 均移除内置椭圆投影，避免旋转时暴露假阴影。
- 反馈系统：Web Audio 为金属事件叠加 3–4 个非整数倍正弦模态和短带通噪声瞬态，并通过共享 `DynamicsCompressorNode` 控制移动扬声器峰值；轻拨音与触觉延迟 210ms，精确对齐爪尖接触与杯子起转。正确杯第一次碰桌时同步显示高对比单轮结果牌、更新分数并播放胜负音；猜中在支持设备上触发 18ms 轻触觉。
- 多语言：`detectLocale()` 优先读取 `localStorage.game_locale`，否则根据浏览器语言选择 zh/en；游戏动态文案、杯子无障碍标签与结算文案都由同一字典生成。
- 响应式：评审页在 780px 以下改为单栏；固定比例游戏区域在 390×844 与 320×568 保持三杯、HUD、计时线和结算操作可见。320px 下猫头仅做等比缩小和上移，状态纸片同步缩小并避开眼睛，不使用纵向压缩。
- 转化：游戏内胜负结算和外层结果区都指向 4oz Titanium Espresso Cup Petite Edition，并带 `utm_campaign=six_hid_it`。

## 4. 扩展点

- 调整轮数、换位次数、速度、超时或揭晓停留时长时，修改 `src/main.js` 顶部的 `ROUND_CONFIG`、`CHOICE_TIME` 和对应等待参数，并同步 `doc/requirements.md`。
- 修改游戏状态文案或增加语言时，扩展 `src/main.js` 的 `copy` 字典，不在状态逻辑内硬编码新文案。
- 调整开始、失败或完成结算层时，同步修改 `index.html`、`play.html` 的 `.game-overlay` 结构与 `src/style.css` 的同名组件规则。
- 新增猫姿态时沿用 `doc/visual.md` 的固定脸部花纹和白爪规则，不直接引入外部参考照片。
- 更换商品或产品摄影时修改 `index.html` 的链接与 `public/images/` 资源。
- 更换合成音色时调整 `src/main.js` 的 `sound` 映射；AudioContext 必须继续只在首次用户输入后创建或恢复。
