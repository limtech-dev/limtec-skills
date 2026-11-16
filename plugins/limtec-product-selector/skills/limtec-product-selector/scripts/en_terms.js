'use strict';
/* Lim-Tec Selector — English language layer.
 *
 * The selection engine is byte-identical to the Lim-Tec online platform and only
 * speaks Chinese. This module converts its output to English and maps English
 * option values to the Chinese ones the engine expects, so that the engine files
 * never have to be touched (md5 in scripts/source_manifest.json stays valid).
 *
 * Three layers, applied in this order:
 *   1. RULES  — parameterised sentences (numbers inside), rebuilt from capture groups
 *   2. EXACT  — whole-string matches (short labels, option names, item descriptions)
 *   3. PHRASE — longest-first fragment substitution for everything composed at runtime
 * Punctuation is normalised last.
 */

/* ---------------- 1. parameterised sentences ---------------- */
/* Order matters: the first matching rule wins. */
const RULES = [
  /*

*/
  [/^【勉强通过】(.+?) (.+?) 最大输入功率仅为计算功率的 ([\d.]+) 倍（×1\.1~×1\.2 区间）[，,、]\s*勉强可用、裕量偏小$/,
    (m) => 'Marginal pass - ' + m[1] + ' ' + m[2] + ': the maximum input power is only ' + m[3]
      + 'x the calculated power (inside the 1.1-1.2x band); usable, but with little margin'],
  [/^【推力校核】(.+?) 单台需求 ([\d.]+)kN 超过最大提升力 ([\d.]+)kN[，,]需选更大型号$/,
    (m) => 'Thrust check - ' + m[1] + ': the requirement of ' + m[2]
      + ' kN per unit exceeds the maximum lifting force of ' + m[3] + ' kN; step up to a larger model'],
  [/^没有完全通过全部校核的型号[；;]\s*以下为「最接近」的候选[，,]\s*未满足[：:]\s*(.+)$/,
    (m) => 'No model passes every check - the closest candidates are listed below; not met: ' + T(m[1])],
  [/^更大档位核验（为何未继续升档）[：:]\s*(.+)$/,
    (m) => 'Larger-step check (why the step-up stopped): ' + T(m[1])],
  [/^最接近的候选[：:]\s*(.+?)\s*[（(]未满足[：:]\s*(.+?)[）)]$/,
    (m) => 'Closest candidate: ' + m[1] + ' (not met: ' + T(m[2]) + ')'],
  [/^本体（([A-Z0-9\-]+)，行程 (\d+)mm 按 (\d+)mm 标准档(.*)）$/,
    (m) => 'Body (' + m[1] + ', stroke ' + m[2] + ' mm mapped to the ' + m[3] + ' mm standard step'
      + stepNote(m[4]) + ')'],
  [/^行星丝杠 (.+?)（行程 (\d+)mm 按 (\d+)mm 标准档(.*)）$/,
    (m) => 'Planetary roller screw ' + m[1] + ' (stroke ' + m[2] + ' mm mapped to the ' + m[3]
      + ' mm standard step' + stepNote(m[4]) + ')'],
  [/^插头 ([A-Z0-9]+)（驱动器厂家标准）$/, (m) => 'Plug ' + m[1] + ' (drive manufacturer standard)'],
  [/^滚珠丝杠基数费用$/, () => 'Ball screw base charge'],
  [/^滚珠丝杠 ([\d.]+)mm（([^）]+)）$/, (m) => 'Ball screw ' + m[1] + ' mm (' + m[2].replace(/×/g, ' x ') + ')'],
  [/^普通齿丝杠 ([\d.]+)mm（([^）]+)）$/, (m) => 'Trapezoidal screw ' + m[1] + ' mm (' + m[2].replace(/×/g, ' x ') + ')'],
  [/^所有电机（含伺服）配制动器（必选）——YE3EJ 电磁制动系列[，,]价含基座制动器$/,
    () => 'all motors (incl. servo) with brake (mandatory) - YE3EJ brake series, '
      + 'price includes the frame-mounted brake'],
  [/^配制动器（本方案必选：(.+?)）——YE3EJ 电磁制动系列，价含基座制动器$/,
    (m) => 'motor brake fitted (mandatory for this layout: ' + T(m[1])
      + ') - YE3EJ brake series, price includes the frame-mounted brake'],
  [/^超功率（额定超该档最大输入功率 ([\d.]+) kW）$/,
    (m) => 'Over power (rated ' + m[1] + ' kW above the maximum input power of this step)'],
  /* brake advice */
  [/^【制动器建议】(.+)$/, (m) => 'Brake recommendation: ' + m[1]],
  /* motor library gap warning */
  [/^【电机真机型】所选品牌库内无适用真机型（库内 (\d+)rpm 无完全适用真机型，此为最后参考档：额定 ([\d.]+)kW 较需求 ([\d.]+)kW 差 ([\d.]+)%，需与厂家确认更大机座号或调整方案）；方案机械侧校核按需求值计算，需与厂家确认更大机座号或调整方案$/,
    (m) => 'Motor library note: no exact motor in the selected brand library at ' + m[1] + ' rpm. '
      + 'Closest reference frame: rated ' + m[2] + ' kW vs required ' + m[3] + ' kW (short by ' + m[4] + '%). '
      + 'Confirm a larger frame size with the factory or change the duty point. '
      + 'Mechanical checks were calculated against the required values.'],
  /* jack body description */
  [/^本体（([A-Z0-9\-]+)，行程 (\d+)mm 按 (\d+)mm 标准档）$/, (m) => 'Body (' + m[1] + ', stroke ' + m[2] + ' mm mapped to the ' + m[3] + ' mm standard step)'],
  /**/
  [/^(.+?) (\d+) 台：(.+)$/, (m) => T(m[1]) + ' x ' + m[2] + ': ' + T(m[3])],
  [/^(.+?) (\d+) 根：(.+)$/, (m) => T(m[1]) + ' x ' + m[2] + ': ' + T(m[3])],
  [/^(.+?) (\d+) 个：(.+)$/, (m) => T(m[1]) + ' x ' + m[2] + ': ' + T(m[3])],
  /* no-match error messages - tolerate full-width punctuation from the engine */
  [/^没有可用候选型号\s*[:：]\s*(.+?)\s*[（(]未知系列[）)]$/,
    (m) => 'No selectable model: ' + m[1] + ' (unknown series)'],
  [/^四个系列内没有全部校核通过的型号\s*[:：]\s*请放宽行程\/速度\/寿命要求\s*[,，]?\s*或与厂家技术确认特殊工况[.。]?$/,
    () => 'No model in the four series passes every check (thrust, speed and life). '
      + 'Relax the stroke / speed / life requirement, or confirm the special duty with the factory.'],
  [/^没有可用候选型号\s*[:：]\s*(.+)$/, (m) => 'No selectable model: ' + T(m[1])],
  [/^四个系列内没有全部校核通过的型号\s*[:：]\s*(.+)$/,
    (m) => 'No model in the four series passes every check - ' + T(m[1])],
  [/^所选系列内无额定(.+?)\s*≥\s*([\d.]+)\s*(\w+)\s*[（(]单缸要求[）)]的型号\s*[:：]\s*请更换系列或与厂家技术确认特殊规格[.。]?$/,
    (m) => 'No model in the selected series reaches the required ' + T(m[1]) + ' of ' + m[2] + ' ' + m[3]
      + ' per cylinder. Choose another series or confirm a special design with the factory.'],
  [/^在\s*(.+?)\s*系列中未找到满足\s*[（(](.+?)[）)]\s*要求的型号\s*[,，]?\s*请调整参数或改选其它系列$/,
    (m) => 'No model in the ' + T(m[1]) + ' series satisfies the requirement (' + T(m[2])
      + '). Adjust the duty point or choose another series.'],
  [/^(.+?)系列中未找到满足\s*[（(](.+?)[）)]\s*要求的型号\s*[,，]?\s*请调整参数或改选其它系列$/,
    (m) => 'No model in the ' + T(m[1]) + ' series satisfies the requirement (' + T(m[2])
      + '). Adjust the duty point or choose another series.'],
  /* pending quotation */
  [/^待报价：(.+)$/, (m) => 'Quotation required: ' + m[1]],
  [/^待人工报价：(.+)$/, (m) => 'Manual quotation required: ' + m[1]],
  /* input form descriptions */
  [/^输入形式 ([A-Z0-9\/]+)（(.+)）$/, (m) => 'Input form ' + m[1] + ' (' + m[2] + ')'],
  [/^输入形式 ([A-Z0-9\/]+) (.+)$/, (m) => 'Input form ' + m[1] + ', ' + m[2]],
  /* short labelled lines */
  [/^安装 (.+)$/, (m) => 'Mounting ' + m[1]],
  [/^接头 (.+)$/, (m) => 'Joint ' + m[1]],
  [/^限位开关 ([A-Z0-9]+) (.+)$/, (m) => 'Limit switch ' + m[1] + ' (' + m[2] + ')'],
  /* drive / motor kit lines carrying a power figure */
  [/^交流伺服电机驱动器\u3000([\d.]+) kW$/, (m) => 'AC servo motor + drive, ' + m[1] + ' kW'],
  [/^交流伺服电机驱动器$/, () => 'AC servo motor + drive'],
  /* "Rated ... 5 kN；..." style spec strings are handled by PHRASE */
];

