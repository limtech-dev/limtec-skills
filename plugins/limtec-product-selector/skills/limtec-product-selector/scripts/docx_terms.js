'use strict';
/*












*/
const { T, HAS_CJK } = require('./en_terms');

/* ---------------- 1. whole sentences ---------------- */
const EXACT = {
  /* ---- header / footer furniture ---- */
  '力姆泰克（廊坊）传动设备有限公司': 'Lim-Tec (Langfang) Transmission Equipment Co., Ltd.',
  '力姆泰克销售部': 'Lim-Tec Sales Department',
  '销售部': 'Sales Department',
  '暂无价格': 'Price on request',
  'CONFIDENTIAL 保密文件': 'CONFIDENTIAL',
  '上市代码: 836388': 'Stock code: 836388',
  '上市代码：836388': 'Stock code: 836388',
  '第': 'Page ',
  '页, 共': ' of ',
  '页': '',
  '页，共': ' of ',

  /* ---- document titles ---- */
  '螺旋升降机选型方案书': 'Screw Jack Selection Proposal',
  '伺服电动缸选型方案书': 'Servo Electric Cylinder Selection Proposal',
  '电动推杆选型方案书': 'Linear Actuator Selection Proposal',

  /* ---- commercial terms ---- */
  '本方案书不列价格明细，正式价格以商务报价单为准；报价有效期 30 天。':
    'This proposal does not itemise prices; the formal quotation prevails. The quotation is valid for 30 days.',
  '本方案书单价仅供选型参考；正式价格与折扣以商务报价单为准，报价有效期 30 天。':
    'Prices in this proposal are for selection reference only; the formal quotation prevails and is valid for 30 days.',
  '标准机型合同生效后 6–8 周交货；带特殊工况配置（低温/高温/真空脂）或非标接口时，交期在合同确认时书面明确。':
    'Standard units are delivered 6-8 weeks after the contract takes effect. For special duty configurations '
    + '(low / high temperature, vacuum grease) or non-standard interfaces the delivery date is confirmed in writing with the contract.',
  '标准机型合同生效后 6–8 周交货；带特殊工况配置（低温/真空/防腐/防爆）或非标接口时，交期在合同确认时书面明确。':
    'Standard units are delivered 6-8 weeks after the contract takes effect. For special duty configurations '
    + '(low temperature, vacuum, corrosion protection, explosion proof) or non-standard interfaces the delivery date is confirmed in writing with the contract.',
  '标准机型合同生效后 6–8 周交货；带特殊工况配置（低温/防腐/防爆）或非标接口时，交期在合同确认时书面明确。':
    'Standard units are delivered 6-8 weeks after the contract takes effect. For special duty configurations '
    + '(low temperature, corrosion protection, explosion proof) or non-standard interfaces the delivery date is confirmed in writing with the contract.',
  '预付 30% 合同生效，发货前付清余款；长期合作客户可按年度框架协议执行。':
    '30% down payment to start the contract, balance paid before shipment. Long-term customers may work under an annual framework agreement.',
  '自发货之日起 12 个月质保，非人为损坏免费维修或更换；非正常操作损坏除外。':
    '12 months warranty from the date of shipment; repair or replacement free of charge for damage not caused by the user. '
    + 'Damage from improper operation is excluded.',

  /* ---- company profile: screw jack ---- */
  '力姆泰克（Lim-Tec）——国内最专业、最具规模、最权威的电动推杆 / 螺旋升降机 / 伺服电动缸专业制造厂家。2005 年合资引进欧洲直线传动技术与模块化组合设计理念；2015 年完成股改（注册资本三千万元），2016 年登陆新三板（股票代码 836388），成为国内螺旋升降机、电动缸第一股。':
    'Lim-Tec is a dedicated manufacturer of linear actuators, screw jacks and servo electric cylinders. '
    + 'A 2005 joint venture brought European linear-motion technology and modular design into the company; '
    + 'the shareholding reform was completed in 2015 (registered capital CNY 30 million) and the company was listed '
    + 'on the NEEQ market in 2016 (stock code 836388).',
  '廊坊大厂一期 8,000 m²（投资 5,000 万元、30 亩工业产权）、二期 28,000 m²（累计投资两亿元）生产基地，年产 5 万台；配备上百台数控加工设备，蜗杆、箱体、丝杠等关键零件全部自加工，不外协。':
    'Two production phases in Dachang, Langfang: 8,000 m2 (CNY 50 million invested, 30 mu of industrial land) and '
    + '28,000 m2 (CNY 200 million cumulative), with an annual capacity of 50,000 units. More than a hundred CNC machines '
    + 'machine the worm, housing and screw in house - no subcontracting of critical parts.',
  '质量与检测：100 吨加载测试中心可对大吨位产品满载荷跑合试验；进口三坐标测量仪、蜗杆磨精度检测等手段覆盖来料、加工与出厂全流程；产品逐台空载 / 负载跑合检验合格后出厂，随箱提供合格证与检验报告。':
    'Quality and testing: a 100 t load test centre runs full-load running-in tests on large units; imported CMM '
    + 'and worm-grinding accuracy checks cover incoming material, machining and final inspection. Every unit is '
    + 'run in unloaded and loaded before shipment, and ships with its certificate and inspection report.',
  '质量与检测：100 吨加载测试中心可对大吨位产品满载荷跑合试验；进口三坐标测量仪、丝杠精度检测等手段覆盖来料、加工与出厂全流程；电缸逐台空载 / 负载跑合检验合格后出厂，随箱提供合格证与检验报告。':
    'Quality and testing: a 100 t load test centre runs full-load running-in tests on large units; imported CMM and '
    + 'screw-accuracy checks cover incoming material, machining and final inspection. Every cylinder is run in unloaded '
    + 'and loaded before shipment, and ships with its certificate and inspection report.',
  '质量与检测：100 吨加载测试中心可对大吨位产品满载荷跑合试验；进口三坐标测量仪、丝杠精度检测等手段覆盖来料、加工与出厂全流程；产品逐台空载 / 负载跑合检验合格后出厂，随箱提供合格证与检验报告。':
    'Quality and testing: a 100 t load test centre runs full-load running-in tests on large units; imported CMM and '
    + 'screw-accuracy checks cover incoming material, machining and final inspection. Every unit is run in unloaded and '
    + 'loaded before shipment, and ships with its certificate and inspection report.',
  '产品线覆盖机械螺旋升降机（SJA/SJB/KV）、伞齿轮螺旋升降机（EHB）、电动推杆（SCA/SCB）、伺服电动缸及换向器、传动轴、联轴器、减速电机等成套传动附件，可为客户提供完整平台方案而非单件产品。':
    'The range covers machine screw jacks (SJA/SJB/KV), bevel gear screw jacks (EHB), linear actuators (SCA/SCB), '
    + 'servo electric cylinders, plus gearboxes, drive shafts, couplings and geared motors - a complete platform '
    + 'solution rather than single components.',
  '全国 10 个办事处构成销售与服务网络，就近提供选型支持、安装指导与售后响应；截至 2020 年底近 16 万台产品成功应用于汽车装备、自动化装备、冶金、航天航空军工、港口机械等行业。':
    'Ten regional offices form the sales and service network, providing selection support, installation guidance and '
    + 'after-sales response. By the end of 2020 close to 160,000 units were in service in automotive equipment, '
    + 'automation, metallurgy, aerospace and defence, and port machinery.',

  /* ---- company profile: cylinder ---- */
  '伺服电动缸产品线覆盖 DMB（滚珠丝杠重载）、EMB（经济型）、FMR（行星滚柱重型）、GTR（一体化行星滚柱）四大系列，配套 SC 直连 / P10·P20 同步带平行 / 行星减速机等输入形式与全套安装、接头、附件，可为客户提供完整直线传动方案。':
    'The electric cylinder range covers four series - DMB (heavy-duty ball screw), EMB (economy), FMR (planetary roller, heavy duty) '
    + 'and GTR (integrated planetary roller) - with SC direct, P10/P20 parallel timing belt or planetary gearbox input, plus the '
    + 'full set of mounts, joints and accessories, so a complete linear-motion package can be quoted rather than a single part.',
  '全国 10 个办事处构成销售与服务网络，就近提供选型支持、安装指导与售后响应；产品广泛应用于汽车装备、自动化装备、冶金、航天航空军工、港口机械等行业。':
    'Ten regional offices form the sales and service network, providing selection support, installation guidance and after-sales '
    + 'response. The products are widely used in automotive equipment, automation, metallurgy, aerospace and defence, and port machinery.',
  '对特殊工况（高低温、真空、防腐、防爆等）具备成熟的定制经验：低温润滑脂与低温型电机、真空润滑脂、不锈钢丝杠 / 外壳、达克罗喷塑防腐、防爆电机等配置均可按需提供，并有同类项目业绩支撑。':
    'Special duty conditions (high / low temperature, vacuum, corrosion, explosion proof) are covered by proven custom builds: '
    + 'low-temperature grease and motors, vacuum grease, stainless screw / housing, zinc-flake coating, explosion-proof motors - '
    + 'all available on request, backed by comparable project references.',

  /* ---- company profile: linear actuator ---- */
  '电动推杆产品线覆盖 LAM 小型（LAM1/3/8、LAM32/33、LAM5 家族、LBM9）、LAP 梯形丝杠（LAP22~300）、LBP 滚珠丝杠（LBP25~300）三大系列，推力 0.01~30 吨，配套 P1~P4 输入形式、FL/TS/ROE/FO/NF/BA 六种接头与全套附件，可为客户提供完整直线推拉方案。':
    'The actuator range covers LAM compact (LAM1/3/8, LAM32/33, LAM5 family, LBM9), LAP trapezoidal screw (LAP22-300) and '
    + 'LBP ball screw (LBP25-300) - thrust from 0.01 to 30 t - with P1-P4 input forms, six joint styles (FL/TS/ROE/FO/NF/BA) '
    + 'and the full accessory set.',
  '全国 10 个办事处构成销售与服务网络，就近提供选型支持、安装指导与售后响应；产品广泛应用于工程机械、医疗、能源、物流、开窗通风、舞台机械、光伏等行业。':
    'Ten regional offices form the sales and service network, providing selection support, installation guidance and after-sales '
    + 'response. The products are widely used in construction machinery, medical equipment, energy, logistics, window automation, '
    + 'stage machinery and photovoltaics.',
  '对特殊工况（高低温、防腐、防爆等）具备成熟的定制经验：低温润滑脂与低温型电机、不锈钢外壳 / 丝杠、达克罗喷塑防腐、防爆电机等配置均可按需提供，并有同类项目业绩支撑。':
    'Special duty conditions (high / low temperature, corrosion, explosion proof) are covered by proven custom builds: '
    + 'low-temperature grease and motors, stainless housing / screw, zinc-flake coating, explosion-proof motors - all available '
    + 'on request, backed by comparable project references.',

  /* ---- accessories / BOM bodies ---- */
  '轴长按客户平台实际尺寸确定': 'Shaft length to be confirmed against the customer platform dimensions',
  '每根传动轴配 2 个（12 个），与升降机蜗杆输入轴及传动轴配套':
    '2 per drive shaft (12 in total), matched to the jack worm input shaft and drive shaft',
  '按电机额定扭矩 2.4Nm×减速比 2=5Nm（输入转速 3000rpm），不超过样本 p141 许用输出扭矩选机座号；已按一体化匹配升档：电机 0.75kW／法兰 80／轴径 19mm 超出 RSD065 的允许法兰/轴径/功率，升为 RSD090':
    'Frame size selected from motor rated torque 2.4 Nm x ratio 2 = 5 Nm (input speed 3000 rpm) within the permissible '
    + 'output torque of catalogue p141. Upsized for integrated mounting: a 0.75 kW motor with 80 mm flange and 19 mm shaft '
    + 'exceeds the allowable flange / shaft / power of RSD065, so RSD090 is used.',
  '按电机端换向器扭矩的一半约 2Nm 选机座号（不超过样本 p141 许用输出扭矩；输入转速 1500rpm）':
    'Frame size selected from half the motor-side gearbox torque, approx. 2 Nm (within the permissible output torque of '
    + 'catalogue p141; input speed 1500 rpm).',
  '标准工况，无特殊系数修正': 'Standard duty, no special factor applied',
  '无（按常规工况）': 'None (standard duty)',

  /* ---- screw jack product features ---- */
  '01　传动效率 25%–33%，显著高于国产同类（14%–19%）':
    '01  Efficiency 25-33%, clearly above comparable domestic units (14-19%)',
  '02　规格实标：20 吨级箱体 75kg、丝杠 Ø80mm，型号比国产大一号':
    '02  Honest ratings: a 20 t housing weighs 75 kg and uses an 80 mm screw - one frame size above domestic equivalents',
  '03　球墨铸铁箱体（国产为灰铸铁），卧式加工中心 + 进口三坐标检测':
    '03  Ductile iron housing (domestic units use grey iron), machined on horizontal centres and checked on an imported CMM',
  '04　优质蜗轮材料，耐磨性能与使用寿命更优':
    '04  High-grade worm wheel material for better wear resistance and service life',
  '05　数控蜗杆磨精加工，啮合精度高、传动平稳':
    '05  CNC worm grinding gives accurate meshing and smooth transmission',
  '06　零部件加工精度高于国内 2 级':
    '06  Component machining accuracy two grades tighter than domestic practice',
  '07　尾罩防转专利设计，保证丝杠不自转':
    '07  Patented anti-rotation end cover keeps the screw from turning',
  '08　箱体凹槽散热设计，提升产品工作制':
    '08  Recessed housing ribs improve heat dissipation and duty cycle',
  '09　欧洲标准模块化设计，附件齐全（限位开关、安全螺母、编码器等）':
    '09  European modular design with a full accessory range (limit switches, safety nuts, encoders)',
  '10　提供成套平台方案与附件（传动轴、联轴器、换向器、减速电机），含现场调试支持':
    '10  Complete platform packages and accessories (drive shafts, couplings, gearboxes, geared motors) with on-site commissioning support',

  /* ---- electric cylinder product features ---- */
  '01　四大系列齐全：DMB 重载滚珠丝杠 / EMB 经济型 / FMR 行星滚柱重型 / GTR 一体化行星滚柱':
    '01  Four complete series: DMB heavy-duty ball screw, EMB economy, FMR planetary roller, GTR integrated planetary roller',
  '02　推力覆盖 0.5~1000 kN，同规格缸体比通用型紧凑，推力密度高':
    '02  Thrust from 0.5 to 1000 kN, more compact than general-purpose cylinders at the same rating',
  '03　重复精度可选 0.05 mm（轧制滚珠丝杠）/ 0.02 mm（磨制 GB）/ 0.01 mm（闭环光栅尺）':
    '03  Repeatability options: 0.05 mm (rolled ball screw), 0.02 mm (ground, GB) or 0.01 mm (closed-loop linear scale)',
  '04　FMR / GTR 行星滚柱丝杠：同体积下推力与寿命显著优于滚珠丝杠，适合重载高频工况':
    '04  FMR / GTR planetary roller screws deliver far more thrust and life than ball screws at the same size - made for heavy, high-frequency duty',
  '05　输入形式模块化：SC 直连 / P10·P20 同步带平行 / 行星减速机（G05、GX），按工况自动配比':
    '05  Modular input: SC direct, P10/P20 parallel timing belt, planetary gearbox (G05, GX) - matched to the duty point',
  '06　可与任意品牌伺服驱动器匹配，反馈方式（旋变 / 增量 / 多圈绝对）按驱动器选配':
    '06  Matches any servo drive brand; feedback (resolver, incremental, multi-turn absolute) selected to suit the drive',
  '07　安装方式 7 种、前端接头 7 种，备件通用，现场改造与增补方便':
    '07  Seven mounting styles and seven front joints, common spares - easy to retrofit or extend on site',
  '08　限位开关按型号标配（DMB / EMB / FMR：FCM 磁感应、FCP 接近开关；GTR：外置 L1/L2/L3，须同时选配 AR），防转 AR 按系列选配（GTR 为选配）':
    '08  Limit switches are standard by model (DMB/EMB/FMR: FCM magnetic or FCP proximity; GTR: external L1/L2/L3, AR mandatory); '
    + 'anti-rotation AR is optional except on GTR',
  '09　采用进口散件组装：台湾滚珠丝杠、日本 NSK 轴承、德国欧比特同步带、德国 SICK 限位开关、德式密封圈、美孚润滑脂等':
    '09  Assembled from imported components: Taiwanese ball screws, NSK bearings, Optibelt timing belts, SICK limit switches, German seals, Mobil grease',
  '10　低温 / 真空 / 防腐 / 防爆等特殊工况可定制，丝杠、缸筒、密封件按工况选材':
    '10  Low temperature, vacuum, corrosion and explosion-proof executions available with screw, barrel and seal material chosen for the duty',

  /* ---- linear actuator product features ---- */
  '01　LAP 梯形丝杠系列传动效率 25~33%（国产同类 14~19%，选国产需更高输入功率）；LBP 滚珠丝杠系列 50~70%':
    '01  LAP trapezoidal screw series: 25-33% efficiency (domestic equivalents 14-19%, needing more input power); LBP ball screw series: 50-70%',
  '02　交流电机配置 ABB / SEW / NORD / Siemens 制造，或力姆泰克国产 OEM 产品':
    '02  AC motors from ABB / SEW / NORD / Siemens, or Lim-Tec domestic OEM motors',
  '03　力姆泰克箱体使用卧式加工中心加工，保证垂直度、同轴度、中心距，并用进口三坐标检测，保证产品质量完全合格':
    '03  Housings are machined on horizontal centres so squareness, concentricity and centre distance hold, then verified on an imported CMM',
  '04　蜗轮材料（锡青铜 10-1）对产品耐磨性能非常重要，是电动推杆寿命的主要决定因素':
    '04  Worm wheel material (tin bronze 10-1) drives wear resistance and is the main factor in actuator life',
  '05　蜗杆精加工使用数控蜗杆磨，保证蜗杆齿型与蜗轮吻合，保证啮合精度与传动平稳':
    '05  CNC worm grinding keeps the worm profile matched to the wheel for accurate meshing and smooth running',
  '06　产品零部件加工精度高于国内 2 级，保证高质量产品':
    '06  Component machining accuracy two grades tighter than domestic practice',
  '07　运行平稳、噪音低，达到进口产品标准':
    '07  Smooth and quiet in operation, to imported-product standards',
  '08　电动推杆产品表面氧化处理，无须喷漆；其他产品为烤漆处理':
    '08  Actuator surfaces are anodised (no paint needed); other products are stoved enamel',
  '09　进口特制磁感应限位开关，保证灵敏度，可任意位置调节':
    '09  Imported magnetic limit switches - reliable sensitivity, adjustable at any position',
  '10　电动推杆内部设防撞装置，保证推杆在超过极限推力时不损坏':
    '10  Internal end-stop protection keeps the actuator undamaged beyond the rated thrust',
};

