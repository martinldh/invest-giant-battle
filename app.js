// ========== Shared Master Configuration ==========
let MASTERS = [];

async function loadMasters() {
    try {
        const resp = await fetch('masters.json', { cache: 'no-store' });
        if (!resp.ok) throw new Error('大师配置加载失败');
        const masters = await resp.json();
        MASTERS = masters.map(m => ({
            id: m.id,
            name: m.name,
            title: m.title,
            photo: m.photo,
            school: m.school,
            schoolLabel: m.school_label || m.schoolLabel,
            catchphrase: m.catchphrase || '',
            desc: m.desc || '',
        }));
    } catch (e) {
        console.error('大师配置加载失败:', e);
        MASTERS = [];
        showInputError('大师配置加载失败，请确认 masters.json 可访问');
    }
}

// ========== Debate Data ==========
const DEBATE_DATA = {
    AAPL: [
        { master: 'buffett', stance: 'bullish', opinion: '看多AAPL。苹果拥有无与伦比的<span class="concept-tag" data-tip="企业难以被竞争对手超越的竞争优势，如品牌、专利、网络效应等">护城河</span>——强大的品牌忠诚度、极高的用户转换成本，以及持续增长的<span class="concept-tag" data-tip="企业在扣除资本支出后剩余的现金">自由现金流</span>。正如我常说："以合理价格买入优秀公司"，苹果正是这样的公司。', rebuttal: { target: '凯瑟琳·伍德', text: '木头姐可能认为苹果的创新增速不足，但在投资中，"不变"比"变化"更珍贵。' } },
        { master: 'cathie', stance: 'neutral', opinion: '我对AAPL持<span class="concept-tag" data-tip="不急于买入也不急于卖出，等待更明确的信号">观望态度</span>。苹果确实伟大，但增长引擎正在减速。iPhone销量增长趋于饱和，Vision Pro短期内难以成为主要收入来源。我更关注AI浪潮中处于核心位置的公司。', rebuttal: { target: '沃伦·巴菲特', text: '巴菲特先生护城河理论没错，但在技术变革期，护城河也可能被颠覆。诺基亚也曾拥有最宽的护城河。' } },
        { master: 'graham', stance: 'neutral', opinion: '从<span class="concept-tag" data-tip="投资价格应显著低于估算的内在价值">安全边际</span>角度来看，AAPL目前估值不便宜。市盈率约28倍，远高于历史均值。虽然公司质量优秀，但"好公司"不等于"好投资"。建议等待更好的价格。', rebuttal: { target: '沃伦·巴菲特', text: '我的学生巴菲特对"合理价格"的定义似乎越来越宽松了。' } },
        { master: 'lynch', stance: 'bullish', opinion: '看多AAPL！这就是典型的<span class="concept-tag" data-tip="消费者日常生活中高频接触的公司">你生活中随处可见的公司</span>。去任何咖啡厅、地铁、办公室，到处都是iPhone。服务业务正在成为新增长引擎，毛利率远超硬件。', rebuttal: { target: '本杰明·格雷厄姆', text: '格雷厄姆老师，有时候"贵"有贵的道理——成长性本身就是价值的一部分。' } },
        { master: 'munger', stance: 'bullish', opinion: '我同意巴菲特的判断。<span class="concept-tag" data-tip="从多个学科汲取思维模型">多元思维</span>告诉我们，苹果的成功不仅是商业问题，更是心理学问题。它创造了"身份认同"，<span class="concept-tag" data-tip="用户因已投入的时间和习惯难以转换到竞品">转换成本</span>是隐性且持久的。', rebuttal: { target: '凯瑟琳·伍德', text: '年轻人，不要因为追求"颠覆"而忽视"持久"的力量。' } },
        { master: 'dalio', stance: 'neutral', opinion: '从<span class="concept-tag" data-tip="将投资分散在不同大类资产中">分散化投资</span>和宏观周期来看，AAPL是优质资产，但不应过度集中。当前利率高位周期，科技股整体面临估值压力。建议作为组合的一部分。', rebuttal: { target: '彼得·林奇', text: '林奇说"买你了解的"没错，但了解一家公司不意味着要重仓它。' } },
        { master: 'fisher', stance: 'bullish', opinion: '苹果拥有我见过的最优秀的管理团队之一。库克将供应链管理做到极致，而服务业务的转型展现了卓越的战略远见。通过我的<span class="concept-tag" data-tip="与供应商、客户、竞争对手交流获取一手信息">闲聊调研</span>方法，苹果的供应商对其依赖度极高，这证明了其生态系统的强大。', rebuttal: { target: '凯瑟琳·伍德', text: '伍德女士关注颠覆，但苹果正在通过AI整合实现自我颠覆。' } },
        { master: 'burry', stance: 'bearish', opinion: '看空AAPL。当前估值蕴含了过多乐观预期。iPhone在中国市场的份额正在被华为蚕食，而AI功能的差异化不足以扭转趋势。从<span class="concept-tag" data-tip="深度分析财务数据寻找被市场错误定价的机会">深度基本面</span>来看，风险收益比不利。', rebuttal: { target: '沃伦·巴菲特', text: '巴菲特先生可能对苹果的"忠诚度"过于迷信了。' } },
        { master: 'damodaran', stance: 'neutral', opinion: '从我DCF模型来看，AAPL当前价格大致合理，但缺乏明显的安全边际。假设未来5年收入增速降至8%，自由现金流增速降至5%，内在价值约在260-280美元区间。建议持有而非加仓。', rebuttal: { target: '彼得·林奇', text: '林奇的"十倍股"逻辑不适用于市值3万亿美元的公司。' } },
        { master: 'ackman', stance: 'bullish', opinion: '看多AAPL。苹果是美国最伟大的公司之一，拥有全球最强的品牌和生态系统。如果苹果将更多现金用于股东回报而非股票回购，股价还有上升空间。这是一个<span class="concept-tag" data-tip="被市场错误定价的优质资产">被市场忽视价值的经典案例</span>。', rebuttal: { target: '迈克尔·布瑞', text: '布瑞总是寻找做空机会，但做空苹果可能是他最糟糕的赌注之一。' } },
        { master: 'druckenmiller', stance: 'neutral', opinion: '从宏观角度，AAPL受美元走强和全球消费疲软的影响。但我关注的是苹果AI战略的执行——如果Apple Intelligence能推动换机潮，这将是一个巨大的催化剂。目前我选择观望，等待更明确的信号。', rebuttal: { target: '瑞·达利欧', text: '达利欧的分散化策略太保守了，在趋势明确时需要果断下注。' } },
        { master: 'taleb', stance: 'neutral', opinion: '苹果是一个<span class="concept-tag" data-tip="在极端事件中容易受损的系统">脆弱系统</span>——过度依赖单一产品（iPhone），供应链集中在中国。虽然目前看似稳定，但尾部风险不容忽视。我建议采用杠铃策略：大部分资金配置在抗风险资产上，小部分押注高凸性机会。', rebuttal: { target: '沃伦·巴菲特', text: '巴菲特的集中持仓策略在黑天鹅事件面前不堪一击。' } }
    ],
    MSFT: [
        { master: 'buffett', stance: 'bullish', opinion: '看多MSFT。微软拥有强大的<span class="concept-tag" data-tip="企业难以被竞争对手超越的竞争优势">护城河</span>——Windows和企业级软件的极高转换成本。与OpenAI的合作展现了卓越的战略眼光。纳德拉让这头大象学会了跳舞。', rebuttal: { target: '瑞·达利欧', text: '达利欧总说要分散，但找到真正优秀的管理层比分散到几十个平庸公司更安全。' } },
        { master: 'cathie', stance: 'bullish', opinion: '强烈看多MSFT！通过Azure和OpenAI合作，微软站在了<span class="concept-tag" data-tip="利用新技术彻底改变行业格局">颠覆性创新</span>的最前沿。Copilot正在重塑办公软件交互方式。未来5年仍有巨大增长空间。', rebuttal: { target: '本杰明·格雷厄姆', text: '在技术革命面前，传统估值框架需要重新审视。' } },
        { master: 'graham', stance: 'bearish', opinion: '从<span class="concept-tag" data-tip="投资价格应显著低于估算的内在价值">安全边际</span>角度，MSFT估值偏高。市盈率超过35倍，蕴含了过多乐观预期。历史上每一次技术狂热最终都会回归基本面。', rebuttal: { target: '凯瑟琳·伍德', text: '年轻人对AI的乐观让我想起互联网泡沫时的场景。' } },
        { master: 'lynch', stance: 'bullish', opinion: '看多MSFT！典型的<span class="concept-tag" data-tip="规模大但仍在持续增长的公司">稳健增长型</span>。产品无处不在——电脑、办公软件、云服务。从"卖软件"转向"卖订阅服务"，意味着持续稳定的经常性收入。', rebuttal: { target: '本杰明·格雷厄姆', text: '订阅制收入让微软现金流可预测性大大提高，增强了安全边际。' } },
        { master: 'munger', stance: 'bullish', opinion: '微软展示了<span class="concept-tag" data-tip="从多个学科汲取思维模型">跨学科思维</span>的威力。纳德拉理解一个关键道理：<span class="concept-tag" data-tip="企业生态系统中各产品相互增强">网络效应</span>比单纯技术领先更重要。Azure+Office+AI的组合创造了极强的协同效应。', rebuttal: { target: '本杰明·格雷厄姆', text: '我尊重格雷厄姆的估值纪律，但"太贵"是相对概念。' } },
        { master: 'dalio', stance: 'neutral', opinion: 'MSFT是优质资产，但更关注宏观环境影响。全球债务高企、地缘政治风险上升。从<span class="concept-tag" data-tip="在不同经济环境下都能表现稳健的策略">全天候策略</span>角度，科技股权重不宜过高。', rebuttal: { target: '沃伦·巴菲特', text: '集中持仓在牛市中表现优异，但系统性风险面前分散化才是王道。' } },
        { master: 'fisher', stance: 'bullish', opinion: '纳德拉是我见过最出色的CEO之一。他将微软从封闭走向开放，从产品走向服务。通过<span class="concept-tag" data-tip="与供应商、客户交流获取一手信息">闲聊调研</span>，企业客户对Azure的依赖度正在快速加深，这是极强的粘性指标。', rebuttal: { target: '纳西姆·塔勒布', text: '塔勒布担心的尾部风险在微软身上并不显著。' } },
        { master: 'burry', stance: 'bearish', opinion: '看空MSFT。AI投资回报的不确定性被严重低估。微软在AI基础设施上的巨额资本支出可能在未来几个季度拖累利润率。市场对Copilot的收入预期过于乐观。', rebuttal: { target: '凯瑟琳·伍德', text: '伍德女士和微软都在赌AI，但赌注大小和赔率需要重新计算。' } },
        { master: 'damodaran', stance: 'neutral', opinion: 'MSFT的估值已经充分反映了AI带来的增长预期。我的模型显示，要支撑当前价格，需要Azure保持25%以上的增速至少3年。这是可能的，但并非确定的。建议持有。', rebuttal: { target: '沃伦·巴菲特', text: '巴菲特买入微软是正确的，但现在的价格已经反映了他看到的价值。' } },
        { master: 'ackman', stance: 'bullish', opinion: '看多MSFT。微软的AI战略执行堪称教科书级别。纳德拉的领导力让微软从"错过移动互联网"的阴影中走出，成为AI时代最大的平台公司之一。这是一个值得长期持有的标的。', rebuttal: { target: '迈克尔·布瑞', text: '布瑞的悲观论调忽略了微软强大的 recurring revenue 模式。' } },
        { master: 'druckenmiller', stance: 'bullish', opinion: '我在AI交易中重仓了MSFT。从宏观趋势来看，AI基础设施投资周期才刚刚开始。微软作为最大的云平台之一，将在这波浪潮中持续受益。做对的时候要重仓。', rebuttal: { target: '瑞·达利欧', text: '达利欧的全天候策略在技术革命周期中会错过最大的趋势。' } },
        { master: 'taleb', stance: 'neutral', opinion: '微软是一个相对<span class="concept-tag" data-tip="在极端事件中能保持稳定甚至获益">反脆弱</span>的公司——多元化收入来源、强大的资产负债表、以及AI带来的不对称机会。但政府反垄断监管是一个潜在的尾部风险。', rebuttal: { target: '比尔·阿克曼', text: '阿克曼忽视了监管风险——大型科技公司正面临前所未有的审查。' } }
    ],
    NVDA: [
        { master: 'buffett', stance: 'neutral', opinion: '对NVDA持谨慎态度。虽然英伟达是AI芯片王者，但"好公司"和"好投资"是两回事。当前估值已反映极高增长预期，一旦增速放缓可能大幅回调。我不投资自己看不懂的领域。', rebuttal: { target: '凯瑟琳·伍德', text: '木头姐对NVDA的乐观让我想起2000年的思科。' } },
        { master: 'cathie', stance: 'bullish', opinion: '强烈看多NVDA！英伟达是<span class="concept-tag" data-tip="利用新技术彻底改变行业格局">颠覆性创新</span>的核心受益者。AI算力需求呈指数级增长，CUDA生态建立了强大的开发者网络效应。未来5年仍有3-5倍增长空间。', rebuttal: { target: '沃伦·巴菲特', text: '巴菲特先生，"看不懂"恰恰意味着最大的机会。' } },
        { master: 'graham', stance: 'bearish', opinion: 'NVDA是最危险的标的之一。市盈率超过60倍，<span class="concept-tag" data-tip="投资价格应显著低于估算的内在价值">安全边际</span>几乎为零。芯片行业具有强烈周期性，当前处于超级周期顶部。强烈建议保持距离。', rebuttal: { target: '凯瑟琳·伍德', text: '每一次技术泡沫中都有人说"这次不一样"，但历史上从来没有。' } },
        { master: 'lynch', stance: 'bullish', opinion: '看多NVDA！就像当年投资英特尔——它是AI革命的"卖铲人"。无论哪家公司赢了AI竞赛，都需要英伟达的芯片。典型的<span class="concept-tag" data-tip="快速增长行业中提供关键工具的公司">快速增长型</span>。建议分批建仓。', rebuttal: { target: '本杰明·格雷厄姆', text: 'AI带来的不是普通周期，而是结构性变革。' } },
        { master: 'munger', stance: 'neutral', opinion: '保持<span class="concept-tag" data-tip="不急于买入也不急于卖出">观望</span>。英伟达成功毋庸置疑，但<span class="concept-tag" data-tip="从反面思考问题，先考虑什么会导致失败">反过来想</span>：AMD的追赶、客户自研芯片、地缘政治限制……在如此高估值下，任何负面催化剂都可能引发剧烈调整。', rebuttal: { target: '凯瑟琳·伍德', text: '热情是好事，但投资需要冷静。' } },
        { master: 'dalio', stance: 'neutral', opinion: 'NVDA处于中美科技博弈的焦点。芯片出口管制既是风险也是机遇。从<span class="concept-tag" data-tip="在不同经济环境下都能表现稳健的策略">全天候策略</span>角度，建议配置比例不超过15%。', rebuttal: { target: '凯瑟琳·伍德', text: '集中押注单一因子是危险的。' } },
        { master: 'fisher', stance: 'bullish', opinion: '黄仁勋是当代最杰出的CEO之一。他对技术趋势的判断力令人惊叹——十年前就押注AI。通过<span class="concept-tag" data-tip="与行业参与者交流获取信息">闲聊调研</span>，AI研究人员对CUDA生态的依赖度极高，这种粘性是竞争对手难以复制的。', rebuttal: { target: '本杰明·格雷厄姆', text: '格雷厄姆老师的框架不适用于定义新市场的公司。' } },
        { master: 'burry', stance: 'bearish', opinion: '看空NVDA。这是典型的泡沫形态——估值脱离基本面，散户疯狂涌入，"这次不一样"的叙事盛行。当AI资本支出放缓时，英伟达将面临严重的产能过剩问题。', rebuttal: { target: '凯瑟琳·伍德', text: '伍德女士的估值模型假设了永续高增长，这在历史上从未发生过。' } },
        { master: 'damodaran', stance: 'bearish', opinion: 'NVDA的估值需要极其乐观的假设才能支撑。我的模型显示，要合理化当前价格，需要未来10年收入复合增速超过30%，且利润率维持在60%以上。这在半导体行业几乎不可能。严重高估。', rebuttal: { target: '凯瑟琳·伍德', text: '估值不是不重要，而是你的估值方法可能不适用于范式转换期的公司。' } },
        { master: 'ackman', stance: 'bullish', opinion: '看多NVDA。英伟达在AI芯片领域的垄断地位是真实的。黄仁勋的战略执行力令人钦佩。虽然估值不便宜，但考虑到其增长潜力和市场地位，这是一个值得持有的核心仓位。', rebuttal: { target: '迈克尔·布瑞', text: '布瑞在2008年做空次贷是对的，但做空英伟达可能是错的。' } },
        { master: 'druckenmiller', stance: 'bullish', opinion: 'NVDA是我近年来最大的赢家之一。AI基础设施投资是一个多年期的超级趋势。从宏观来看，全球数据中心资本支出正在加速，英伟达是最大的受益者。趋势明确时要重仓。', rebuttal: { target: '瑞·达利欧', text: '达利欧的分散化会让你错过这个十年最大的投资机会。' } },
        { master: 'taleb', stance: 'bearish', opinion: 'NVDA是一个典型的<span class="concept-tag" data-tip="在极端事件中容易受损的系统">脆弱标的</span>——高度依赖单一产品线（GPU）、少数大客户（ hyperscaler）、以及持续的技术领先。任何技术突破或客户转向自研芯片都可能造成灾难性后果。', rebuttal: { target: '斯坦利·德鲁肯米勒', text: '德鲁肯米勒在趋势交易中是高手，但趋势反转时损失也是最大的。' } }
    ],
    GOOGL: [
        { master: 'buffett', stance: 'bullish', opinion: '看多GOOGL。谷歌拥有互联网最宽的<span class="concept-tag" data-tip="企业难以被竞争对手超越的竞争优势">护城河</span>——搜索垄断地位和YouTube内容生态。当前估值相对合理，市盈率约22倍，在科技巨头中偏低。', rebuttal: { target: '凯瑟琳·伍德', text: '不要低估拥有20年数据积累和全球最强AI团队的公司。' } },
        { master: 'cathie', stance: 'neutral', opinion: '对GOOGL持<span class="concept-tag" data-tip="不急于买入也不急于卖出">观望</span>。谷歌AI实力强大，但组织效率令人担忧。Gemini发布节奏落后于OpenAI，搜索AI转型可能侵蚀核心广告收入。不过Waymo和DeepMind是潜在亮点。', rebuttal: { target: '沃伦·巴菲特', text: '搜索垄断地位在AI时代可能不像您想的那么稳固。' } },
        { master: 'graham', stance: 'bullish', opinion: 'GOOGL是为数不多同时满足"优质公司"和"合理估值"的科技股。市盈率22倍，<span class="concept-tag" data-tip="投资价格应显著低于估算的内在价值">安全边际</span>在科技股中相对充足。资产负债表健康。', rebuttal: { target: '凯瑟琳·伍德', text: '有时候"便宜"是有原因的。' } },
        { master: 'lynch', stance: 'bullish', opinion: '看多GOOGL！典型的<span class="concept-tag" data-tip="消费者日常生活中高频接触的公司">你每天都在用的公司</span>。搜索、YouTube、Gmail、Maps嵌入现代生活每个角落。Google Cloud正在加速增长，这是被低估的故事。', rebuttal: { target: '凯瑟琳·伍德', text: '不要因为追求"下一个大thing"而忽视"已经很大的thing"。' } },
        { master: 'munger', stance: 'bullish', opinion: '谷歌拥有"<span class="concept-tag" data-tip="用户因已投入时间和习惯难以转换到竞品">转换成本护城河</span>"——数十亿用户的搜索习惯和数据积累不是竞争对手能轻易复制的。<span class="concept-tag" data-tip="从反面思考">逆向思维</span>来看，什么能杀死谷歌？目前看不到。', rebuttal: { target: '凯瑟琳·伍德', text: '年轻人总是低估"习惯"的力量。' } },
        { master: 'dalio', stance: 'neutral', opinion: 'GOOGL是一个平衡的选择。兼具成长性和防御性——搜索广告在经济下行时仍能保持韧性，云计算和AI提供增长动力。但反垄断监管风险是最大不确定性。', rebuttal: { target: '沃伦·巴菲特', text: '护城河再宽，也挡不住政府的监管铁锤。' } },
        { master: 'fisher', stance: 'neutral', opinion: '谷歌的研发能力毋庸置疑，但组织效率是隐忧。大型科技公司常见的"大企业病"在谷歌身上有所体现。不过DeepMind的AI突破和Waymo的进展值得关注。建议观望AI搜索转型的效果。', rebuttal: { target: '沃伦·巴菲特', text: '巴菲特可能低估了AI对搜索广告模式的颠覆性影响。' } },
        { master: 'burry', stance: 'bearish', opinion: '看空GOOGL。反垄断诉讼是悬在头顶的达摩克利斯之剑。如果监管机构强制拆分谷歌的广告业务，其盈利能力将大幅削弱。市场对这个尾部风险定价不足。', rebuttal: { target: '沃伦·巴菲特', text: '巴菲特对"护城河"的信仰在政府干预面前不堪一击。' } },
        { master: 'damodaran', stance: 'bullish', opinion: 'GOOGL是被市场低估的科技巨头。我的DCF模型显示内在价值高于当前价格约15-20%。YouTube、Cloud和AI的组合提供了多元增长引擎，而市场只给了它"搜索公司"的估值。', rebuttal: { target: '迈克尔·布瑞', text: '布瑞对反垄断的担忧被夸大了——拆分可能性很低。' } },
        { master: 'ackman', stance: 'bullish', opinion: '看多GOOGL。谷歌是被华尔街错误定价的典型例子。市场过度关注AI对搜索的威胁，而忽视了YouTube、Cloud和Waymo的巨大价值。这是一个<span class="concept-tag" data-tip="被市场错误定价的优质资产">激进投资者的理想标的</span>。', rebuttal: { target: '迈克尔·布瑞', text: '布瑞总是看到负面，但有时候正面因素远大于负面。' } },
        { master: 'druckenmiller', stance: 'neutral', opinion: 'GOOGL的走势取决于AI搜索转型的执行。如果谷歌能成功将AI整合到搜索中而不大幅侵蚀广告收入，股价有上行空间。但我目前选择观望，等待更明确的催化剂。', rebuttal: { target: '比尔·阿克曼', text: '阿克曼的"被低估"论点需要时间验证。' } },
        { master: 'taleb', stance: 'neutral', opinion: '谷歌面临<span class="concept-tag" data-tip="可能造成极端影响的低概率事件">尾部风险</span>——反垄断拆分和AI颠覆。但同时，其多元化业务也提供了一定的反脆弱性。建议小仓位持有，同时通过期权策略对冲下行风险。', rebuttal: { target: '比尔·阿克曼', text: '阿克曼对"被低估"的判断可能忽略了制度性风险。' } }
    ],
    TSLA: [
        { master: 'buffett', stance: 'bearish', opinion: '看空TSLA。特斯拉估值完全依赖极端乐观预期，而汽车制造业本质是低利润、高资本支出行业。我不看好依赖"故事"而非<span class="concept-tag" data-tip="企业真实的盈利能力和现金流">现金流</span>支撑估值的投资。', rebuttal: { target: '凯瑟琳·伍德', text: '木头姐对特斯拉的估值模型假设了太多"如果"。' } },
        { master: 'cathie', stance: 'bullish', opinion: '强烈看多TSLA！特斯拉是<span class="concept-tag" data-tip="利用新技术彻底改变行业格局">颠覆性创新</span>的集大成者——电动汽车、FSD自动驾驶、能源存储、人形机器人Optimus。马斯克正在构建垂直整合的能源和交通生态系统。', rebuttal: { target: '沃伦·巴菲特', text: '用传统汽车公司框架分析特斯拉，就像用马车框架分析福特。' } },
        { master: 'graham', stance: 'bearish', opinion: 'TSLA是最被高估的标的之一。市盈率超过40倍，<span class="concept-tag" data-tip="投资价格应显著低于估算的内在价值">安全边际</span>为负。汽车行业竞争加剧，比亚迪等快速追赶。从价值投资角度应远离。', rebuttal: { target: '凯瑟琳·伍德', text: '当一家公司需要"讲故事"来支撑估值时，就是危险信号。' } },
        { master: 'lynch', stance: 'neutral', opinion: '特斯拉让人纠结。从"<span class="concept-tag" data-tip="规模大但仍在持续增长">快速增长型</span>"角度看增长惊人；但从"周期型"角度看，高库存和价格战令人担忧。建议能承受50%以上波动者小仓位参与。', rebuttal: { target: '沃伦·巴菲特', text: '有时候波动本身就是机会——前提是你真正理解这家公司。' } },
        { master: 'munger', stance: 'bearish', opinion: '我对特斯拉持负面看法。<span class="concept-tag" data-tip="从反面思考问题">反过来想</span>：最大风险是什么？答案是马斯克本人。过度依赖一个精力分散的CEO是巨大治理风险。汽车制造业<span class="concept-tag" data-tip="行业利润率在竞争中持续下降">利润率均值回归</span>不可逆。', rebuttal: { target: '凯瑟琳·伍德', text: '不要把对创始人的崇拜混同于对投资的判断。' } },
        { master: 'dalio', stance: 'neutral', opinion: '特斯拉适合作为组合中的"卫星持仓"（5-10%），不适合核心持仓。从<span class="concept-tag" data-tip="在不同经济环境下都能表现稳健的策略">全天候策略</span>角度，需要不同经济环境下都稳健的资产，而特斯拉与宏观和消费者信心高度相关。', rebuttal: { target: '凯瑟琳·伍德', text: '把30%仓位押注在一只高波动股票上不是投资，是赌博。' } },
        { master: 'fisher', stance: 'neutral', opinion: '特斯拉的技术创新能力毋庸置疑，但马斯克的管理风格是一个问号。同时运营多家颠覆性公司（SpaceX、X、Neuralink）可能导致精力分散。通过<span class="concept-tag" data-tip="与行业参与者交流获取信息">闲聊调研</span>，供应链合作伙伴对特斯拉的订单波动性表示担忧。', rebuttal: { target: '凯瑟琳·伍德', text: '创新能力和管理稳定性是两回事。' } },
        { master: 'burry', stance: 'bearish', opinion: '看空TSLA。这是市场上最典型的泡沫标的之一。估值完全依赖马斯克个人叙事和未来承诺，而非当前基本面。当FSD和Robotaxi的预期落空时，股价将面临大幅回调。', rebuttal: { target: '凯瑟琳·伍德', text: '伍德女士的"2000美元目标价"是我在市场上见过的最不靠谱的估值。' } },
        { master: 'damodaran', stance: 'bearish', opinion: 'TSLA的估值需要一系列极其乐观的假设才能成立。我的模型显示，即使假设FSD在2027年实现完全自动驾驶，且机器人业务贡献10%收入，合理估值也远低于当前价格。严重高估。', rebuttal: { target: '凯瑟琳·伍德', text: '估值不是不重要，而是你的估值方法可能不适用于范式转换期的公司。' } },
        { master: 'ackman', stance: 'neutral', opinion: '特斯拉是一个两极分化的标的。马斯克的才华不可否认，但其不可预测性也是最大风险。我选择观望——当市场情绪极端时，往往不是最佳入场时机。', rebuttal: { target: '凯瑟琳·伍德', text: '伍德女士对特斯拉的信仰令人钦佩，但投资需要更冷静的判断。' } },
        { master: 'druckenmiller', stance: 'neutral', opinion: '特斯拉的走势取决于FSD的进展和Robotaxi的商业化。如果马斯克能兑现承诺，股价有巨大上行空间。但目前不确定性太高，我选择等待更明确的催化剂。', rebuttal: { target: '瑞·达利欧', text: '达利欧的保守策略会错过特斯拉的爆发性机会。' } },
        { master: 'taleb', stance: 'bearish', opinion: '特斯拉是一个极度<span class="concept-tag" data-tip="在极端事件中容易受损的系统">脆弱</span>的标的——过度依赖一个不可预测的CEO、单一产品（Model 3/Y贡献大部分收入）、以及尚未兑现的技术承诺。杠铃策略中，我不会把资金放在这一端。', rebuttal: { target: '凯瑟琳·伍德', text: '伍德女士把"信念"当成了"投资策略"。' } }
    ],
    QQQ: [
        { master: 'buffett', stance: 'neutral', opinion: '对QQQ持<span class="concept-tag" data-tip="不急于买入也不急于卖出">谨慎态度</span>。重仓科技巨头，集中度过高——前十大持仓占比超50%。我更倾向于精选个股而非买入指数。', rebuttal: { target: '瑞·达利欧', text: '达利欧的分散化理念我认同，但QQQ的"分散"只是科技股内部的分散。' } },
        { master: 'cathie', stance: 'bullish', opinion: '看多QQQ！纳斯达克100集中了全球最具<span class="concept-tag" data-tip="利用新技术彻底改变行业格局">颠覆性创新</span>能力的公司。AI革命正在加速，QQQ中的公司是核心推动者。从5-10年维度看有望带来显著超额收益。', rebuttal: { target: '沃伦·巴菲特', text: '有时候"集中"反而是优势——押注在最优秀的公司上。' } },
        { master: 'graham', stance: 'bearish', opinion: 'QQQ估值令人担忧。纳斯达克100市盈率超过28倍，远高于历史均值。<span class="concept-tag" data-tip="投资价格应显著低于估算的内在价值">安全边际</span>不足。建议考虑更广泛的指数或等待科技股估值回归理性。', rebuttal: { target: '凯瑟琳·伍德', text: '纳斯达克在2000年也曾"集中了最优秀的公司"。' } },
        { master: 'lynch', stance: 'bullish', opinion: '看多QQQ！对于大多数投资者来说，指数基金比选个股更明智。QQQ包含了你<span class="concept-tag" data-tip="日常生活中每天都在用的公司">日常生活中用的公司</span>——苹果、微软、谷歌、亚马逊。长期持有就是投资美国科技行业的未来。', rebuttal: { target: '本杰明·格雷厄姆', text: '对于普通投资者，"时间"比"价格"更重要。' } },
        { master: 'munger', stance: 'neutral', opinion: 'QQQ合理，但当所有人都涌向同一方向时，往往意味着风险在积累。科技股拥挤度极高，任何宏观冲击都可能引发踩踏。建议分批建仓，不要在"AI兴奋期"顶部一次性买入。', rebuttal: { target: '凯瑟琳·伍德', text: '群体行为短期内可能是正确的，但长期均值回归是铁律。' } },
        { master: 'dalio', stance: 'neutral', opinion: '从<span class="concept-tag" data-tip="在不同经济环境下都能表现稳健的策略">全天候策略</span>角度，QQQ只代表"经济增长+科技"因子。真正分散的组合需要增长因子（QQQ）、价值因子（DIA）、通胀保护（TIP）和安全资产（TLT）。建议QQQ占比不超过30-40%。', rebuttal: { target: '凯瑟琳·伍德', text: '全仓科技股在牛市中你是天才，在熊市中你是烈士。' } },
        { master: 'fisher', stance: 'bullish', opinion: 'QQQ中的公司大多拥有优秀的管理团队和强大的市场地位。通过<span class="concept-tag" data-tip="与行业参与者交流获取信息">闲聊调研</span>，这些公司的客户粘性和创新投入都在持续增加。对于不想花时间选股的投资者，QQQ是最佳选择之一。', rebuttal: { target: '本杰明·格雷厄姆', text: '格雷厄姆老师，指数投资的本质是相信美国科技行业的长期前景。' } },
        { master: 'burry', stance: 'bearish', opinion: '看空QQQ。当前科技股的估值和拥挤度让我想起2000年。当AI投资回报不及预期时，整个板块将面临同步回调。集中度风险被严重低估。', rebuttal: { target: '凯瑟琳·伍德', text: '伍德女士认为"这次不一样"，但历史告诉我们每次都一样。' } },
        { master: 'damodaran', stance: 'neutral', opinion: 'QQQ的估值处于历史高位区间。我的分析显示，纳斯达克100的预期回报率已降至个位数。对于长期投资者，建议降低预期并考虑分散到其他板块。', rebuttal: { target: '彼得·林奇', text: '林奇的"长期持有"策略在估值过高时需要调整。' } },
        { master: 'ackman', stance: 'bullish', opinion: '看多QQQ。美国科技公司的基本面是几十年来最强的——现金流充沛、利润率高、AI投资回报可期。虽然估值不便宜，但质量值得溢价。', rebuttal: { target: '迈克尔·布瑞', text: '布瑞总是预期崩溃，但美国科技的基本面比他想象的更强。' } },
        { master: 'druckenmiller', stance: 'neutral', opinion: 'QQQ代表了一个明确的宏观趋势——AI投资周期。趋势还在继续，但需要关注利率走向和通胀数据。如果美联储转向宽松，科技股还有上行空间。目前维持中性。', rebuttal: { target: '瑞·达利欧', text: '达利欧的分散化在趋势明确时是次优选择。' } },
        { master: 'taleb', stance: 'neutral', opinion: 'QQQ是一个<span class="concept-tag" data-tip="在极端事件中容易受损的系统">脆弱组合</span>——高度集中于科技板块，与宏观经济和利率高度相关。建议采用杠铃策略：大部分资金配置在抗风险资产上，小部分通过QQQ参与科技成长。', rebuttal: { target: '凯瑟琳·伍德', text: '全仓QQQ在黑天鹅事件面前将损失惨重。' } }
    ]
};