/* ---------------- 2. whole-string matches ---------------- */
const EXACT = {
  /* product lines */
  '螺旋升降机（丝杠升降机）': 'Screw jacks',
  '电缸（电动缸／伺服电缸）': 'Electric cylinders',
  '电动推杆': 'Linear actuators',

  /* option values that reach the output verbatim */
  '有': 'Yes',
  '无': 'None',
  '否': 'No',
  '是': 'Yes',
  '室内': 'Indoor',
  '室内常温': 'Indoor, normal temperature',
  '室外': 'Outdoor',
  '洁净间': 'Cleanroom',
  '机械': 'Mechanical',
  '电气': 'Electrical',
  '增量型': 'Incremental',
  '多圈绝对编码器': 'Multi-turn absolute',
  '旋转变压器': 'Resolver',
  '地脚安装': 'Floor mount',
  'H型布置': 'H-layout',
  'U型布置': 'U-layout',
  'U2型布置': 'U2-layout',
  '不带': 'Not included',
  '标配': 'Standard',
  '无要求': 'No requirement',
  '无电机': 'Without motor',
  '单台': 'Single unit',
  '两台': 'Two units',
  '三台': 'Three units',
  '四台': 'Four units',
  '普通齿丝杠 600mm（6×100mm）': 'Standard trapezoidal screw, 600 mm (6 x 100 mm)',
  '常用型号': 'Standard model',

  /* check names emitted by the engine */
  '额定推拉力': 'Rated push/pull force',
  '额定推力': 'Rated thrust',
  '额定拉力': 'Rated pull force',
  '最大输入功率': 'Max input power',
  '速度': 'Speed',
  '输入转速': 'Input speed',
  '稳定性': 'Stability',
  '推拉力': 'Push/pull force',
  '推力': 'Thrust',
  '工作制': 'Duty cycle',
  '静载': 'Static load',
  '最大行程': 'Max stroke',
  '行程': 'Stroke',
  '寿命': 'Life',
  '寿命要求': 'Life requirement',
  '自锁': 'Self-locking',
  '同步': 'Synchronisation',
  '导向': 'Guiding',
  '防护等级': 'Protection class',
  '重复精度': 'Repeatability',
  '电机功率': 'Motor power',
  '电机扭矩': 'Motor torque',
  '电机转速': 'Motor speed',
  '负载率': 'Load factor',
  '惯量比': 'Inertia ratio',
  '热功率': 'Thermal power',
  '丝杠转速': 'Screw speed',

  /* bill-of-material lines */
  '传动轴': 'Drive shaft',
  '联轴器': 'Coupling',
  '换向器': 'Gearbox',
  '轴长按客户平台实际尺寸确定': 'Shaft length to be confirmed against the customer platform dimensions',
  '每根传动轴配 2 个（12 个），与升降机蜗杆输入轴及传动轴配套': '2 per drive shaft (12 in total), matched to the jack worm input shaft and drive shaft',
  '与电机一体化换向器 RSD090/2（速比 1:2，RS 标准）': 'Motor-integrated gearbox RSD090/2 (ratio 1:2, RS standard)',
  '换向器 RSD065/1（速比 1:1）': 'Gearbox RSD065/1 (ratio 1:1)',
  'RS 标准': 'RS standard',
  '额定内': 'within rating',
  '峰值（≤最大输出扭矩，寿命影响与厂家确认）': 'peak (within max output torque; life impact to be confirmed with the factory)',

  /* accessory names */
  '防转 AR': 'Anti-rotation AR',
  '防转': 'Anti-rotation',
  '法兰端 FL': 'Flange end FL',
  '外螺纹 FM': 'External thread FM',
  '标准（按基座号自动）': 'Standard (auto by frame size)',
  '驱动电机': 'Drive motor',
  '驱动电机（按推荐配置）': 'Drive motor (recommended configuration)',

  /* brake advice bodies (short forms) */
  'L1 蜗轮蜗杆自锁，电机可不加制动器（如客户要求双保险可选配）':
    'L1 worm gear is self-locking, so a brake is optional (add one if the customer wants redundancy)',
  '该速比下蜗轮蜗杆不自锁，建议电机增加制动器':
    'the worm gear is not self-locking at this ratio; a motor brake is recommended',
};