/* ---------------- 3. clauses ---------------- */
const CLAUSE = {
  /* duty-point clauses (screw jack) */
  '导向杆安装': 'guide-rod mounting',
  '客户自备导向，侧向力不作用于升降机': 'customer-supplied guiding, lateral load does not act on the jack',
  '不要求自锁，电机可不配制动器': 'self-locking not required, so no motor brake is needed',
  '机构自锁满足要求，电机可不配制动器': 'the mechanism is self-locking as required, so no motor brake is needed',
  '机构自锁满足要求': 'the mechanism is self-locking as required',
  '室内，20 ℃': 'Indoor, 20 degC',
  '无特殊工况配置': 'no special requirements',
  '无特殊工况': 'no special requirements',
  '标准工况': 'standard duty',
  '丝杠运动（螺母固定）': 'rotating screw (fixed nut)',
  '机械同步': 'mechanically synchronised',
  '机械同步，H型布置布置': 'mechanically synchronised, H-layout',
  '选型通过': 'passed',
  '按实际载荷计算': 'calculated from the actual load',
  '校核通过': 'passed',
  '符合选择原则': 'meets the selection rule',
  '符合选型原则': 'meets the selection rule',

  /* electrically driven clauses (cylinder) */
  '伺服电机驱动（V90）': 'servo motor drive (V90)',
  '伺服电机 220VAC（整线共用 1 台）': 'servo motor 220VAC (one unit shared by the whole line)',
  '驱动方式 三相交流电机 380V（默认）': 'drive type: three-phase AC motor 380V (default)',
  '驱动电机 AC3 1.5kW 1400rpm 380V 50Hz': 'drive motor AC3 1.5 kW, 1400 rpm, 380V 50 Hz',
  '不自锁，配制动器 BRE': 'not self-locking, brake BRE fitted',
  'AC3 1.5kW 1400rpm 380V 50Hz': 'AC3 1.5 kW, 1400 rpm, 380V 50 Hz',
  'P = 1.5 kW（样本配机档位）': 'P = 1.5 kW (catalogue motor step)',
  '该型号不自锁，方案已自动配置制动器 BRE。': 'The model is not self-locking, so brake BRE is configured automatically.',

  /* screw / input / mounting clauses */
  '磨制滚珠丝杠（精度 0.02mm，型号加 GB）': 'ground ball screw (0.02 mm accuracy, add GB to the model code)',
  '磨制滚珠丝杠': 'ground ball screw',
  '梯形丝杠（工作制 30%）': 'trapezoidal screw (30% duty cycle)',
  '导程 10 mm': 'lead 10 mm',
  '减速比 V2': 'gear ratio V2',
  '输入形式 P15（同步带 i=1.5:1）': 'input form P15 (timing belt i=1.5:1)',
  '输入形式 P3（P3 单电机法兰输入）': 'input form P3 (single motor flange input)',
  '输入 P15（同步带 i=1.5:1）': 'input P15 (timing belt i=1.5:1)',
  '安装 前端法兰 FF': 'mounting: front flange FF',
  '接头 外螺纹 FM': 'joint: external thread FM',
  '安装方式 前端法兰 FF，前端接头 外螺纹 FM；导向 无；防护等级 IP65，编码器 增量型':
    'mounting: front flange FF, front joint: external thread FM; guiding: none; protection IP65, incremental encoder',
  '安装方式 P3 单电机法兰输入，方向 RH，接头 ROE 销孔端':
    'mounting: P3 single motor flange input, direction RH, joint ROE clevis end',
  '方向 RH': 'direction RH',
  '接头 ROE 销孔端': 'joint ROE clevis end',
  '限位开关 标配 FCM': 'limit switch FCM (standard)',
  '限位开关 FCP 接近限位开关（标配）': 'limit switch FCP proximity (standard)',
  '重复精度 0.05 mm': 'repeatability 0.05 mm',
  '允许行程（稳定性）1400 mm': 'allowable stroke (stability) 1400 mm',
  '梯形丝杠寿命无理论计算': 'no theoretical life calculation for a trapezoidal screw',
  '样本速度 46.0 mm/s ≥ 要求 50.0 mm/s': 'catalogue speed 46.0 mm/s vs required 50.0 mm/s',
  '样本曲线，安全系数 3': 'catalogue curve, safety factor 3',
  '样本配机档位': 'catalogue motor step',
  '输入转速 3000rpm': 'input speed 3000 rpm',
  '约 1.02 吨': 'approx. 1.02 t',
  '约 1.53 吨': 'approx. 1.53 t',
  '要求': 'required',
  '额定内': 'within rating',
  'RS 标准': 'RS standard',
  '与电机一体化换向器 RSD090/2（速比 1:2，RS 标准）': 'motor-integrated gearbox RSD090/2 (ratio 1:2, RS standard)',
  '换向器 RSD065/1（速比 1:1）': 'gearbox RSD065/1 (ratio 1:1)',
  '整线 1 台': '1 unit shared across the line',
  '整组行程控制': 'group stroke control',
  '带接近限位开关 FCP': 'with proximity limit switch FCP',
  '标准 P2 双输入轴': 'standard P2 double input shaft',

  /* joint / mounting fragments */
  '前段法兰 FF': 'front flange FF',
  '前端法兰 FF': 'front flange FF',
  '前段接头 外螺纹 FM': 'front joint: external thread FM',
  '前端接头 外螺纹 FM': 'front joint: external thread FM',
  '标配 FCM': 'FCM (standard)',
  'FCP 接近限位开关（标配）': 'FCP proximity (standard)',
  '滚珠丝杠电缸': 'ball screw type',
  '梯形丝杠电缸': 'trapezoidal screw type',
  'P10/P20 同步带平行安装': 'P10/P20 parallel timing-belt drive',
  '输入形式与界面所选一致': 'input form matches the selection made in the UI',
  '外形尺寸与接口以确认图为准': 'outline dimensions and interfaces are subject to the confirmed drawing',
  '前后铰接安装口径': 'front / rear trunnion mounting basis',
  '未填平均推拉力': 'average push/pull load not given',
  '满足 5 年以上': 'meets 5 years or more',
  '配制动器（带制动）': 'with brake',
  '带制动，立式安装/断电保持必配——滚珠/行星丝杠不自锁':
    'with brake; mandatory for vertical mounting or power-off holding, as ball and planetary screws are not self-locking',
  '1.0~1.2 倍内': 'within the 1.0-1.2x band',
  'η丝杠=0.8': 'eta_screw = 0.8',
  '满足使用要求': 'meets the service requirement',
  'P10/P20 同步带平行安装 输入形式与界面所选一致':
    'P10/P20 parallel timing-belt drive, input form matching the UI selection',
  '如非铰接安装，请与力姆泰克工程师确认':
    'if the mounting is not a trunnion type, confirm with a Lim-Tec engineer',
  '如需完全达到要求请上调一档或与厂家确认。':
    'Step up one size to fully meet the requirement, or confirm with the factory.',
  '配制动器（带制动，立式安装/断电保持必配——滚珠/行星丝杠不自锁）':
    'with brake (mandatory for vertical mounting or power-off holding, as ball and planetary screws are not self-locking)',
};