// ========== State ==========
let isDebating = false;
let currentDebateTicker = '';
const PENDING_OPINION_TEXT = '观点生成中，请稍后刷新本条结果。';
const MASTER_CARD_RUNTIME = new Map();

const COMPANY_DIRECTORY = [
    { ticker: 'AAPL', name: 'Apple', aliases: ['apple', 'apple inc', '苹果'], logo: 'https://logo.clearbit.com/apple.com' },
    { ticker: 'MSFT', name: 'Microsoft', aliases: ['microsoft', 'microsoft corporation', '微软'], logo: 'https://logo.clearbit.com/microsoft.com' },
    { ticker: 'NVDA', name: 'NVIDIA', aliases: ['nvidia', 'nvidia corporation', '英伟达', '英偉達'], logo: 'https://logo.clearbit.com/nvidia.com' },
    { ticker: 'GOOGL', name: 'Alphabet', aliases: ['google', 'alphabet', 'alphabet inc', '谷歌'], logo: 'https://logo.clearbit.com/abc.xyz' },
    { ticker: 'TSLA', name: 'Tesla', aliases: ['tesla', 'tesla inc', '特斯拉'], logo: 'https://logo.clearbit.com/tesla.com' },
    { ticker: 'QQQ', name: 'Invesco QQQ', aliases: ['qqq', 'invesco qqq', 'nasdaq 100', '纳斯达克100'], logo: 'https://logo.clearbit.com/invesco.com' },
    { ticker: 'AMZN', name: 'Amazon', aliases: ['amazon', 'amazon.com', '亚马逊'], logo: 'https://logo.clearbit.com/amazon.com' },
    { ticker: 'META', name: 'Meta', aliases: ['meta', 'facebook', 'meta platforms'], logo: 'https://logo.clearbit.com/meta.com' },
    { ticker: 'AMD', name: 'AMD', aliases: ['amd', 'advanced micro devices'], logo: 'https://logo.clearbit.com/amd.com' },
    { ticker: 'NFLX', name: 'Netflix', aliases: ['netflix', '奈飞'], logo: 'https://logo.clearbit.com/netflix.com' },
    { ticker: '0700:HKEX', name: 'Tencent', aliases: ['0700', '0700.hk', '0700:hkex', 'tencent', '腾讯'], logo: 'https://logo.clearbit.com/tencent.com' },
    { ticker: '9988:HKEX', name: 'Alibaba', aliases: ['9988', '9988.hk', '9988:hkex', 'alibaba hk', '阿里巴巴'], logo: 'https://logo.clearbit.com/alibabagroup.com' },
];