/* ---------------- 3. phrase substitution (longest first) ---------------- */
const PHRASE = [
  /* full sentences that appear inside warnings */
  ['所选品牌库内无适用真机型', 'no exact motor in the selected brand library'],
  ['此为最后参考档', 'closest reference frame'],
  ['需与厂家确认更大机座号或调整方案', 'confirm a larger frame size with the factory or change the duty point'],
  ['方案机械侧校核按需求值计算', 'mechanical checks were calculated against the required values'],
  ['如客户要求双保险可选配', 'add one if the customer wants redundancy'],
  ['标准梯形丝杠可非标减少丝杠导程实现自锁', 'a custom shorter lead can make the standard trapezoidal screw self-locking'],
  ['非标导程需与力姆泰克工程师沟通确认', 'custom leads must be confirmed with a Lim-Tec engineer'],
  ['标准梯形丝杠自锁', 'the standard trapezoidal screw is self-locking'],
  ['蜗轮蜗杆不自锁', 'the worm gear is not self-locking'],
  ['蜗轮蜗杆自锁', 'the worm gear is self-locking'],
  ['建议电机增加制动器', 'a motor brake is recommended'],
  ['电机可不加制动器', 'a motor brake is not required'],
  ['综合均自锁', 'self-locking in both L1 and V1'],
  ['该速比下', 'at this ratio, '],
  ['建议电机增加制动器', 'a motor brake is recommended'],
  ['防转', 'anti-rotation'],
  ['带接近限位开关', 'with proximity limit switch'],
  ['整组行程控制', 'group stroke control'],
  ['标准 P2 双输入轴', 'standard P2 double input shaft'],

  /* spec-string fragments */
  ['额定推拉力', 'rated push/pull force'],
  ['额定动载荷', 'rated dynamic load'],
  ['额定静载荷', 'rated static load'],
  ['丝杠类型', 'screw type'],
  ['滚珠丝杠', 'ball screw'],
  ['梯形丝杠', 'trapezoidal screw'],
  ['磨制滚珠丝杠', 'ground ball screw'],
  ['轧制滚珠丝杠', 'rolled ball screw'],
  ['每转行程', 'travel per revolution'],
  ['最大输入功率', 'max input power'],
  ['传动效率', 'efficiency'],
  ['启动', 'starting'],
  ['运转', 'running'],
  ['速比', 'ratio'],
  ['接头', 'joint'],
  ['法兰端', 'flange end'],
  ['外螺纹', 'external thread'],
  ['附件', 'accessories'],
  ['防转', 'anti-rotation'],
  ['行程', 'stroke'],
  ['推拉力', 'push/pull force'],
  ['推力', 'thrust'],
  ['拉力', 'pull force'],
  ['静载', 'static load'],
  ['速度', 'speed'],
  ['功率', 'power'],
  ['额定转速', 'rated speed'],
  ['额定扭矩', 'rated torque'],
  ['额定功率', 'rated power'],
  ['输入转速', 'input speed'],
  ['机座', 'frame'],
  ['轴高', 'shaft height'],
  ['驱动器', 'drive'],
  ['成套附件', 'kit accessories'],
  ['动力/编码器电缆', 'power/encoder cable'],
  ['长度按现场配置，价格另计', 'length to suit site, priced separately'],
  ['成套价需询', 'kit price on request'],
  ['按电机额定扭矩', 'from motor rated torque'],
  ['减速比', 'gear ratio'],
  ['不超过样本', 'not exceeding catalogue page'],
  ['许用输出扭矩', 'permissible output torque'],
  ['选机座号', 'select frame size'],
  ['已按一体化匹配升档', 'upsized for integrated mounting'],
  ['超出', 'exceeds'],
  ['的允许法兰/轴径/功率', ' allowable flange / shaft diameter / power'],
  ['升为', 'upgraded to'],
  ['按电机端换向器扭矩的一半约', 'half of the motor-side gearbox torque, approx.'],
  ['输入形式', 'input form'],
  ['同步带平行安装', 'parallel timing-belt drive'],
  ['单电机法兰输入', 'single motor flange input'],
  ['限位开关', 'limit switch'],
  ['接近限位开关', 'proximity limit switch'],
  ['安装', 'mounting'],
  ['标准梯形丝杠不自锁', 'the standard trapezoidal screw is not self-locking'],
  ['不自锁', 'not self-locking'],
  ['与电机一体化', 'motor-integrated '],
  ['RS 标准', 'RS standard'],
  ['西门子', 'Siemens'],
  ['（默认）', ' (default)'],
  ['（标配）', ' (standard)'],
  ['力姆泰克', 'Lim-Tec'],
  ['螺旋升降机', 'screw jack'],
  ['电缸', 'electric cylinder'],
  ['电动推杆', 'linear actuator'],

  /* separator words that must go last */
  ['；', '; '],
  ['：', ': '],
  ['、', ', '],
  ['，', ', '],
  ['（', ' ('],
  ['）', ')'],
  ['。', '. '],
];