/* Field labels that the engine prints as "label value" inside a composed line.
   Lower case: the line is usually mid-sentence, and tr() capitalises the first
   letter of a cell that starts in Chinese. */
const LABEL = {
  '安装方式': 'mounting', '安装': 'mounting', '导向': 'guiding', '防护等级': 'protection class',
  '编码器': 'encoder', '重复精度': 'repeatability', '限位开关': 'limit switch', '导程': 'lead',
  '减速比': 'gear ratio', '速比': 'ratio', '接头': 'joint', '输入': 'input', '输入形式': 'input form',
  '方向': 'direction', '行程': 'stroke', '速度': 'speed', '额定转速': 'rated speed',
  '额定扭矩': 'rated torque', '机座': 'frame', '驱动方式': 'drive type', '工作制': 'duty cycle',
  '总负载推力': 'total thrust', '单缸设计负载': 'design load per cylinder',
  '校核用额定推力': 'rated thrust for the check', '校核用额定': 'rated for the check',
  '最大静载': 'max static load', '额定推力': 'rated thrust', '丝杠输入转速': 'screw input speed',
  '客户年用': 'annual customer travel', '电机端': 'motor end', '丝杠端': 'screw end',
  '偏差': 'deviation', '精度': 'accuracy', '驱动': 'drive', '防护': 'protection',
  '自锁系数': 'self-locking coefficient', '定位精度': 'positioning accuracy',
};
const LABEL_RE = new RegExp('^(' + Object.keys(LABEL).sort((a, b) => b.length - a.length).join('|')
  + ') (\\S.*)$');