// ========== Functions ==========
function quickPick(ticker) {
    document.getElementById('tickerInput').value = String(ticker || '').trimStart();
    updateInputLogoPreview();
    document.getElementById('tickerInput').focus();
}
function toggleSidebar() {
    document.getElementById('sidebarOverlay').classList.toggle('show');
    document.getElementById('sidebar').classList.toggle('show');
}
function renderMasterList() {
    document.getElementById('masterList').innerHTML = MASTERS.map(m => `
        <div class="master-list-item">
            <div class="master-list-avatar"><img src="${m.photo}" alt="${m.name}" onerror="this.parentElement.innerHTML='${m.name[0]}'"></div>
            <div class="master-list-info">
                <div class="master-list-name">${m.name}</div>
                <div class="master-list-school">${m.schoolLabel} · ${m.title.split('·')[0].trim()}</div>
                <div class="master-list-desc">${m.desc}</div>
            </div>
        </div>
    `).join('');
}
function validateInput(ticker) {
    if (!ticker || !ticker.trim()) return { valid: false, msg: '请输入公司名或标的代码' };
    const raw = ticker.trim();
    const company = findCompanyMatch(raw);
    if (company) return { valid: true, ticker: company.ticker };

    const normalizedTicker = raw.toUpperCase();
    if (/^\d{4,5}$/.test(normalizedTicker)) return { valid: true, ticker: `${normalizedTicker}:HKEX` };
    if (/^\d{4,5}\.HK$/.test(normalizedTicker)) return { valid: true, ticker: normalizedTicker.replace('.HK', ':HKEX') };
    if (!/^[A-Z0-9.:-]+$/.test(normalizedTicker)) return { valid: false, msg: '未识别该公司，请输入股票代码或常见公司名' };
    if (normalizedTicker.length > 20) return { valid: false, msg: '标的代码长度不能超过20个字符' };
    return { valid: true, ticker: normalizedTicker };
}
function normalizeCompanyQuery(value) {
    return (value || '').trim().toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ');
}
function findCompanyMatch(value) {
    const query = normalizeCompanyQuery(value);
    if (!query) return null;
    return COMPANY_DIRECTORY.find(company => {
        const names = [company.ticker, company.name, ...company.aliases].map(normalizeCompanyQuery);
        return names.includes(query);
    }) || null;
}
function findCompanySuggestion(value) {
    const query = normalizeCompanyQuery(value);
    if (!query) return null;
    return COMPANY_DIRECTORY.find(company => {
        const names = [company.ticker, company.name, ...company.aliases].map(normalizeCompanyQuery);
        return names.some(name => name.startsWith(query));
    }) || null;
}
function updateInputLogoPreview() {
    const input = document.getElementById('tickerInput');
    normalizeTickerInputValue(input);
    const wrapper = input.closest('.input-wrapper');
    const preview = document.getElementById('inputLogoPreview');
    wrapper.classList.remove('has-logo');
    preview.innerHTML = '';
}
function showInputError(msg) {
    const el = document.getElementById('inputError');
    el.textContent = '⚠ ' + msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseLooseJsonObject(text) {
    if (typeof text !== 'string') return null;
    const trimmed = text.trim();
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
    try {
        return JSON.parse(trimmed);
    } catch (_) {
        try {
            const normalized = trimmed
                .replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":')
                .replace(/:\s*'([^']*)'/g, ': "$1"')
                .replace(/\n/g, '\\n');
            return JSON.parse(normalized);
        } catch (_) {
            return null;
        }
    }
}