/*
*/
PHRASE.sort((a, b) => b[0].length - a[0].length);

/*

*/
PHRASE.push(
  ['联轴器', 'coupling'],
  ['传动轴', 'drive shaft'],
  ['换向器', 'gearbox'],
  ['蜗杆', 'worm'],
  ['标准档', 'standard step'],
  ['实际尺寸确定', 'to be confirmed'],
  ['客户平台', 'the customer platform'],
  ['L1 档', 'L1 step'],
  ['L2 档', 'L2 step'],
  ['L3 档', 'L3 step'],
  ['V1 档', 'V1 step'],
  ['梯形丝杠螺旋升降机', 'trapezoidal screw jack'],
  ['滚珠丝杠螺旋升降机', 'ball screw jack'],
  ['梯形丝杠升降机推杆', 'trapezoidal screw actuator'],
  ['滚珠丝杠升降机推杆', 'ball screw actuator'],
  ['伞齿轮螺旋升降机', 'bevel gear screw jack'],
  ['不锈钢螺旋升降机', 'stainless steel screw jack'],
  ['螺母运动螺旋升降机', 'translating nut screw jack'],
  ['丝杠运动螺旋升降机', 'rotating screw screw jack'],
  ['行星减速机', 'planetary gearbox'],
  ['额定输出扭矩', 'rated output torque'],
  ['输出扭矩', 'output torque'],
  ['输出转速', 'output speed'],
  ['额定输入扭矩', 'rated input torque'],
  ['适配电机轴径', 'suitable for motor shaft diameter'],
  ['电机轴径', 'motor shaft diameter'],
  ['电机经减速机接升降机输入轴', 'the motor drives the jack input shaft through the gearbox'],
  ['选型', 'selection'],
  ['额定内', 'within rating'],
  ['额定', 'rated '],
  ['最大', 'max '],
  ['选', 'select '],
  ['小型电动推杆', 'small linear actuator'],
  ['须大于', ' must exceed '],
  ['电机扭矩', 'motor torque'],
  ['扭矩', ' torque'],
  ['额定内径', 'rated bore'],
  ['内径', 'bore'],
  ['稳定性', 'stability'],
  ['寿命', 'life'],
  ['系列', 'series'],
  ['配制动器', 'with brake'],
  ['本方案必选', 'required for this configuration'],
  ['本方案必须', 'required for this configuration'],
  ['交流电机', 'AC motor'],
  ['交流', 'AC '],
  ['校核', ' check'],
  ['载荷', 'load'],
  ['需求', 'requirement'],
  ['样本', 'catalogue'],
  ['曲线', 'curve'],
  ['机构', 'mechanism'],
  ['满足要求', 'meets the requirement'],
  ['完整型号', 'full model'],
  ['按实际载荷计算', 'calculated from the actual load'],
  ['整线', 'whole line'],
  ['P出', 'P_out'],
  ['P入', 'P_in'],
  ['P平', 'P_platform'],
  ['伺服', 'servo '],
  ['布置', ' layout'],
  ['同步', 'synchronised '],
  ['℃', ' degC'],
  ['室内', 'indoor'],
  ['U2型布置', 'U2-layout'],
  ['H型布置', 'H-layout'],
  ['U型布置', 'U-layout'],
  ['机械同步', 'mechanical synchronisation'],
  ['选型原则', 'the selection rule'],
  ['无特殊工况', 'no special requirement'],
  ['机械', 'mechanical '],
  ['升降机', 'jack'],
  ['廊坊', 'Langfang'],
  ['符合', 'meets '],
  ['总', 'total '],
  ['端', 'end'],
  ['按', 'per '],
  ['下', ' at '],
  ['带', 'with '],
  ['无', 'no '],
  /* --- proposal (Word/PDF) vocabulary --- */
  ['应用方案与系统布置', 'Application & System Layout'],
  ['供货范围与报价', 'Scope of Supply & Quotation'],
  ['商务条款与报价说明', 'Terms & Conditions'],
  ['商务条款', 'Terms & Conditions'],
  ['选型摘要', 'Selection Summary'],
  ['客户需求', 'Customer Requirements'],
  ['公司简介', 'Company Profile'],
  ['产品特点', 'Product Features'],
  ['传动设备有限公司', 'Transmission Equipment Co., Ltd.'],
  ['销售部', 'Sales Department'],
  ['方案书', 'Proposal'],
  ['数量', 'Qty'],
  ['总负载', 'total load'],
  ['单台', 'per unit '],
  ['每日', 'per day '],
  ['年运行', 'operating '],
  ['小时', 'hours'],
  ['天', ' days'],
  ['次', 'cycles'],
  ['裕量', 'margin'],
  ['下限', 'lower limit'],
  ['通过', 'passed'],
  ['组合系数', 'combination factor '],
  ['平台总功率', 'platform total power'],
  ['放大系数', 'safety factor'],
  ['输出功率', 'output power'],
  ['输入功率', 'input power'],
  ['每转', 'per revolution'],
  ['允许稳定长度', 'allowable stability length'],
  ['符合选型原则', 'meets the selection rule'],
  ['标准工况', 'standard duty'],
  ['特殊系数修正', 'no special factor applied'],
  ['无特殊工况配置', 'no special requirements'],
  ['导向杆安装', 'guide-rod mounting'],
  ['客户自备导向', 'customer-supplied guiding'],
  ['侧向力不作用于升降机', 'lateral load does not act on the jack'],
  ['不要求自锁', 'self-locking not required'],
  ['可不加制动器', 'a brake is not required'],
  ['可不配制动器', 'a brake is not required'],
  ['选择原则', 'the selection rule'],
  ['机构自锁满足要求', 'the mechanism is self-locking as required'],
  ['无特殊系数修正', 'no special factor applied'],
  ['H型布置布置', 'H-layout'],
  ['伞齿轮', 'bevel gear'],
  ['整线共用', 'shared by the whole line'],
  ['移动螺母', 'translating nut'],
  ['螺母固定', 'fixed nut'],
  ['丝杠运动', 'rotating screw'],
  ['标准 P2', 'standard P2'],
  ['图', 'Fig.'],
  ['三相异步电动机', 'three-phase induction motor'],
  ['皖南', 'Wannan'],
  ['台达', 'Delta'],
  ['汇川', 'Inovance'],
  ['雷赛', 'Leadshine'],
  ['英威腾', 'INVT'],
  ['惠斯通', 'Wheastone'],
  ['附件', 'accessory'],
  ['丝杠', 'screw'],
  ['电机', 'motor '],
  ['法兰', 'flange'],
  ['轴径', 'shaft diameter'],
  ['／', ' / '],
  ['档', 'step'],
  ['允许法兰', 'allowable flange'],
  ['许用输出扭矩选机座号', 'permissible output torque, select frame size'],
  ['轴长按', 'shaft length per '],
  ['配套', 'matched'],
  ['每根', 'per '],
  /* proposal wording: cylinder / actuator rows */
  ['滚珠丝杠电缸', 'ball screw type'],
  ['梯形丝杠电缸', 'trapezoidal screw type'],
  ['滚珠丝杠电动推杆', 'ball screw linear actuator'],
  ['梯形丝杠电动推杆', 'trapezoidal screw linear actuator'],
  ['按接近口径放行', 'released under the near-fit rule'],
  ['接近口径放行', 'released under the near-fit rule'],
  ['电动缸', 'electric cylinder'],
  ['导程', 'lead'],
  ['允许行程', 'allowable stroke'],
  ['理论计算', 'theoretical calculation'],
  ['常规工况', 'standard duty'],
  ['压载', 'load'],
  ['欠 ', 'short by '],
  ['略低于', 'slightly below'],
  ['接近口径', 'near-fit rule'],
  ['放行', 'released'],
  ['上调一档', 'step up one size'],
  ['与厂家确认', 'confirm with the factory'],
  ['未填', 'not given: '],
  ['η丝杠', 'eta_screw'],
  ['单缸设计负载', 'design load per cylinder'],
  ['平均推拉力', 'average push/pull force'],
  ['客户年用', 'annual customer travel'],
  ['三相交流电机', 'three-phase AC motor'],
  ['三相异步电动机', 'three-phase induction motor'],
  ['三相', 'three-phase '],
  ['动态载荷', 'dynamic load'],
  ['要求', 'required '],
  ['约 ', 'approx. '],
  ['吨', ' t'],
  ['防护等级', 'protection class'],
  ['防护', 'protection'],
  ['接近口径放行', 'released under the near-fit rule'],
  ['满足使用要求', 'meets the service requirement'],
  ['1.0~1.2 倍内', 'within the 1.0-1.2x band'],
  ['偏差', 'deviation'],
  ['次/日', ' cycles/day'],
  ['日', 'day'],
  ['自锁系数', 'self-locking coefficient'],
  ['总负载推力', 'total thrust'],
  ['单价', 'unit price'],
  ['总价', 'amount'],

  /*

*/
  ['不锈钢SS316', 'stainless steel SS316'],
  ['不锈钢', 'stainless steel'],
  ['滚珠动载荷', 'ball-screw dynamic load'],
  ['滚珠动载', 'ball-screw dynamic load'],
  ['screw参数', 'screw parameters'],
  ['额定静载荷', 'rated static load'],
  ['额定静载', 'rated static load'],
  ['参数', 'parameters'],
  ['输入', 'input '],
  ['行程/速度/寿命要求', 'stroke / speed / life requirement'],
  ['没有可用候选型号', 'no selectable model'],
  ['未知系列', 'unknown series'],
  ['请放宽', 'relax '],
  ['或与厂家技术确认特殊工况', 'or confirm the special duty with the factory'],
  ['电磁制动series', 'brake series'],
  ['电磁制动', 'electromagnetic brake'],
  ['系列铝壳三相异步电机', ' series, aluminium housing three-phase induction motor'],
  ['系列铝壳三相异步电动机', ' series, aluminium housing three-phase induction motor'],
  ['系列铝壳', ' series, aluminium housing '],
  ['铝壳三相异步电机', 'aluminium housing three-phase induction motor'],
  ['铝壳三相异步电动机', 'aluminium housing three-phase induction motor'],
  ['铝壳', 'aluminium housing '],
  ['超功率', 'over power'],
  ['额定超该档最大输入功率', 'rated above the maximum input power of this step'],
  ['价格缺项', 'price missing'],
  ['未满足', 'not met'],
  ['提升力', 'lifting force'],
  ['更大型号', 'a larger model'],
  ['核验', 'check'],
  ['德力', 'Deli'],
  ['可选', 'optional'],
  ['寿命', 'life'],
  ['不足', 'short of'],
  ['档位', 'step'],
);
PHRASE.sort((a, b) => b[0].length - a[0].length);