/* ---------------- 4. clause templates ---------------- */
const CRULES = [
  [/^(伺服电动缸|梯形丝杠电动推杆|滚珠丝杠电动推杆) (.+?)，(\d+) 台$/,
    (m) => ({ 伺服电动缸: 'Servo electric cylinder', 梯形丝杠电动推杆: 'Trapezoidal screw linear actuator',
      滚珠丝杠电动推杆: 'Ball screw linear actuator' })[m[1]] + ', ' + seg(m[2]) + ', ' + m[3] + ' unit(s)'],
  [LABEL_RE, (m) => LABEL[m[1]] + ': ' + seg(m[2])],
  [/^(.+?)（单台安全裕量，唯一次放大；安全系数一般取 ([\d.]+)，为凑电机标准功率档可取 ([\d.]+)，须在方案中注明）$/,
    (m) => m[1] + ' (per-unit safety margin, applied once only; the usual factor is ' + m[2]
      + ' and may be reduced to ' + m[3] + ' to fit a standard motor power step, to be stated in the proposal)'],
  [/^配同步带 i=([\d.]+)（输入形式标注 P15）折算电机端：(.+)$/,
    (m) => 'with timing belt i=' + m[1] + ' (input form marked P15), referred to the motor end: ' + m[2]],
  [/^按电机额定转速匹配 同步带 i=([\d.]+)$/,
    (m) => 'matching the motor rated speed with timing belt i=' + m[1]],
  [/^丝杠输入转速 (\d+rpm)：(.+)$/, (m) => 'screw input speed ' + m[1] + ': ' + seg(m[2])],
  [/^要求 (.+?) ≤ 型号最大 (.+)$/, (m) => 'required ' + m[1] + ' ≤ model maximum ' + m[2]],
  [/^所选型号样本档位速度 (.+?) 略低于要求 (.+?)（差 (.+?)），按「接近口径（≤20%）」放行$/,
    (m) => 'The catalogue step speed of the selected model is ' + m[1] + ', slightly below the required ' + m[2]
      + ' (short by ' + m[3] + '); released under the near-fit rule (≤20%)'],
  [/^(梯形丝杠电动推杆|滚珠丝杠电动推杆|伺服电动缸) (\S+) (外形尺寸与接口以确认图为准)$/,
    (m) => ({ 梯形丝杠电动推杆: 'Trapezoidal screw linear actuator',
      滚珠丝杠电动推杆: 'Ball screw linear actuator',
      伺服电动缸: 'Servo electric cylinder' })[m[1]] + ' ' + m[2]
      + ' - outline dimensions and interfaces are subject to the confirmed drawing'],
  [/^整线 (\d+) 台$/, (m) => m[1] + ' unit(s) shared across the line'],
  [/^(.+?)，整线 (\d+) 台$/, (m) => seg(m[1]) + ', ' + m[2] + ' unit(s) across the line'],
  [/^(\d+) 台电机$/, (m) => m[1] + ' motor'],
  [/^(\d+) 台带 (.+)$/, (m) => m[1] + ' unit(s) with ' + seg(m[2])],
  [/^(\d+) 台标准 (.+)$/, (m) => m[1] + ' standard ' + seg(m[2]) + ' unit(s)'],
  [/^(\d+) 台([^，；\s].*)$/, (m) => m[1] + ' units, ' + seg(m[2])],
  [/^(.+?) (\d+) 台$/, (m) => m[2] + ' x ' + seg(m[1])],
  [/^(.+?) (\d+) 根$/, (m) => m[2] + ' x ' + seg(m[1])],
  [/^(.+?) (\d+) 个$/, (m) => m[2] + ' x ' + seg(m[1])],
  [/^约 ([\d.]+) 吨$/, (m) => 'approx. ' + m[1] + ' t'],
  [/^要求 ([\d.]+) 吨$/, (m) => 'required ' + m[1] + ' t'],
];