function normalizeBackendEntry(entry) {
    const next = { ...entry };
    const parsed = parseLooseJsonObject(next.opinion);
    if (parsed && typeof parsed === 'object') {
        if (typeof parsed.opinion === 'string' && parsed.opinion.trim()) {
            next.opinion = parsed.opinion;
        }
        if (!next.rebuttal && typeof parsed.rebuttal === 'string' && parsed.rebuttal.trim()) {
            next.rebuttal = {
                target: typeof parsed.rebuttal_target === 'string' ? parsed.rebuttal_target : '',
                text: parsed.rebuttal,
            };
        }
        if (typeof parsed.stance === 'string' && ['bullish', 'bearish', 'neutral'].includes(parsed.stance.toLowerCase())) {
            next.stance = parsed.stance.toLowerCase();
        }
    }
    return next;
}

function extractDisplayTextFromJsonLike(rawText, preferredKey) {
    if (typeof rawText !== 'string') return rawText;
    const parsed = parseLooseJsonObject(rawText);
    if (!parsed || typeof parsed !== 'object') return rawText;

    const preferred = parsed[preferredKey];
    if (typeof preferred === 'string' && preferred.trim()) return preferred;

    for (const key of ['opinion', 'rebuttal', 'text', 'message']) {
        const value = parsed[key];
        if (typeof value === 'string' && value.trim()) return value;
    }
    return rawText;
}