/*


*/
const SUBRULES = [
  [/超功率（额定超该档最大输入功率 ([\d.]+) kW）/g,
    (m, p1) => 'over power (rated ' + p1 + " kW above this step's maximum input power)"],
  [/（价格缺项：([^）]+)）/g, (m, p1) => ' (price missing: ' + T(p1) + ')'],
  [/——YE3EJ 电磁制动系列[，,]?/g, ' - YE3EJ brake series, '],
  [/价含基座制动器/g, 'price includes the frame-mounted brake'],
  [/（(?:每|按)?\s*([\d.]+)\s*rpm\s*计）/g, '(per $1 rpm)'],
  [/不足 ([\d.]+) 年/g, 'short of $1 years'],
  [/双出轴电机采用地脚安装 B3（两端出轴，不用法兰安装）/g,
    'the double-shaft motor uses B3 foot mounting (shafts at both ends, no flange mount)'],
  [/所有电机（含伺服）配制动器（必选）[，,]?/g, 'all motors (incl. servo) with brake (mandatory), '],
  [/配制动器（本方案必选：([^）]+)）/g,
    (m, p1) => 'motor brake fitted (mandatory for this layout: ' + T(p1) + ')'],
  [/＋超档 ([\d.]+)mm 按 ([\d.]+)→([\d.]+)mm 档差比例折算/g,
    (m, a, b, c) => ', plus ' + a + ' mm above the step prorated on the ' + b + '-' + c + ' mm step difference'],
  [/＋非标每100mm累计/g, ', plus a non-standard length charged per 100 mm'],
];