/* ---------------- 2. sentence templates ---------------- */
/* Order matters: the first match wins, so keep the specific ones on top. */
const RULES = [
  /*
*/
  [/^([\x20-\x7E]*?)\s*计算,?$/, (m) => m[1] + ', calculated as follows:'],
  /**/
  [/^图：(\d+) 台(.+?)，(.+?)，机械同步（(.+)）$/,
    (m) => 'Fig.: ' + m[1] + ' units, ' + seg(m[2]).replace(/布置/g, 'layout') + ', ' + seg(m[3])
      + ', mechanically synchronised (' + parts(m[4]) + ')'],
  [/^图：(\d+) 台(.+?)，(.+?)（(.+)）$/,
    (m) => 'Fig.: ' + m[1] + ' units, ' + seg(m[2]).replace(/布置/g, 'layout') + ', ' + seg(m[3])
      + ' (' + parts(m[4]) + ')'],
  [/^图：(.+)$/, (m) => 'Fig.: ' + byClause(m[1])],

  /**/
  [/^选型 (.+?)：额定(.+?) ([\d.]+\s*k?N) ≥ 单台需求 ([\d.]+\s*k?N)（裕量 (.+?)），选型通过；完整型号 (.+)$/,
    (m) => 'Selection ' + m[1] + ': rated ' + low(seg(m[2])) + ' ' + m[3] + ' vs required ' + m[4]
      + ' per unit (margin ' + m[5] + ') - passed; full order code ' + m[6]],

  /* duty-point lines */
  [/^总负载 (.+?)（(.+?)），单台 (.+)$/, (m) => 'Total load ' + m[1] + ' (' + m[2] + '), ' + m[3] + ' per unit'],
  [/^行程 (.+?)；速度 (.+?)；每日 (\d+) 次 × (.+?) 小时，年运行 (.+?) 天$/,
    (m) => 'Stroke ' + m[1] + '; speed ' + m[2] + '; ' + m[3] + ' cycles/day x ' + m[4] + ' h, ' + m[5] + ' working days/year'],
  [/^行程 (.+?)，速度 (.+?)；(\d+) 次\/日 × (\d+) 天\/年$/,
    (m) => 'Stroke ' + m[1] + ', speed ' + m[2] + '; ' + m[3] + ' cycles/day x ' + m[4] + ' days/year'],

  /* verification rows */
  [/^单台 (.+?)（总 (.+?) ÷ (\d+) 台）；(.+?) 下限 (.+?)，按实际载荷计算$/,
    (m) => m[1] + ' per unit (total ' + m[2] + ' ÷ ' + m[3] + ' units); the ' + m[4] + ' lower limit is '
      + m[5] + ', calculated from the actual load'],
  [/^速比 (.+?)，每转 (.+?)；丝杠 (\d+) rpm（电机端 (\d+) rpm）$/,
    (m) => 'Ratio ' + m[1] + ', ' + m[2] + ' per revolution; screw ' + m[3] + ' rpm (motor end ' + m[4] + ' rpm)'],
  [/^(输出功率|输入功率|平台总功率|放大系数|最大输入功率校核|驱动扭矩|扭矩校核|电机扭矩)：(.*)$/,
    (m) => ({ 输出功率: 'Output power', 输入功率: 'Input power', 平台总功率: 'Platform total power',
      放大系数: 'Safety factor', 最大输入功率校核: 'Max input power check', 驱动扭矩: 'Drive torque',
      扭矩校核: 'Torque check', 电机扭矩: 'Motor torque' })[m[1]] + ': ' + byClause(m[2])],
  [/^按(\d{4})样本稳定性曲线，载荷 (.+?) 下允许稳定长度 Lk≈(.+?)，校核通过$/,
    (m) => 'Per the ' + m[1] + ' catalogue stability curve the allowable stability length at ' + m[2]
      + ' load is Lk ≈ ' + m[3] + ' - passed'],
  [/^(.+?)系列（([A-Z0-9]+)）：每日 (\d+) 次、速度 (.+?)，符合选择原则$/,
    (m) => seg(m[1]) + ' series (' + m[2] + '): ' + m[3] + ' cycles/day at ' + m[4] + ' - meets the selection rule'],
  [/^(\d+)rpm 档 \+ (.+?)速比 (.+?)，升降机输入转速 (\d+)rpm，$/,
    (m) => m[1] + ' rpm step plus bevel gearbox ratio ' + m[3] + ', jack input speed ' + m[4] + ' rpm'],
  [/(.+?)（单台安全裕量.*）$/,
    (m) => seg(m[1]) + ' (per-unit safety margin, applied once only; the usual factor is 1.2 and may be reduced to 1.1 '
      + 'to fit a standard motor power step, to be stated in the proposal)'],
  [/^配同步带 i=([\d.]+)（输入形式标注 P15）折算电机端：(.+)$/,
    (m) => 'with timing belt i=' + m[1] + ' (input form marked P15), referred to the motor end: ' + seg(m[2])],

  /* cylinder stability / rated rows */
  [/^按(\d{4})样本稳定性曲线（(.+?)），载荷 (.+?) 下允许行程约 (.+?) ≥ 要求 (.+?)$/,
    (m) => 'Per the ' + m[1] + ' catalogue stability curve (' + seg(m[2]) + ') the allowable stroke at ' + m[3]
      + ' load is approx. ' + m[4] + ', against a requirement of ' + m[5]],
  [/^额定 (.+?) ≥ 要求 (.+?)（约 ([\d.]+) 吨）$/, (m) => 'Rated ' + m[1] + ' vs required ' + m[2] + ' (approx. ' + m[3] + ' t)'],
  [/^额定推力 (.+?) ≥ 单缸设计负载 (.+?)；最大静载 (.+)$/,
    (m) => 'Rated thrust ' + m[1] + ' vs design load per cylinder ' + m[2] + '; max static load ' + m[3]],
  [/^压载 (.+?) 时允许行程 (.+?) ≥ 要求 (.+?)（(.+?)）$/,
    (m) => 'At ' + m[1] + ' load the allowable stroke is ' + m[2] + ', against a requirement of ' + m[3]
      + ' (' + seg(m[4]) + ')'],
  [/^理论寿命 (.+)$/, (m) => 'Theoretical life ' + byClause(m[1])],
  [/^所需转速 (.+?) ≤ 电机额定 (.+?)；要求 (.+?) ≤ 型号最大 (.+)$/,
    (m) => 'Required speed ' + m[1] + ' ≤ motor rated ' + m[2] + '; required ' + m[3] + ' ≤ model maximum ' + m[4]],
  [/^丝杠端 T = (.+?) 安全系数 → 电机端需求 (.+?) ≤ (.+?) 额定 (.+)$/,
    (m) => 'Screw end T = ' + m[1] + ' with safety factor - motor-end requirement ' + m[2] + ' ≤ ' + seg(m[3]) + ' rated ' + m[4]],
  [/^伺服电机调速 \+ 同步带：(.+)$/, (m) => 'Servo motor speed matching with timing belt: ' + byClause(m[1])],

  /* linear actuator rows */
  [/^所选型号样本档位速度 (.+?) 略低于要求 (.+?)（差 (.+?)），按「接近口径（≤20%）」放行；如需完全达到要求请上调一档或与厂家确认。$/,
    (m) => 'The catalogue step speed of the selected model is ' + m[1] + ', slightly below the required ' + m[2]
      + ' (short by ' + m[3] + '); released under the near-fit rule (≤20%). Step up one size to fully meet the '
      + 'requirement, or confirm with the factory.'],
];