function extractFieldByKeyHeuristic(rawText, key, nextKeys = []) {
    if (typeof rawText !== 'string') return null;
    const src = decodePotentialHtmlEntities(rawText).replace(/<br\s*\/?>/gi, '\n');
    const q = '(?:"|\'|&quot;)';
    const keyRegex = new RegExp(`${q}${key}${q}\\s*:\\s*`, 'i');
    const match = keyRegex.exec(src);
    if (!match) return null;

    let start = match.index + match[0].length;
    while (src[start] === ' ' || src[start] === '\n') start++;
    const quote = src[start] === '"' || src[start] === "'" ? src[start] : null;
    if (quote) start++;

    let end = src.length;
    for (const nextKey of nextKeys) {
        const nextRegex = new RegExp(`,\\s*${q}${nextKey}${q}\\s*:`, 'ig');
        nextRegex.lastIndex = start;
        const nextMatch = nextRegex.exec(src);
        if (nextMatch) end = Math.min(end, nextMatch.index);
    }
    if (end === src.length) {
        const closeBrace = src.lastIndexOf('}');
        if (closeBrace > start) end = closeBrace;
    }

    let value = src.slice(start, end).trim();
    if (quote && value.endsWith(quote)) value = value.slice(0, -1);
    value = value.replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
    return value || null;
}