function subPass(s) {
  let out = s;
  for (const [re, fn] of SUBRULES) out = out.replace(re, fn);
  return out;
}

/*
*/
const PHRASE_MAP = new Map(PHRASE);
const PHRASE_RE = new RegExp(
  PHRASE.map(([zh]) => zh.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');

function phrasePass(s) {
  return s.replace(PHRASE_RE, (m) => PHRASE_MAP.get(m));
}

/**/
function qty(s) {
  return s
    .replace(/(\d+)\s*台/g, '$1 unit(s)')
    .replace(/(\d+)\s*根/g, '$1 pcs')
    .replace(/(\d+)\s*个/g, '$1 pcs');
}

/* English value -> Chinese value accepted by the engine (input side). */
const INPUT_ALIAS = {
  guide: { yes: '有', no: '无', none: '无', 'true': '有', 'false': '无' },
  selflock: { yes: '是', no: '否', true: '是', false: '否' },
  env: { indoor: '室内', outdoor: '室外', cleanroom: '洁净间', normal: '室内常温' },
  sync: { mechanical: '机械', electrical: '电气' },
  layout: {
    h: 'H型布置', 'h-layout': 'H型布置', u: 'U型布置', 'u-layout': 'U型布置',
    u2: 'U2型布置', 'u2-layout': 'U2型布置',
  },
  mounting: { floor: '地脚安装', trunnion: '耳轴安装' },
  encoder: { incremental: '增量型', absolute: '多圈绝对编码器', resolver: '旋转变压器' },
  precision_mm: { none: '无', standard: '0.05' },
  motion: { screw: 'S', nut: 'N' },
  drive: { ac: 'ac3', 'ac3': 'ac3', servo220: 'servo220', servo380: 'servo380', manual: 'hand', hand: 'hand' },
  load_unit: { t: 't', ton: 't', tons: 't', kn: 'kN', n: 'N', kg: 'kg', kgf: 'kgf' },
  lam2_limit: { standard: '标配', none: '无' },
  lam2_ctrl: { none: '不带', included: '带' },
  lam2_fb: { none: '无' },
};

/* Field-label dictionary, used by `--list-fields --lang=en` and by the docs. */
const FIELD_LABELS = {
  load: 'Load',
  load_pull: 'Pull load',
  static_load: 'Static load',
  avg_load: 'Average push/pull load',
  load_unit: 'Load unit',
  load_pull_unit: 'Pull load unit',
  static_load_unit: 'Static load unit',
  avg_load_unit: 'Average load unit',
  series: 'Series',
  units: 'Number of units',
  custom_units: 'Custom unit count',
  layout: 'Layout',
  motion: 'Motion (screw / nut)',
  stroke_mm: 'Stroke (mm)',
  stroke: 'Stroke (mm)',
  speed_mm_s: 'Speed (mm/s)',
  speed: 'Speed (mm/s)',
  guide: 'Guiding',
  mounting: 'Mounting',
  cycles_per_day: 'Cycles per day',
  hours_per_day: 'Hours per day',
  days_per_year: 'Working days per year',
  drive: 'Drive type',
  servo_brand: 'Servo motor brand',
  life_years: 'Required life (years)',
  precision_mm: 'Repeatability (mm)',
  ambient_temp: 'Ambient temperature (C)',
  env: 'Environment',
  selflock: 'Self-locking required',
  sync: 'Synchronisation',
  platform_L: 'Platform length (mm)',
  platform_W: 'Platform width (mm)',
  special: 'Special requirements',
  input_type: 'Input type',
  input_form: 'Input form',
  shaft_dir: 'Shaft direction',
  input_dir: 'Input direction',
  joint: 'Joint',
  accessories: 'Accessories',
  encoder: 'Encoder',
  ip: 'Protection class',
  install: 'Mounting',
  limit_sw: 'Limit switch',
  temp: 'Temperature (C)',
  gtr_drive: 'GTR drive platform',
  gtr_fb: 'GTR feedback',
};

/* Stroke notes that the cylinder module appends to "stroke N mm mapped to the M mm
   standard step": above-step lengths and non-standard lengths are priced differently,
   so the sentence has to say which one it is. */
function stepNote(s) {
  if (!s) return '';
  return String(s)
    .replace(/＋非标每100mm累计/, ', plus a non-standard length charged per 100 mm')
    .replace(/＋超档 ([\d.]+)mm 按 ([\d.]+)→([\d.]+)mm 档差比例折算/,
      ', plus $1 mm above the step prorated on the $2-$3 mm step difference');
}

function punct(s) {
  return qty(s)
    .replace(/\u3000/g, ' ')
    .replace(/\s*；\s*/g, '; ')
    .replace(/\s*：\s*/g, ': ')
    .replace(/\s*、\s*/g, ', ')
    .replace(/\s*，\s*/g, ', ')
    .replace(/\s*（\s*/g, ' (')
    .replace(/\s*）\s*/g, ') ')
    .replace(/\s*。\s*/g, '. ')
    /*
*/
    /* "trapezoidal screw(stainless steel SS316)" -> keep a space before the bracket */
    .replace(/([A-Za-z])\(/g, '$1 (')
    .replace(/,\s*,/g, ',')
    .replace(/\bSscrew\b/g, 'Screw')
    .replace(/\b([a-z]{4,})\1\b/g, '$1')
    .replace(/ +/g, ' ')
    .trim();
}

const HAS_CJK = /[\u4e00-\u9fff]/;

/* Translate one engine string to English. Unknown fragments are left untouched
   so that `--lint` can report them instead of silently producing Chinglish. */
/* Model strings sometimes carry full-width brackets around an alias
   ("1FT7062-5AF71（1FT7062-5AF71-1CH2）"). Keep the text, normalise the brackets. */
function asciiPunct(s) {
  return String(s == null ? '' : s)
    .replace(/（/g, ' (').replace(/）/g, ') ')
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Debug switch: `select.js --raw` prints the engine strings untouched, which is
   how a new fragment is traced back to the sentence it came from. */
let RAW = false;
function setRaw(v) { RAW = !!v; }

function T(s) {
  if (RAW) return s;
  if (typeof s !== 'string' || !s) return s;
  if (!HAS_CJK.test(s)) return s;
  if (EXACT[s]) return EXACT[s];
  for (const [re, fn] of RULES) {
    const m = re.exec(s);
    if (m) {
      let r = fn(m);
      if (HAS_CJK.test(r)) r = phrasePass(subPass(r));
      return punct(r);
    }
  }
  let out = subPass(s);
  out = phrasePass(out);
  return punct(out);
}

/* Resolve an English option value to the Chinese one the engine expects.
   Chinese input is passed through untouched, so mixed-language input still works. */
function VI(key, val) {
  if (typeof val !== 'string') return val;
  const map = INPUT_ALIAS[key];
  if (!map) return val;
  const k = val.trim().toLowerCase();
  return map[k] !== undefined ? map[k] : val;
}

/* Collect every remaining CJK fragment, for the residue linter. */
function residue(obj, path, acc) {
  acc = acc || [];
  path = path || '';
  if (typeof obj === 'string') {
    if (HAS_CJK.test(obj)) acc.push([path, obj]);
  } else if (Array.isArray(obj)) {
    obj.forEach((v, i) => residue(v, path + '[' + i + ']', acc));
  } else if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach((k) => residue(obj[k], path + '.' + k, acc));
  }
  return acc;
}

module.exports = { T, VI, residue, setRaw, asciiPunct, EXACT, PHRASE, RULES, INPUT_ALIAS, FIELD_LABELS, HAS_CJK };