/* ---------------- helpers ---------------- */
function norm(s) {
  return String(s).replace(/\u3000/g, ' ').replace(/^\s+|\s+$/g, '');
}

/* A dictionary entry written for standalone use is capitalised; inside a
   sentence ("rated push/pull force") it must not be. */
function low(s) {
  return /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}

const KEY = new Map(Object.entries(EXACT).map(([k, v]) => [norm(k), v]));
const CKEY = new Map(Object.entries(CLAUSE).map(([k, v]) => [norm(k), v]));

/* Cut on a separator, but never inside  - the engine nests clauses in brackets. */
function splitTop(s, sep) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '（' || ch === '(') depth++;
    else if (ch === '）' || ch === ')') depth = Math.max(0, depth - 1);
    if (ch === sep && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

/* One clause: dictionary, then clause templates, then a ，split, then the shared
   term dictionary. The ，split keeps "Protection class: IP65, Encoder: ..." from
   being handed to the fragment layer as one long piece. */
function seg(s) {
  const k = norm(s);
  if (!k) return '';
  if (CKEY.has(k)) return CKEY.get(k);
  for (const [re, fn] of CRULES) {
    const m = re.exec(k);
    if (m) return fn(m);
  }
  if (KEY.has(k)) return KEY.get(k);
  const bits = splitTop(k, '，');
  if (bits.length > 1) return bits.map((b) => seg(b)).join(', ');
  return T(k);
}

/**/
function parts(s) {
  return splitTop(s, '+').map((p) => seg(p)).join(' + ');
}

/* Last resort: clause by clause, so an unseen sentence still reads as English. */
function byClause(s) {
  return splitTop(s, '；').map((a) => (HAS_CJK.test(a) ? seg(a) : norm(a))).join('; ');
}

/* Tidy punctuation and the spacing the fragment substitutions leave behind. */
function tidy(s) {
  return String(s)
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,;:.)])/g, '$1')
    .replace(/\.\s*;/g, ';')
    .replace(/\(\s+/g, '(')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\.\s*$/, '.');
}

/* Safety net: a template handler may interpolate a raw group by mistake, or the
   engine may append a clause the rule did not anticipate. Anything still holding
   Chinese is pushed through the clause layer once more, so the document never
   ships a half-translated line. */
let IN_FINISH = false;
function finish(s) {
  if (!HAS_CJK.test(s) || IN_FINISH) return s;
  IN_FINISH = true;
  try { return byClause(s); } finally { IN_FINISH = false; }
}

function tr(s) {
  if (typeof s !== 'string') return s;
  const k = norm(s);
  if (!k) return s;
  let out;
  if (KEY.has(k)) {
    out = KEY.get(k);
  } else {
    let hit = null;
    for (const [re, fn] of RULES) {
      const m = re.exec(k);
      if (m) { hit = fn(m); break; }
    }
    out = hit !== null ? tidy(finish(hit)) : (HAS_CJK.test(k) ? tidy(byClause(k)) : k);
  }
  /* a cell that starts in Chinese should start with a capital in English */
  if (/^[\u4e00-\u9fff]/.test(k) && /^[a-z]/.test(out)) out = out[0].toUpperCase() + out.slice(1);
  return out;
}

module.exports = { tr, EXACT, CLAUSE, RULES, seg, parts };