function decodePotentialHtmlEntities(value) {
    if (typeof value !== 'string') return '';
    if (!/[&][a-z#0-9]+;|&#\d+;|&#x[a-f0-9]+;/i.test(value)) return value;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
}

function stripHtmlTags(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/<[^>]+>/g, '');
}

function extractQuotedValueAfterKey(source, key) {
    if (typeof source !== 'string') return null;
    const q = /["']/.source;
    const keyRegex = new RegExp(`${q}${key}${q}\\s*:\\s*`, 'i');
    const match = keyRegex.exec(source);
    if (!match) return null;

    let i = match.index + match[0].length;
    while (i < source.length && /\s/.test(source[i])) i++;
    const quote = source[i];
    if (quote !== '"' && quote !== "'") return null;
    i += 1;

    let out = '';
    let escaped = false;
    for (; i < source.length; i++) {
        const ch = source[i];
        if (escaped) {
            out += ch;
            escaped = false;
            continue;
        }
        if (ch === '\\') {
            escaped = true;
            continue;
        }
        if (ch === quote) break;
        out += ch;
    }
    return out.trim() || null;
}

function sanitizeDisplayLayerEntry(entry) {
    const next = { ...entry };
    next.opinion = extractDisplayTextFromJsonLike(next.opinion, 'opinion');
    const decodedOpinion = decodePotentialHtmlEntities(next.opinion);
    if (typeof decodedOpinion === 'string' && /^\s*\{[\s\S]*(["']|&quot;)opinion(["']|&quot;)\s*:/.test(decodedOpinion)) {
        const extractedOpinion = extractFieldByKeyHeuristic(next.opinion, 'opinion', ['rebuttal_target', 'rebuttal', 'stance']);
        if (extractedOpinion) next.opinion = extractedOpinion;
    }
    if (next.rebuttal && typeof next.rebuttal === 'object') {
        next.rebuttal = {
            ...next.rebuttal,
            text: extractDisplayTextFromJsonLike(next.rebuttal.text, 'rebuttal'),
        };
        const decodedRebuttal = decodePotentialHtmlEntities(next.rebuttal.text);
        if (typeof decodedRebuttal === 'string' && /^\s*\{[\s\S]*(["']|&quot;)rebuttal(["']|&quot;)\s*:/.test(decodedRebuttal)) {
            const extractedRebuttal = extractFieldByKeyHeuristic(next.rebuttal.text, 'rebuttal', ['stance', 'opinion', 'rebuttal_target']);
            if (extractedRebuttal) next.rebuttal.text = extractedRebuttal;
        }
    }

    if (typeof decodedOpinion === 'string' && /^\s*\{[\s\S]*(["']|&quot;)(stance|opinion|rebuttal_target|rebuttal)(["']|&quot;)\s*:/.test(decodedOpinion)) {
        const forceOpinion = extractFieldByKeyHeuristic(next.opinion, 'opinion', ['rebuttal_target', 'rebuttal', 'stance']);
        next.opinion = forceOpinion || '观点生成中，请稍后刷新本条结果。';
    }
    if (next.rebuttal && typeof next.rebuttal.text === 'string') {
        const decodedRebuttal = decodePotentialHtmlEntities(next.rebuttal.text);
        if (/^\s*\{[\s\S]*(["']|&quot;)(stance|opinion|rebuttal_target|rebuttal)(["']|&quot;)\s*:/.test(decodedRebuttal)) {
            const forceRebuttal = extractFieldByKeyHeuristic(next.rebuttal.text, 'rebuttal', ['stance', 'opinion', 'rebuttal_target']);
            next.rebuttal.text = forceRebuttal || '';
        }
    }

    return next;
}

function zeroToleranceStripJsonEnvelope(text, preferredKey = 'opinion') {
    if (typeof text !== 'string') return '';
    const raw = text.trim();
    const decoded = decodePotentialHtmlEntities(raw);
    const plain = stripHtmlTags(decoded);
    const looksLikeEnvelope = /^\s*\{[\s\S]*(["']|&quot;)(stance|opinion|rebuttal_target|rebuttal)(["']|&quot;)\s*:/.test(decoded);
    const looksLikeEnvelopePlain = /^\s*\{[\s\S]*["'](stance|opinion|rebuttal_target|rebuttal)["']\s*:/.test(plain);
    if (!looksLikeEnvelope && !looksLikeEnvelopePlain) return text;

    const extracted = extractQuotedValueAfterKey(plain, preferredKey)
        || extractQuotedValueAfterKey(plain, 'opinion')
        || extractQuotedValueAfterKey(plain, 'rebuttal')
        || extractFieldByKeyHeuristic(plain, preferredKey, ['rebuttal_target', 'rebuttal', 'stance'])
        || extractFieldByKeyHeuristic(plain, 'opinion', ['rebuttal_target', 'rebuttal', 'stance'])
        || extractFieldByKeyHeuristic(plain, 'rebuttal', ['stance', 'opinion', 'rebuttal_target']);
    return extracted || '观点生成中，请稍后刷新本条结果。';
}

function resolveLogoCandidates(data) {
    const ticker = (data?.ticker || '').toUpperCase();
    const tickerBase = ticker.split(':')[0];
    const company = COMPANY_DIRECTORY.find(c => c.ticker === ticker);
    const fallbackDomainByTicker = {
        AAPL: 'apple.com',
        MSFT: 'microsoft.com',
        NVDA: 'nvidia.com',
        GOOGL: 'abc.xyz',
        GOOG: 'abc.xyz',
        TSLA: 'tesla.com',
        QQQ: 'invesco.com',
        AMZN: 'amazon.com',
        META: 'meta.com',
        AMD: 'amd.com',
        NFLX: 'netflix.com',
    };
    const domain = fallbackDomainByTicker[ticker] || fallbackDomainByTicker[tickerBase];
    const extraByTicker = {
        AAPL: 'https://cdn.simpleicons.org/apple/000000',
    };
    return [
        data?.logo,
        company?.logo,
        domain ? `https://logo.clearbit.com/${domain}` : null,
        extraByTicker[ticker] || extraByTicker[tickerBase] || null,
    ].filter(Boolean);
}

function buildStockLogoImg(data) {
    const candidates = resolveLogoCandidates(data);
    if (!candidates.length) return '';

    const encoded = JSON.stringify(candidates).replace(/"/g, '&quot;');
    return `<img class="stock-logo" src="${candidates[0]}" alt="${data.ticker}" data-ticker="${data.ticker || ''}" data-logo-candidates="${encoded}" data-logo-index="0" onerror="
        try {
            const list = JSON.parse(this.dataset.logoCandidates || '[]');
            const next = Number(this.dataset.logoIndex || '0') + 1;
            if (next < list.length) {
                this.dataset.logoIndex = String(next);
                this.src = list[next];
                return;
            }
        } catch (e) {}
        const ticker = (this.dataset.ticker || '?').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0,4) || '?';
        this.outerHTML = '<span class=&quot;stock-logo-fallback&quot; aria-label=&quot;' + ticker + ' logo fallback&quot;>' + ticker[0] + '</span>';
    ">`;
}

function normalizeTickerInputValue(inputEl) {
    if (!inputEl) return;
    const cleaned = String(inputEl.value || '').replace(/^\s+/, '');
    if (cleaned !== inputEl.value) inputEl.value = cleaned;
}

// ========== Stock Data via Backend API ==========
async function fetchStockData(ticker) {
    const bar = document.getElementById('stockInfoBar');
    const content = document.getElementById('stockInfoContent');
    bar.classList.add('show');
    content.innerHTML = '<div class="stock-loading">📊 正在获取股价数据...</div>';

    try {
        const resp = await fetch(`${API_BASE}/api/stock/${encodeURIComponent(ticker)}`);
        if (!resp.ok) throw new Error('API请求失败');
        const result = await resp.json();
        if (!result.success) throw new Error(result.detail || '获取数据失败');

        const data = result.data;
        const isUp = data.day_change >= 0;
        const changeClass = isUp ? 'up' : 'down';
        const arrow = isUp ? '▲' : '▼';
        const mUp = data.month_change_pct >= 0;
        const yUp = data.year_change_pct >= 0;

        content.innerHTML = `
            <div class="stock-info-top">
                <div class="stock-info-left">
                    ${buildStockLogoImg(data)}
                    <div>
                        <span class="stock-ticker">${data.ticker}</span>
                        <span class="stock-name">${data.name || ''}</span>
                    </div>
                </div>
                <div style="text-align:right">
                    <div class="stock-price-big ${changeClass}">${data.currency} ${data.current_price.toFixed(2)}</div>
                    <div class="stock-price-change ${changeClass}">${arrow} ${Math.abs(data.day_change_pct).toFixed(2)}% 今日</div>
                </div>
            </div>
            <div class="stock-info-details">
                <div class="stock-detail-item">
                    <span class="stock-detail-label">最近交易日</span>
                    <span class="stock-detail-value">${data.last_updated}</span>
                </div>
                <div class="stock-detail-item">
                    <span class="stock-detail-label">当日最高</span>
                    <span class="stock-detail-value">${data.currency} ${data.day_high.toFixed(2)}</span>
                </div>
                <div class="stock-detail-item">
                    <span class="stock-detail-label">当日最低</span>
                    <span class="stock-detail-value">${data.currency} ${data.day_low.toFixed(2)}</span>
                </div>
                <div class="stock-detail-item">
                    <span class="stock-detail-label">成交量</span>
                    <span class="stock-detail-value">${(data.volume / 1e6).toFixed(1)}M</span>
                </div>
                <div class="stock-detail-item">
                    <span class="stock-detail-label">52周最高</span>
                    <span class="stock-detail-value">${data.currency} ${data.fifty_two_week_high.toFixed(2)}</span>
                </div>
                <div class="stock-detail-item">
                    <span class="stock-detail-label">52周最低</span>
                    <span class="stock-detail-value">${data.currency} ${data.fifty_two_week_low.toFixed(2)}</span>
                </div>
                <div class="stock-detail-item">
                    <span class="stock-detail-label">近1月涨跌</span>
                    <span class="stock-detail-value ${mUp ? 'up' : 'down'}">${mUp ? '▲' : '▼'} ${Math.abs(data.month_change_pct).toFixed(2)}%</span>
                </div>
                <div class="stock-detail-item">
                    <span class="stock-detail-label">近1年涨跌（同比）</span>
                    <span class="stock-detail-value ${yUp ? 'up' : 'down'}">${yUp ? '▲' : '▼'} ${Math.abs(data.year_change_pct).toFixed(2)}%</span>
                </div>
            </div>
            <div class="stock-data-source">数据来源：<a href="https://twelvedata.com/" target="_blank">Twelve Data</a> · 数据仅供参考</div>
        `;
    } catch (e) {
        content.innerHTML = `<div class="stock-loading">⚠ 无法获取 ${ticker} 的真实数据。请确保后端服务已启动。</div>`;
    }
}

// ========== Configuration ==========
const PROD_API_BASE = 'https://invest-giant-battle.onrender.com';
const HEALTHCHECK_TIMEOUT_MS = 12000;
const HEALTHCHECK_RETRIES = 3;
const HEALTHCHECK_RETRY_DELAY_MS = 1500;
const API_BASE = (() => {
    const override = window.__API_BASE__ || document.documentElement?.dataset?.apiBase;
    if (override) return String(override).replace(/\/+$/, '');

    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
    return isLocal ? 'http://localhost:8000' : PROD_API_BASE;
})();
let useBackend = false;

// ========== Backend API ==========
async function checkBackend() {
    const statusEl = document.getElementById('backendStatus');
    for (let attempt = 1; attempt <= HEALTHCHECK_RETRIES; attempt++) {
        try {
            const resp = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(HEALTHCHECK_TIMEOUT_MS) });
            if (resp.ok) {
                useBackend = true;
                console.log('✅ 后端服务已连接');
                if (statusEl) statusEl.innerHTML = '· <span style="color:var(--bullish)">✅ 后端已连接（AI动态评论模式）</span>';
                return true;
            }
        } catch (e) {
            if (attempt < HEALTHCHECK_RETRIES) {
                if (statusEl) statusEl.innerHTML = `· <span style="color:var(--neutral)">⏳ 正在唤醒后端服务...（${attempt}/${HEALTHCHECK_RETRIES}）</span>`;
                await sleep(HEALTHCHECK_RETRY_DELAY_MS);
                continue;
            }
        }
    }
    console.log('⚠️ 后端服务未启动，使用静态数据模式');
    useBackend = false;
    if (statusEl) statusEl.innerHTML = '· <span style="color:var(--neutral)">⚠️ 后端未启动（静态演示模式）</span>';
    return false;
}

// ========== Debate ==========
async function startDebate() {
    if (isDebating) return;
    if (!MASTERS.length) {
        showInputError('大师配置尚未加载完成，请稍后重试');
        return;
    }
    const inputEl = document.getElementById('tickerInput');
    normalizeTickerInputValue(inputEl);
    const validation = validateInput(inputEl.value);
    if (!validation.valid) { showInputError(validation.msg); return; }
    const ticker = validation.ticker;
    currentDebateTicker = ticker;
    MASTER_CARD_RUNTIME.clear();

    if (!useBackend && !DEBATE_DATA[ticker]) {
        showInputError(`当前标的 ${ticker} 暂无数据。启动后端服务后可支持任意标的。`);
        return;
    }

    isDebating = true;
    const btn = document.getElementById('btnDebate');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span><span>辩论进行中...</span>';

    document.getElementById('loadingSection').classList.add('show');
    document.getElementById('debateSection').classList.remove('show');
    document.getElementById('summarySection').classList.remove('show');
    document.getElementById('resetSection').classList.remove('show');
    document.getElementById('cardsBullish').innerHTML = '';
    document.getElementById('cardsBearish').innerHTML = '';
    document.getElementById('cardsNeutral').innerHTML = '';

    const avatars = MASTERS.slice(0, 6);
    document.getElementById('loadingAvatars').innerHTML = avatars.map(m =>
        `<div class="loading-avatar"><img src="${m.photo}" alt="${m.name}" onerror="this.style.display='none'"></div>`
    ).join('');

    try {
        if (useBackend) {
            await startDebateWithBackend(ticker);
        } else {
            await startDebateStatic(ticker);
        }
    } catch (e) {
        console.error('辩论出错:', e);
        showInputError('辩论过程中出现错误，请重试');
    }

    isDebating = false;
    btn.disabled = false;
    btn.innerHTML = '<span>⚔</span><span>发起大师辩论</span>';
}

// ========== Backend Mode ==========
async function startDebateWithBackend(ticker) {
    const resp = await fetch(`${API_BASE}/api/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
    });

    if (!resp.ok) throw new Error('后端请求失败');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let allEntries = [];
    let cardIndex = 0;

    let loadingHidden = false;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const event = JSON.parse(line);

                if (event.type === 'stock_data') {
                    renderStockInfoFromBackend(event.data);
                }

                if (event.type === 'generating') {
                    document.getElementById('loadingText').textContent = event.message;
                }

                if (event.type === 'progress') {
                    document.getElementById('loadingText').textContent = 
                        `正在生成大师观点... ${event.generated}/${event.total}`;
                }

                if (event.type === 'master_opinion') {
                    if (!loadingHidden) {
                        document.getElementById('loadingSection').classList.remove('show');
                        document.getElementById('debateSection').classList.add('show');
                        loadingHidden = true;
                    }

                    const entryRaw = {
                        master_id: event.master_id,
                        master_name: event.master_name,
                        school: event.school,
                        school_label: event.school_label,
                        stance: event.stance,
                        opinion: event.opinion,
                        rebuttal: event.rebuttal,
                        error: event.error,
                    };
                    const entry = sanitizeDisplayLayerEntry(normalizeBackendEntry(entryRaw));
                    allEntries.push(entry);

                    updateColumnCounts(allEntries);

                    await streamMasterCardFromBackend(entry, cardIndex);
                    cardIndex++;
                    await sleep(300);
                }

                if (event.type === 'error') {
                    showInputError(event.message);
                }

                if (event.type === 'done') {
                    await sleep(500);
                    showSummaryFromBackend(ticker, allEntries);
                    document.getElementById('resetSection').classList.add('show');
                }
            } catch (e) {
                // Skip malformed JSON
            }
        }
    }
}

function renderStockInfoFromBackend(data) {
    const bar = document.getElementById('stockInfoBar');
    const content = document.getElementById('stockInfoContent');
    bar.classList.add('show');

    const isUp = data.day_change >= 0;
    const cls = isUp ? 'up' : 'down';
    const arrow = isUp ? '▲' : '▼';
    const mUp = data.month_change_pct >= 0;
    const yUp = data.year_change_pct >= 0;

    content.innerHTML = `
        <div class="stock-info-top">
            <div class="stock-info-left">
                ${buildStockLogoImg(data)}
                <div>
                    <span class="stock-ticker">${data.ticker}</span>
                    <span class="stock-name">${data.name || ''}</span>
                </div>
            </div>
            <div style="text-align:right">
                <div class="stock-price-big ${cls}">${data.currency} ${data.current_price.toFixed(2)}</div>
                <div class="stock-price-change ${cls}">${arrow} ${Math.abs(data.day_change_pct).toFixed(2)}% 今日</div>
            </div>
        </div>
        <div class="stock-info-details">
            <div class="stock-detail-item"><span class="stock-detail-label">最近交易日</span><span class="stock-detail-value">${data.last_updated}</span></div>
            <div class="stock-detail-item"><span class="stock-detail-label">当日最高</span><span class="stock-detail-value">${data.currency} ${data.day_high.toFixed(2)}</span></div>
            <div class="stock-detail-item"><span class="stock-detail-label">当日最低</span><span class="stock-detail-value">${data.currency} ${data.day_low.toFixed(2)}</span></div>
            <div class="stock-detail-item"><span class="stock-detail-label">成交量</span><span class="stock-detail-value">${(data.volume / 1e6).toFixed(1)}M</span></div>
            <div class="stock-detail-item"><span class="stock-detail-label">52周最高</span><span class="stock-detail-value">${data.currency} ${data.fifty_two_week_high.toFixed(2)}</span></div>
            <div class="stock-detail-item"><span class="stock-detail-label">52周最低</span><span class="stock-detail-value">${data.currency} ${data.fifty_two_week_low.toFixed(2)}</span></div>
            <div class="stock-detail-item"><span class="stock-detail-label">近1月涨跌</span><span class="stock-detail-value ${mUp ? 'up' : 'down'}">${mUp ? '▲' : '▼'} ${Math.abs(data.month_change_pct).toFixed(2)}%</span></div>
            <div class="stock-detail-item"><span class="stock-detail-label">近1年涨跌（同比）</span><span class="stock-detail-value ${yUp ? 'up' : 'down'}">${yUp ? '▲' : '▼'} ${Math.abs(data.year_change_pct).toFixed(2)}%</span></div>
        </div>
        <div class="stock-data-source">数据来源：<a href="https://twelvedata.com/" target="_blank">Twelve Data</a> · AI生成内容仅供参考</div>
    `;
}

function updateColumnCounts(entries) {
    const counts = { bullish: 0, bearish: 0, neutral: 0 };
    entries.forEach(e => counts[e.stance]++);
    document.getElementById('countBullish').textContent = `${counts.bullish} 位大师`;
    document.getElementById('countBearish').textContent = `${counts.bearish} 位大师`;
    document.getElementById('countNeutral').textContent = `${counts.neutral} 位大师`;
}

async function streamMasterCardFromBackend(entry, index) {
    const master = MASTERS.find(m => m.id === entry.master_id) || {
        name: entry.master_name, title: '', photo: '', school: entry.school, schoolLabel: entry.school_label
    };
    const col = entry.stance;
    const container = document.getElementById(col === 'bullish' ? 'cardsBullish' : col === 'bearish' ? 'cardsBearish' : 'cardsNeutral');
    const schoolLabels = { value: '价值派', growth: '成长派', risk: '风控派', macro: '宏观派', activist: '激进派' };

    const card = document.createElement('div');
    card.className = `master-card school-${master.school || entry.school}`;
    const safeOpinionText = zeroToleranceStripJsonEnvelope(entry.opinion, 'opinion');
    const safeRebuttalText = entry.rebuttal?.text
        ? zeroToleranceStripJsonEnvelope(entry.rebuttal.text, 'rebuttal')
        : '';
    const hasPendingOpinion = safeOpinionText.includes(PENDING_OPINION_TEXT) || !!entry.error;

    card.innerHTML = `
        <div class="card-header">
            <div class="master-avatar"><img src="${master.photo || ''}" alt="${master.name}" onerror="this.parentElement.innerHTML='${(master.name || '?')[0]}'"></div>
            <div class="master-info">
                <div class="master-name">${master.name || entry.master_name}</div>
                <div class="master-title">${master.title || ''}</div>
            </div>
            <span class="school-tag ${master.school || entry.school}">${schoolLabels[master.school || entry.school] || entry.school_label}</span>
        </div>
        <div class="card-body">
            <div class="master-opinion"><span class="cursor-blink"></span></div>
            ${entry.rebuttal ? `<div class="rebuttal-box"><span>💬</span> <span class="rebuttal-speaker">${master.name || entry.master_name}</span> 回应 <span class="rebuttal-target">${entry.rebuttal.target || ''}</span>：${safeRebuttalText}</div>` : ''}
            <div class="card-retry ${hasPendingOpinion ? 'show' : ''}">
                <button class="btn-card-retry" type="button">${hasPendingOpinion ? '重试本条' : ''}</button>
                <span class="card-retry-status">${hasPendingOpinion ? '观点生成中，已尝试自动恢复' : ''}</span>
            </div>
        </div>
    `;
    container.appendChild(card);
    await sleep(50);
    card.classList.add('visible');

    const opinionEl = card.querySelector('.master-opinion');
    await streamText(opinionEl, safeOpinionText, 12);

    const rebuttalEl = card.querySelector('.rebuttal-box');
    if (rebuttalEl) rebuttalEl.classList.add('show');

    if (hasPendingOpinion && currentDebateTicker) {
        const runtime = {
            card,
            masterId: entry.master_id,
            ticker: currentDebateTicker,
            retrying: false,
            autoRetried: false,
        };
        MASTER_CARD_RUNTIME.set(`${entry.master_id}-${index}`, runtime);
        const btn = card.querySelector('.btn-card-retry');
        if (btn) {
            btn.addEventListener('click', () => retryMasterCard(runtime, true));
        }
        setTimeout(() => {
            if (!runtime.autoRetried) retryMasterCard(runtime, false);
        }, 7000);
    }
}

function setCardRetryUI(card, stateText = '', loading = false, show = true) {
    const box = card.querySelector('.card-retry');
    const btn = card.querySelector('.btn-card-retry');
    const status = card.querySelector('.card-retry-status');
    if (!box || !btn || !status) return;
    box.classList.toggle('show', show);
    btn.disabled = loading;
    btn.textContent = loading ? '重试中...' : '重试本条';
    status.textContent = stateText;
}

async function retryMasterCard(runtime, manual) {
    if (!runtime || runtime.retrying) return;
    runtime.retrying = true;
    runtime.autoRetried = true;
    setCardRetryUI(runtime.card, manual ? '正在重新生成这位大师的观点...' : '系统自动重试中...', true, true);

    try {
        const resp = await fetch(`${API_BASE}/api/debate/master`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker: runtime.ticker, master_id: runtime.masterId }),
        });
        if (!resp.ok) throw new Error('重试请求失败');
        const result = await resp.json();
        if (!result?.success || !result?.data) throw new Error('重试结果无效');

        const next = sanitizeDisplayLayerEntry(normalizeBackendEntry(result.data));
        const safeOpinionText = zeroToleranceStripJsonEnvelope(next.opinion, 'opinion');
        const stillPending = safeOpinionText.includes(PENDING_OPINION_TEXT) || !!next.error;

        const opinionEl = runtime.card.querySelector('.master-opinion');
        if (opinionEl) await streamText(opinionEl, safeOpinionText, 8);

        const oldRebuttal = runtime.card.querySelector('.rebuttal-box');
        if (oldRebuttal) oldRebuttal.remove();
        if (next.rebuttal?.text) {
            const body = runtime.card.querySelector('.card-body');
            const safeRebuttalText = zeroToleranceStripJsonEnvelope(next.rebuttal.text, 'rebuttal');
            const rebuttalEl = document.createElement('div');
            rebuttalEl.className = 'rebuttal-box show';
            const masterName = runtime.card.querySelector('.master-name')?.textContent || '';
            rebuttalEl.innerHTML = `<span>💬</span> <span class="rebuttal-speaker">${masterName}</span> 回应 <span class="rebuttal-target">${next.rebuttal.target || ''}</span>：${safeRebuttalText}`;
            body.insertBefore(rebuttalEl, body.querySelector('.card-retry'));
        }

        if (stillPending) {
            setCardRetryUI(runtime.card, '本条仍在生成中，请稍后手动再试', false, true);
        } else {
            setCardRetryUI(runtime.card, '', false, false);
        }
    } catch (_) {
        setCardRetryUI(runtime.card, '重试失败，请稍后再试', false, true);
    } finally {
        runtime.retrying = false;
    }
}

function showSummaryFromBackend(ticker, entries) {
    const section = document.getElementById('summarySection');
    const counts = { bullish: 0, bearish: 0, neutral: 0 };
    entries.forEach(e => counts[e.stance]++);

    let verdictStance, verdictText, verdictIcon, verdictDesc;
    if (counts.bullish > counts.bearish && counts.bullish > counts.neutral) {
        verdictStance = 'bullish';
        verdictText = '看多';
        verdictIcon = '📈';
        verdictDesc = `多数大师看好，${counts.bullish} 位看多 vs ${counts.bearish} 位看空`;
    } else if (counts.bearish > counts.bullish && counts.bearish > counts.neutral) {
        verdictStance = 'bearish';
        verdictText = '看空';
        verdictIcon = '📉';
        verdictDesc = `多数大师看空，${counts.bearish} 位看空 vs ${counts.bullish} 位看多`;
    } else {
        verdictStance = 'neutral';
        verdictText = '持有';
        verdictIcon = '⏸';
        verdictDesc = `观点分歧或偏向观望，建议持有观察`;
    }

    document.getElementById('overallVerdict').innerHTML = `
        <div class="overall-verdict ${verdictStance}">
            <div class="verdict-icon">${verdictIcon}</div>
            <div class="verdict-content">
                <span class="verdict-label">综合结论</span>
                <span class="verdict-text">${verdictText}</span>
                <span class="verdict-desc">· ${verdictDesc}</span>
            </div>
        </div>
    `;

    document.getElementById('stanceStats').innerHTML = `
        <div class="stance-stat bullish"><span class="stat-count">${counts.bullish}</span> 位大师看多</div>
        <div class="stance-stat bearish"><span class="stat-count">${counts.bearish}</span> 位大师看空</div>
        <div class="stance-stat neutral"><span class="stat-count">${counts.neutral}</span> 位大师持有</div>
    `;

    const names = (stance) => entries.filter(e => e.stance === stance).map(e => e.master_name);
    let consensus = '';
    if (counts.bullish > counts.bearish && counts.bullish > counts.neutral) {
        consensus = `多数大师（${names('bullish').join('、')}）对${ticker}持乐观态度，认为其具备投资价值。`;
    } else if (counts.bearish > counts.bullish) {
        consensus = `看空声音较强（${names('bearish').join('、')}），主要担忧集中在估值和风险方面。`;
    } else {
        consensus = `大师们对${ticker}存在明显分歧。看多方有${names('bullish').join('、') || '无'}；看空方有${names('bearish').join('、') || '无'}；持有方有${names('neutral').join('、') || '无'}。`;
    }
    consensus += '以上观点由AI基于实时市场数据生成，仅供参考。';
    document.getElementById('summaryConsensus').textContent = consensus;

    let decision = '';
    if (names('bullish').length) decision += `若你倾向积极投资，可重点关注${names('bullish').join('、')}的观点；`;
    if (names('bearish').length) decision += `若担忧风险，${names('bearish').join('、')}的警示值得深思；`;
    if (names('neutral').length) decision += `若不确定，${names('neutral').join('、')}的观望建议或许更适合当前阶段。`;
    decision += '最终决策请结合自身风险承受能力和投资目标综合判断。';
    document.getElementById('summaryDecision').textContent = decision;

    section.classList.add('show');
}

// ========== Static Fallback Mode ==========
async function startDebateStatic(ticker) {
    await Promise.all([fetchStockData(ticker), sleep(2500)]);

    document.getElementById('loadingSection').classList.remove('show');
    document.getElementById('debateSection').classList.add('show');

    const entries = DEBATE_DATA[ticker];
    const groups = { bullish: [], bearish: [], neutral: [] };
    entries.forEach(e => groups[e.stance].push(e));

    document.getElementById('countBullish').textContent = `${groups.bullish.length} 位大师`;
    document.getElementById('countBearish').textContent = `${groups.bearish.length} 位大师`;
    document.getElementById('countNeutral').textContent = `${groups.neutral.length} 位大师`;

    const allCards = [];
    groups.bullish.forEach(e => allCards.push({ ...e, col: 'bullish' }));
    groups.bearish.forEach(e => allCards.push({ ...e, col: 'bearish' }));
    groups.neutral.forEach(e => allCards.push({ ...e, col: 'neutral' }));

    for (let i = 0; i < allCards.length; i++) {
        await streamMasterCard(allCards[i], allCards[i].col, i);
        await sleep(400);
    }

    await sleep(500);
    showSummary(ticker, entries);
    document.getElementById('resetSection').classList.add('show');
}

async function streamMasterCard(entry, col, index) {
    const master = MASTERS.find(m => m.id === entry.master);
    const container = document.getElementById(col === 'bullish' ? 'cardsBullish' : col === 'bearish' ? 'cardsBearish' : 'cardsNeutral');
    const schoolLabels = { value: '价值派', growth: '成长派', risk: '风控派', macro: '宏观派', activist: '激进派' };

    const card = document.createElement('div');
    card.className = `master-card school-${master.school}`;
    card.innerHTML = `
        <div class="card-header">
            <div class="master-avatar"><img src="${master.photo}" alt="${master.name}" onerror="this.parentElement.innerHTML='${master.name[0]}'"></div>
            <div class="master-info">
                <div class="master-name">${master.name}</div>
                <div class="master-title">${master.title}</div>
            </div>
            <span class="school-tag ${master.school}">${schoolLabels[master.school] || master.schoolLabel}</span>
        </div>
        <div class="card-body">
            <div class="master-opinion" id="opinion-${col}-${index}"><span class="cursor-blink"></span></div>
            ${entry.rebuttal ? `<div class="rebuttal-box" id="rebuttal-${col}-${index}"><span>💬</span> <span class="rebuttal-speaker">${master.name}</span> 回应 <span class="rebuttal-target">${entry.rebuttal.target}</span>：${entry.rebuttal.text}</div>` : ''}
        </div>
    `;
    container.appendChild(card);
    await sleep(50);
    card.classList.add('visible');

    const opinionEl = document.getElementById(`opinion-${col}-${index}`);
    await streamText(opinionEl, entry.opinion, 14);

    if (entry.rebuttal) {
        document.getElementById(`rebuttal-${col}-${index}`).classList.add('show');
    }
}

async function streamText(element, html, speed) {
    if (typeof html === 'string') {
        html = zeroToleranceStripJsonEnvelope(html, 'opinion');
    }
    // Convert markdown bold (**text**) to HTML <strong>text</strong>
    // Convert newlines to <br> tags
    let processedHtml = html
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    
    let i = 0, buffer = '', inTag = false;
    while (i < processedHtml.length) {
        if (processedHtml[i] === '<') { inTag = true; buffer += processedHtml[i]; i++; continue; }
        if (inTag) { buffer += processedHtml[i]; if (processedHtml[i] === '>') inTag = false; i++; continue; }
        buffer += processedHtml[i]; i++;
        if (!inTag && i % 1 === 0) {
            element.innerHTML = buffer + '<span class="cursor-blink"></span>';
            await sleep(speed + Math.random() * 10);
        }
    }
    element.innerHTML = buffer;
}

function showSummary(ticker, entries) {
    const section = document.getElementById('summarySection');
    const counts = { bullish: 0, bearish: 0, neutral: 0 };
    entries.forEach(e => counts[e.stance]++);

    let verdictStance, verdictText, verdictIcon, verdictDesc;
    if (counts.bullish > counts.bearish && counts.bullish > counts.neutral) {
        verdictStance = 'bullish';
        verdictText = '看多';
        verdictIcon = '📈';
        verdictDesc = `多数大师看好，${counts.bullish} 位看多 vs ${counts.bearish} 位看空`;
    } else if (counts.bearish > counts.bullish && counts.bearish > counts.neutral) {
        verdictStance = 'bearish';
        verdictText = '看空';
        verdictIcon = '📉';
        verdictDesc = `多数大师看空，${counts.bearish} 位看空 vs ${counts.bullish} 位看多`;
    } else {
        verdictStance = 'neutral';
        verdictText = '持有';
        verdictIcon = '⏸';
        verdictDesc = `观点分歧或偏向观望，建议持有观察`;
    }

    document.getElementById('overallVerdict').innerHTML = `
        <div class="overall-verdict ${verdictStance}">
            <div class="verdict-icon">${verdictIcon}</div>
            <div class="verdict-content">
                <span class="verdict-label">综合结论</span>
                <span class="verdict-text">${verdictText}</span>
                <span class="verdict-desc">· ${verdictDesc}</span>
            </div>
        </div>
    `;

    document.getElementById('stanceStats').innerHTML = `
        <div class="stance-stat bullish"><span class="stat-count">${counts.bullish}</span> 位大师看多</div>
        <div class="stance-stat bearish"><span class="stat-count">${counts.bearish}</span> 位大师看空</div>
        <div class="stance-stat neutral"><span class="stat-count">${counts.neutral}</span> 位大师持有</div>
    `;

    const names = (stance) => entries.filter(e => e.stance === stance).map(e => MASTERS.find(m => m.id === e.master).name);
    let consensus = '';
    if (counts.bullish > counts.bearish && counts.bullish > counts.neutral) {
        consensus = `多数大师（${names('bullish').join('、')}）对${ticker}持乐观态度，认为其具备长期投资价值。`;
    } else if (counts.bearish > counts.bullish) {
        consensus = `看空声音较强（${names('bearish').join('、')}），主要担忧集中在估值过高和竞争加剧。`;
    } else {
        consensus = `大师们对${ticker}存在明显分歧。看多方有${names('bullish').join('、') || '无'}；看空方有${names('bearish').join('、') || '无'}；持有方有${names('neutral').join('、') || '无'}。`;
    }
    consensus += '但在基本面分析、行业地位等方面存在一定共识。';
    document.getElementById('summaryConsensus').textContent = consensus;

    let decision = '';
    if (names('bullish').length) decision += `若你倾向价值投资，可重点关注${names('bullish').join('、')}的观点；`;
    if (names('bearish').length) decision += `若担忧风险，${names('bearish').join('、')}的警示值得深思；`;
    if (names('neutral').length) decision += `若不确定，${names('neutral').join('、')}的观望建议或许更适合当前阶段。`;
    decision += '最终决策请结合自身风险承受能力和投资目标综合判断。';
    document.getElementById('summaryDecision').textContent = decision;

    section.classList.add('show');
}

function resetAll() {
    document.getElementById('tickerInput').value = '';
    updateInputLogoPreview();
    document.getElementById('debateSection').classList.remove('show');
    document.getElementById('summarySection').classList.remove('show');
    document.getElementById('resetSection').classList.remove('show');
    document.getElementById('stockInfoBar').classList.remove('show');
    document.getElementById('cardsBullish').innerHTML = '';
    document.getElementById('cardsBearish').innerHTML = '';
    document.getElementById('cardsNeutral').innerHTML = '';
    document.getElementById('loadingText').innerHTML = '大师们正在激烈辩论中<span class="loading-dots"></span>';
    MASTER_CARD_RUNTIME.clear();
    currentDebateTicker = '';
    document.getElementById('tickerInput').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function initApp() {
    const tickerInput = document.getElementById('tickerInput');
    tickerInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') startDebate(); });
    tickerInput.addEventListener('input', updateInputLogoPreview);
    tickerInput.addEventListener('change', () => normalizeTickerInputValue(tickerInput));
    tickerInput.addEventListener('blur', () => normalizeTickerInputValue(tickerInput));
    tickerInput.addEventListener('paste', () => setTimeout(() => normalizeTickerInputValue(tickerInput), 0));
    await loadMasters();
    renderMasterList();
    await checkBackend();
}

initApp();
