// 由于环境限制，我们在此文件中编写 Vue 2 + JS 代码
// 实际运行时，浏览器会将其作为 JS 模块执行

// --- 1. 数据 Mock 逻辑 (保持不变) ---
const generateMockData = () => {
  const services = ['家庭保洁日常', '深度家电清洗', '甲醛治理', '玻璃清洗', '管道疏通', '空调清洗', '开荒保洁', '收纳整理', '沙发清洗'];
  const warranties = ['质保3天', '质保7天', '质保30天', '质保90天', '无质保']; 
  const regions = ['北京市/朝阳区', '上海市/浦东新区', '深圳市/南山区', '杭州市/西湖区', '成都市/武侯区', '广州市/天河区', '武汉市/江汉区', '南京市/鼓楼区'];
  const sources = ['小程序', '电话', '美团', '转介绍', '抖音', '58同城'];
  const coefficients = [1.0, 1.1, 1.2, 1.3, 1.5];
  
  return Array.from({ length: 128 }).map((_, i) => {
    const id = i + 1;
    let status = '已完成';
    let returnReason = undefined;
    let errorDetail = undefined;

    if (i % 5 === 0) status = '待派单';
    else if (i % 15 === 1) status = '作废';
    else if (i % 15 === 2) { status = '已退回'; returnReason = '客户改期/联系不上'; }
    else if (i % 15 === 3) { status = '报错'; errorDetail = '现场与描述不符，需加价'; }

    let dispatchStatus = '正常';
    if (status === '待派单') {
        const r = Math.random();
        if (r > 0.6) dispatchStatus = '已超时';
        else if (r > 0.3) dispatchStatus = '催单';
    }

    const baseAddress = `${['阳光', '幸福', '金地', '万科', '恒大'][i % 5]}花园 ${i % 20 + 1}栋 ${i % 30 + 1}0${i % 4 + 1}室`;
    const addressDetail = ['(靠近东门门岗，需刷卡)', '(楼下有快递柜，电梯需梯控)', '(小区正在施工，请从北门进)', '(大堂右转第一部电梯)', '(物业处登记后进入)'][i % 5];
    const fullAddress = `${baseAddress} ${addressDetail}`;

    const baseDetails = [
        '客户备注：需带3米梯子，家里有大型犬请注意安全。另外需要重点清理厨房油烟机死角。', 
        '特殊要求：家里有孕妇，请使用无刺激性清洁剂。进门请穿鞋套，需要开具增值税发票。', 
        '时间要求：尽量上午10点前到达，下午客户要出门。需带大功率吸尘器，地毯灰尘较多。', 
        '刚装修完，全屋开荒保洁，玻璃窗户较多。注意不要弄脏墙面乳胶漆。', 
        '老客户，要求指派上次的李师傅。如果李师傅没空，请安排经验丰富的老师傅。'
    ][i % 5];
    
    const serviceItem = services[i % services.length];
    const isHighValue = serviceItem.includes('深度') || serviceItem.includes('甲醛') || serviceItem.includes('开荒');
    const marketPrice = isHighValue ? 300 + (i % 10) * 20 : 100 + (i % 5) * 10;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + (i % 3));
    futureDate.setHours(8 + (i % 10), (i * 15) % 60);
    const expectedTime = `${(futureDate.getMonth()+1).toString().padStart(2,'0')}-${futureDate.getDate().toString().padStart(2,'0')} ${futureDate.getHours().toString().padStart(2,'0')}:${futureDate.getMinutes().toString().padStart(2,'0')}`;

    return {
      id,
      orderNo: `ORD-${String(id).padStart(6, '0')}`,
      workOrderNo: `WO-${9980 + id}`,
      expectedTime,
      mobile: `13${i % 9 + 1}****${String(1000 + i).slice(-4)}`,
      serviceItem: serviceItem,
      warranty: warranties[i % warranties.length],
      serviceRatio: (['3:7', '4:6', '2:8'][i % 3]),
      status,
      returnReason,
      errorDetail,
      region: regions[i % regions.length],
      address: fullAddress, 
      details: baseDetails, 
      recordTime: `10-27 08:${String(i % 60).padStart(2, '0')}`,
      source: sources[i % sources.length],
      totalAmount: 150 + (i % 20) * 20,
      cost: (150 + (i % 20) * 20) * (i % 2 === 0 ? 0.6 : 0.7),
      hasAdvancePayment: i % 7 === 0,
      depositAmount: i % 12 === 0 ? 50 : undefined,
      weightedCoefficient: coefficients[i % coefficients.length],
      regionPeople: Math.floor(Math.random() * 6),
      dispatchStatus,
      dispatchMethod: isHighValue ? '谈单' : '抢单',
      marketPrice,
      historyPriceLow: Math.floor(marketPrice * 0.8),
      historyPriceHigh: Math.floor(marketPrice * 1.2),
    };
  });
};

// --- 2. Vue 组件逻辑 ---

// 注册 ElementUI 和 VXE Table (假设全局变量已由 index.html 引入)
// @ts-ignore
const Vue = window.Vue;
// @ts-ignore
const VXETable = window.VXETable;

if (Vue && VXETable) {
  Vue.use(VXETable);
}

new Vue({
  el: '#app',
  data() {
    return {
      tableData: [], // 原始数据
      displayData: [], // 当前页数据
      loading: false,
      isExpanded: false, // 搜索栏展开状态
      
      // 分页
      page: {
        currentPage: 1,
        pageSize: 20,
        total: 0
      },

      // 统计数据
      stats: {
        record: { total: 128, error: 3, all: 135, afterSales: 5, refund: '450.5' },
        dispatch: { today: 42, past: 86, other: 12, self: 30, single: 8, none: 2 },
        perf: { rate: '98.5%', today: '12850.0', wechat: '5600.0', platform: '7250.0', offline: '0' }
      },

      // 搜索表单
      searchForm: {
        keyword: '',
        personType: 'order',
        otherType: 'status',
        otherValue: '',
        timeType: 'create',
        dateRange: []
      },

      // 弹窗状态
      modals: {
        chat: { visible: false, role: '', order: null, message: '' },
        complete: { visible: false, order: null, amount: 0 }
      },

      // 表格列配置 (用于 VXE-Table)
      columns: [
        { field: 'mobile', title: '手机号', width: 95, align: 'center', fixed: 'left' },
        { field: 'serviceItem', title: '项目/质保期', width: 100, align: 'center' },
        { field: 'status', title: '状态', width: 70, align: 'center' },
        { field: 'weightedCoefficient', title: '系数', width: 50, align: 'center' },
        { field: 'region', title: '地域', width: 120 },
        { field: 'address', title: '详细地址', minWidth: 160 },
        { field: 'details', title: '详情', minWidth: 200 },
        { field: 'serviceRatio', title: '建议分成', width: 70, align: 'center' },
        { field: 'dispatchMethod', title: '建议方式', width: 70, align: 'center' },
        { field: 'marketPrice', title: '划线价', width: 60, align: 'center' },
        { field: 'historyPrice', title: '历史价', width: 80, align: 'center' },
        { field: 'source', title: '来源', width: 70, align: 'center' },
        { field: 'orderNo', title: '订单/工单号', width: 120 },
        { field: 'time', title: '录单/上门时间', width: 130, align: 'center' },
        { field: 'resource', title: '资源', width: 60, align: 'center' },
        { field: 'contact', title: '联系人', width: 100, align: 'center' },
        { field: 'dispatch', title: '派单', width: 70, align: 'center', fixed: 'right' },
        { field: 'action', title: '操作', width: 70, align: 'center', fixed: 'right' }
      ]
    };
  },
  created() {
    this.loadData();
  },
  methods: {
    loadData() {
      this.loading = true;
      // 模拟 API 延迟
      setTimeout(() => {
        const rawData = generateMockData();
        // 排序逻辑：待派单优先，然后按紧急程度
        rawData.sort((a, b) => {
           const getScore = (o) => {
             if (o.status !== '待派单') return 0;
             if (o.dispatchStatus === '催单') return 3;
             if (o.dispatchStatus === '已超时') return 2;
             return 1;
           }
           return getScore(b) - getScore(a);
        });
        
        this.tableData = rawData;
        this.page.total = rawData.length;
        this.updateDisplayData();
        this.loading = false;
      }, 300);
    },
    updateDisplayData() {
      const start = (this.page.currentPage - 1) * this.page.pageSize;
      const end = start + this.page.pageSize;
      this.displayData = this.tableData.slice(start, end);
    },
    handlePageChange({ currentPage, pageSize }) {
      this.page.currentPage = currentPage;
      this.page.pageSize = pageSize;
      this.updateDisplayData();
    },
    
    // 交互方法
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    },
    openChat(role, order) {
      this.modals.chat = { visible: true, role, order, message: '' };
    },
    openComplete(order) {
      this.modals.complete = { visible: true, order, amount: order.totalAmount };
    },
    handleDispatch(row) {
      this.$message.success(`订单 ${row.orderNo} 派单成功`);
      // 更新状态
      const index = this.tableData.findIndex(item => item.id === row.id);
      if (index !== -1) {
        this.tableData[index].status = '已完成';
        this.tableData[index].dispatchStatus = '正常';
        this.updateDisplayData();
      }
    },
    handleAction(command, row) {
      if (command === '完单') {
        this.openComplete(row);
      } else {
        this.$message.info(`执行操作: ${command} (ID: ${row.id})`);
      }
    },
    // 样式辅助
    getStatusType(status) {
      const map = {
        '待派单': 'warning',
        '已完成': 'success',
        '已退回': 'danger',
        '报错': 'warning', // yellow
        '作废': 'info'
      };
      return map[status] || 'info';
    },
    checkResource(row) {
      this.$alert(`查询资源: ${row.region}`, '资源查询', { confirmButtonText: '确定' });
    }
  },
  template: `
    <div class="h-screen flex flex-col p-2 font-sans text-sm">
      
      <!-- 1. Notification Bar (通知栏) -->
      <div class="flex items-center gap-3 mb-2 px-2 py-1.5 bg-[#0f172a] rounded-lg shadow-sm overflow-hidden relative group shrink-0 h-[46px] border border-slate-800">
        <div class="flex items-center justify-center gap-1.5 bg-[#ef4444] text-white px-3 h-[28px] rounded shrink-0 z-10 shadow-sm ml-1">
          <span class="text-[12px] font-bold whitespace-nowrap leading-none tracking-wide">主要公告</span>
          <i class="el-icon-bell text-white font-bold"></i>
        </div>
        <div class="flex-1 overflow-hidden relative h-full flex items-center">
          <div class="whitespace-nowrap animate-marquee flex items-center gap-16 text-[12px] font-medium text-slate-200 cursor-default">
            <span class="flex items-center gap-2">
              <i class="el-icon-message-solid text-[#ef4444]"></i>
              <span>关于 2025 年度秋季职级晋升评审的通知：点击下方详情以阅读完整公告内容。请所有相关人员务必在截止日期前完成确认。</span>
            </span>
            <span class="flex items-center gap-2">
               <i class="el-icon-warning text-[#ef4444]"></i>
               <span>📢 系统升级通知：今晚 24:00 将进行系统维护，预计耗时 30 分钟。</span>
            </span>
            <span class="flex items-center gap-2">
               <i class="el-icon-s-flag text-[#ef4444]"></i>
               <span>🔥 10月业绩pk赛圆满结束，恭喜华东大区获得冠军！</span>
            </span>
          </div>
        </div>
        <div class="shrink-0 z-10 bg-[#1e293b] border border-slate-700/50 text-[#60a5fa] text-[11px] font-bold font-mono px-2.5 py-1 rounded select-none mr-1">
          2025-11-19
        </div>
      </div>

      <!-- 2. Search Panel (搜索面板) -->
      <div class="shadow-md mb-2 transition-all duration-300 ease-in-out relative overflow-hidden border border-blue-100 rounded-lg bg-gradient-to-br from-[#f0f7ff] via-[#e6f4ff] to-[#dbeafe] shrink-0">
        <div class="flex w-full transition-all duration-300" :style="{ height: isExpanded ? '210px' : '60px' }">
          
          <!-- Left Content -->
          <div :class="['transition-all duration-300 ease-in-out border-r border-blue-200/60 flex relative backdrop-blur-sm bg-white/30', isExpanded ? 'w-[66%] p-2' : 'w-[90%] px-4 py-2 flex-row items-center gap-6']">
             
             <!-- Collapsed State -->
             <div v-if="!isExpanded" class="flex items-center w-full h-full">
                <div class="flex items-center gap-2 shrink-0 mr-8">
                    <i class="el-icon-data-line text-blue-600 text-xl"></i>
                    <span class="text-base font-bold text-slate-800">数据概览</span>
                </div>
                <div class="flex items-center flex-1 justify-between gap-4 overflow-hidden h-full">
                    <div class="flex items-baseline gap-1.5"><span class="text-xs font-bold text-slate-500">录单:</span><span class="text-lg font-extrabold text-slate-800 font-mono">{{ stats.record.total }}</span></div>
                    <div class="flex items-baseline gap-1.5"><span class="text-xs font-bold text-slate-500">今日派单:</span><span class="text-lg font-extrabold text-slate-800 font-mono">{{ stats.dispatch.today }}</span></div>
                    <div class="flex items-baseline gap-1.5"><span class="text-xs font-bold text-slate-500">今日业绩:</span><span class="text-lg font-extrabold text-emerald-600 font-mono">{{ stats.perf.today }}</span></div>
                    <div class="flex items-baseline gap-1.5"><span class="text-xs font-bold text-slate-500">收款率:</span><span class="text-lg font-extrabold text-slate-800 font-mono">{{ stats.perf.rate }}</span></div>
                    <div class="flex items-baseline gap-1.5"><span class="text-xs font-bold text-slate-500">退款:</span><span class="text-lg font-extrabold text-red-500 font-mono">{{ stats.record.refund }}</span></div>
                </div>
             </div>

             <!-- Expanded State -->
             <div v-else class="flex h-full w-full">
                <div class="w-[24px] flex flex-col justify-center shrink-0 border-r border-blue-100/50 mr-2 py-4">
                    <div class="flex flex-col items-center text-lg font-bold text-blue-600 leading-tight">
                        <span>数</span><span>据</span><span>概</span><span>览</span>
                    </div>
                </div>
                <div class="flex-1 flex flex-col justify-center space-y-1 pt-0"> 
                    <!-- Row 1 -->
                    <div class="flex items-center gap-4 h-[54px]"> 
                        <div class="flex items-center gap-2 text-blue-600 w-[80px] justify-end shrink-0"><i class="el-icon-tickets"></i><span class="text-sm font-bold">订单情况</span></div>
                        <div class="flex items-center gap-4 flex-1 w-full">
                           <div class="flex flex-col items-center justify-center border border-slate-400 rounded-lg px-2 flex-1 bg-white/40 py-0.5 h-[50px]">
                              <span class="text-[11px] mb-0.5 font-bold text-slate-500">录单数</span>
                              <span class="font-mono font-extrabold text-slate-700 text-[16px] leading-none">{{ stats.record.total }}</span>
                           </div>
                           <div class="flex flex-col items-center justify-center border border-slate-400 rounded-lg px-2 flex-1 bg-white/40 py-0.5 h-[50px]">
                              <span class="text-[11px] mb-0.5 font-bold text-slate-500">报错数</span>
                              <span class="font-mono font-extrabold text-red-500 text-[16px] leading-none">{{ stats.record.error }}</span>
                           </div>
                           <div class="flex flex-col items-center justify-center border border-slate-400 rounded-lg px-2 flex-1 bg-white/40 py-0.5 h-[50px]">
                              <span class="text-[11px] mb-0.5 font-bold text-slate-500">总单数</span>
                              <span class="font-mono font-extrabold text-slate-700 text-[16px] leading-none">{{ stats.record.all }}</span>
                           </div>
                           <div class="flex flex-col items-center justify-center border border-slate-400 rounded-lg px-2 flex-1 bg-white/40 py-0.5 h-[50px]">
                              <span class="text-[11px] mb-0.5 font-bold text-slate-500">待售后</span>
                              <span class="font-mono font-extrabold text-orange-500 text-[16px] leading-none">{{ stats.record.afterSales }}</span>
                           </div>
                           <div class="flex flex-col items-center justify-center border border-slate-400 rounded-lg px-2 flex-1 bg-white/40 py-0.5 h-[50px]">
                              <span class="text-[11px] mb-0.5 font-bold text-slate-500">退款额</span>
                              <span class="font-mono font-extrabold text-slate-700 text-[16px] leading-none">{{ stats.record.refund }}</span>
                           </div>
                        </div>
                    </div>
                    <!-- Row 2 -->
                    <div class="flex items-center gap-4 h-[54px]">
                        <div class="flex items-center gap-2 text-cyan-600 w-[80px] justify-end shrink-0"><i class="el-icon-lightning"></i><span class="text-sm font-bold">派单详情</span></div>
                        <div class="flex items-center gap-4 flex-1 w-full">
                           <div class="flex flex-col items-center justify-center border border-slate-400 rounded-lg px-2 flex-1 bg-white/40 py-0.5 h-[50px]" v-for="(val, key) in stats.dispatch" :key="key">
                              <span class="text-[11px] mb-0.5 font-bold text-slate-500">{{ {'today':'今日派单','past':'往日派单','other':'他派','self':'自派','single':'单库','none':'未派'}[key] }}</span>
                              <span class="font-mono font-extrabold text-slate-700 text-[16px] leading-none">{{ val }}</span>
                           </div>
                        </div>
                    </div>
                    <!-- Row 3 -->
                    <div class="flex items-center gap-4 h-[54px]">
                        <div class="flex items-center gap-2 text-indigo-600 w-[80px] justify-end shrink-0"><i class="el-icon-wallet"></i><span class="text-sm font-bold">业绩指标</span></div>
                        <div class="flex items-center gap-4 flex-1 w-full">
                           <div class="flex flex-col items-center justify-center border border-slate-400 rounded-lg px-2 flex-1 bg-white/40 py-0.5 h-[50px]" v-for="(val, key) in stats.perf" :key="key">
                              <span class="text-[11px] mb-0.5 font-bold text-slate-500">{{ {'rate':'收款率','today':'今日业绩','wechat':'今日微信','platform':'平台','offline':'线下'}[key] }}</span>
                              <span :class="['font-mono font-extrabold text-[16px] leading-none', key === 'today' ? 'text-emerald-600' : 'text-slate-700']">{{ val }}</span>
                           </div>
                        </div>
                    </div>
                </div>
             </div>
          </div>

          <!-- Right Action/Search -->
          <div 
            :class="['transition-all duration-300 ease-in-out relative backdrop-blur-sm', isExpanded ? 'w-[34%] p-3 bg-white/60' : 'w-[10%] bg-blue-100/50 hover:bg-blue-200/50 cursor-pointer flex items-center justify-center']"
            @click="!isExpanded && toggleExpand()"
          >
             <div v-if="!isExpanded" class="flex flex-row items-center justify-center gap-2 text-blue-600 animate-pulse w-full h-full">
                 <i class="el-icon-search text-lg"></i>
                 <span class="text-xs font-bold tracking-widest whitespace-nowrap">点这高级筛选</span>
             </div>
             <div v-else class="h-full flex flex-col justify-between">
                 <div class="flex justify-between items-center mb-1">
                    <div class="flex items-center gap-2"><i class="el-icon-search text-blue-600"></i><h3 class="text-sm font-bold text-slate-800">高级筛选</h3></div>
                    <button @click.stop="toggleExpand" class="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-all"><i class="el-icon-arrow-up"></i> 收起</button>
                 </div>
                 
                 <div class="space-y-2 flex-1">
                    <div class="flex gap-2 h-[34px]">
                        <div class="flex-[1.2] flex items-center gap-1 bg-white border border-blue-100 p-1 rounded hover:border-blue-300 transition-colors shadow-sm min-w-0">
                             <div class="text-blue-400 px-1 shrink-0"><i class="el-icon-user"></i></div>
                             <el-select v-model="searchForm.personType" size="mini" class="w-[70px]" :popper-append-to-body="false">
                                <el-option label="综合" value="order"></el-option>
                                <el-option label="师傅" value="master"></el-option>
                             </el-select>
                             <input v-model="searchForm.keyword" type="text" class="bg-transparent text-[11px] text-slate-600 outline-none w-full h-full px-1 placeholder-slate-400 border-l border-slate-100" placeholder="关键字" />
                        </div>
                        <div class="flex-1 flex items-center gap-1 bg-white border border-blue-100 p-1 rounded hover:border-blue-300 transition-colors shadow-sm min-w-0">
                            <el-select v-model="searchForm.otherType" size="mini" class="w-[75px]" :popper-append-to-body="false">
                                <el-option label="状态" value="status"></el-option>
                                <el-option label="项目" value="service"></el-option>
                            </el-select>
                            <div class="flex-1 h-full min-w-0 border-l border-slate-100">
                                <el-select v-if="searchForm.otherType === 'status'" v-model="searchForm.otherValue" size="mini" class="w-full" :popper-append-to-body="false" placeholder="全部状态">
                                    <el-option label="全部" value=""></el-option>
                                    <el-option label="待派单" value="待派单"></el-option>
                                    <el-option label="已完成" value="已完成"></el-option>
                                </el-select>
                                <input v-else v-model="searchForm.otherValue" type="text" class="bg-transparent text-[11px] text-slate-600 outline-none w-full h-full px-1 placeholder-slate-400" placeholder="输入" />
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 bg-white border border-blue-100 p-1 rounded hover:border-blue-300 transition-colors shadow-sm h-[34px]">
                        <div class="text-blue-400 px-1"><i class="el-icon-date"></i></div>
                        <el-select v-model="searchForm.timeType" size="mini" class="w-[90px]" :popper-append-to-body="false">
                            <el-option label="创建时间" value="create"></el-option>
                            <el-option label="完成时间" value="finish"></el-option>
                        </el-select>
                        <el-date-picker
                          v-model="searchForm.dateRange"
                          type="datetimerange"
                          range-separator="-"
                          start-placeholder="开始"
                          end-placeholder="结束"
                          size="mini"
                          class="flex-1 !w-full !border-0"
                          prefix-icon="el-icon-time"
                          :clearable="false"
                        >
                        </el-date-picker>
                    </div>

                    <div class="flex items-center justify-between gap-3 h-[34px]">
                        <button class="h-full flex-1 bg-white text-slate-600 hover:text-blue-600 text-[11px] rounded transition-colors border border-slate-200 hover:border-blue-300 shadow-sm font-medium">重置</button>
                        <button class="h-full flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] rounded transition-all font-bold shadow-md flex items-center gap-2 active:scale-95 justify-center"><i class="el-icon-search"></i> 立即搜索</button>
                    </div>
                 </div>
                 
                 <div class="h-px bg-slate-200 my-1"></div>

                 <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <div class="flex items-center gap-1 shrink-0">
                        <i class="el-icon-magic-stick text-amber-500 text-xs"></i>
                        <span class="text-[10px] font-bold text-slate-500">快捷</span>
                    </div>
                    <div class="h-3 w-px bg-slate-300 shrink-0"></div>
                    <div class="flex gap-1.5 flex-nowrap flex-1">
                        <el-button type="primary" size="mini" icon="el-icon-plus" circle class="!p-1"></el-button>
                        <el-button type="success" size="mini" icon="el-icon-check" circle class="!p-1"></el-button>
                        <el-button type="warning" size="mini" icon="el-icon-question" circle class="!p-1"></el-button>
                        <el-button type="danger" size="mini" icon="el-icon-close" circle class="!p-1"></el-button>
                    </div>
                 </div>
             </div>
          </div>
        </div>
      </div>

      <!-- 3. Table Area (表格区域) -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-300 flex-1 flex flex-col overflow-hidden mt-2">
         <vxe-table
            border
            stripe
            show-header-overflow
            show-overflow
            :row-config="{isHover: true, height: 48}"
            :data="displayData"
            :loading="loading"
            height="auto"
            class="flex-1"
            size="mini"
            :scroll-y="{enabled: true}"
          >
            <!-- 手机号 -->
            <vxe-column field="mobile" title="手机号" width="105" fixed="left" align="center">
                <template #default="{ row, rowIndex }">
                   <span class="font-mono font-bold text-slate-800 text-[12px]">{{ row.mobile }}</span>
                </template>
            </vxe-column>

            <!-- 项目/质保期 - 居中对齐 -->
            <vxe-column field="serviceItem" title="项目/质保期" width="120" align="center">
                <template #default="{ row }">
                   <div class="flex flex-col items-center">
                      <span class="font-bold text-gray-700 hover:text-blue-600 cursor-pointer text-[12px]">{{ row.serviceItem }}</span>
                      <span class="text-[10px] text-slate-500">{{ row.warranty }}</span>
                   </div>
                </template>
            </vxe-column>

            <!-- 状态 -->
            <vxe-column field="status" title="状态" width="80" align="center">
                <template #default="{ row }">
                   <div class="flex flex-col items-center">
                     <el-tag :type="getStatusType(row.status)" size="mini" effect="light" class="!h-5 !px-1 !line-height-18">{{ row.status }}</el-tag>
                     <span v-if="row.returnReason" class="text-[9px] text-red-500 scale-90">{{ row.returnReason }}</span>
                     <span v-if="row.errorDetail" class="text-[9px] text-yellow-600 scale-90">{{ row.errorDetail }}</span>
                   </div>
                </template>
            </vxe-column>

            <!-- 系数 -->
            <vxe-column field="weightedCoefficient" title="系数" width="60" align="center">
                <template #default="{ row }">
                    <span class="font-mono font-medium">{{ row.weightedCoefficient.toFixed(1) }}</span>
                </template>
            </vxe-column>

            <!-- 地域 -->
            <vxe-column field="region" title="地域" width="130">
                <template #default="{ row }">
                    <div class="truncate">{{ row.region }}</div>
                    <div class="text-[9px] text-blue-500"><span class="font-mono">{{ row.regionPeople }}</span>人</div>
                </template>
            </vxe-column>

            <!-- 地址 - 颜色text-slate-800，2行显示 -->
            <vxe-column field="address" title="详细地址" min-width="180">
                <template #default="{ row }">
                   <span class="text-slate-800 text-[12px] leading-tight line-clamp-2 whitespace-normal break-words" :title="row.address">{{ row.address }}</span>
                </template>
            </vxe-column>

            <!-- 详情 - 颜色text-slate-800，2行显示 -->
            <vxe-column field="details" title="详情" min-width="220">
                <template #default="{ row }">
                   <span class="text-slate-800 text-[14px] leading-tight line-clamp-2 whitespace-normal break-words" :title="row.details">{{ row.details }}</span>
                </template>
            </vxe-column>

            <!-- 建议分成 - 颜色text-slate-800，去加粗 -->
            <vxe-column field="serviceRatio" title="建议分成" width="80" align="center">
                <template #default="{ row }">
                    <span class="text-slate-800 text-[16px] font-mono">{{ row.serviceRatio }}</span>
                </template>
            </vxe-column>

            <!-- 建议方式 - 颜色text-slate-800 -->
            <vxe-column field="dispatchMethod" title="建议方式" width="80" align="center">
                <template #default="{ row }">
                    <span class="text-slate-800 text-[12px]">{{ row.dispatchMethod }}</span>
                </template>
            </vxe-column>

            <!-- 价格列 - 颜色text-slate-800 -->
            <vxe-column field="marketPrice" title="划线价" width="70" align="center">
                <template #default="{ row }">
                    <span class="text-slate-800 font-mono">{{ row.marketPrice }}</span>
                </template>
            </vxe-column>
            <!-- 历史价 -->
            <vxe-column field="historyPriceLow" title="历史价" width="80" align="center">
                <template #default="{ row }">
                    <span class="text-[14px] font-mono">{{ row.historyPriceLow }}-{{ row.historyPriceHigh }}</span>
                </template>
            </vxe-column>

            <!-- 来源 -->
            <vxe-column field="source" title="来源" width="70" align="center">
                <template #default="{ row }">
                    <span class="bg-gray-100 px-1 rounded text-slate-500 text-[11px]">{{ row.source }}</span>
                </template>
            </vxe-column>

            <!-- 订单号 -->
            <vxe-column field="orderNo" title="订单/工单号" width="130">
                <template #default="{ row }">
                    <div class="flex flex-col">
                        <div class="flex items-center gap-1">
                            <span class="font-medium text-slate-900 font-mono text-[11px]">{{ row.orderNo }}</span>
                            <span v-if="row.hasAdvancePayment" class="bg-rose-500 text-white text-[9px] px-0.5 rounded scale-90">垫</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="text-slate-400 font-mono text-[10px]">{{ row.workOrderNo }}</span>
                            <span v-if="row.depositAmount" class="bg-teal-50 text-teal-700 border border-teal-200 text-[9px] px-0.5 rounded scale-90 font-mono">定{{row.depositAmount}}</span>
                        </div>
                    </div>
                </template>
            </vxe-column>

            <!-- 时间 -->
            <vxe-column field="recordTime" title="录单/上门时间" width="140" align="center">
                <template #default="{ row }">
                    <div class="flex flex-col gap-0.5 text-[12px]">
                        <div class="flex items-center justify-center gap-1 text-slate-400 font-mono">
                            <span class="w-3.5 h-3.5 rounded bg-blue-500 text-white flex items-center justify-center text-[9px] font-sans">录</span>
                            {{ row.recordTime }}
                        </div>
                        <div class="flex items-center justify-center gap-1 text-blue-600 font-medium font-mono">
                            <span class="w-3.5 h-3.5 rounded bg-purple-500 text-white flex items-center justify-center text-[9px] font-sans">期</span>
                            {{ row.expectedTime }}
                        </div>
                    </div>
                </template>
            </vxe-column>

            <!-- 资源 -->
            <vxe-column title="资源" width="70" align="center">
                <template #default="{ row }">
                    <el-button size="mini" plain class="!p-1 !text-[10px]" @click="checkResource(row)">查资源</el-button>
                </template>
            </vxe-column>

            <!-- 联系人 -->
            <vxe-column title="联系人" width="100" align="center">
                <template #default="{ row }">
                    <div class="grid grid-cols-2 gap-1">
                        <span class="cursor-pointer hover:text-blue-600 bg-slate-50 border border-slate-200 rounded px-1 text-[10px]" @click="openChat('客服', row)">客服</span>
                        <span class="cursor-pointer hover:text-blue-600 bg-slate-50 border border-slate-200 rounded px-1 text-[10px]" @click="openChat('运营', row)">运营</span>
                        <span class="cursor-pointer hover:text-blue-600 bg-slate-50 border border-slate-200 rounded px-1 text-[10px]" @click="openChat('售后', row)">售后</span>
                        <span class="cursor-pointer hover:text-blue-600 bg-slate-50 border border-slate-200 rounded px-1 text-[10px] flex items-center justify-center" @click="openChat('群聊', row)"><i class="el-icon-chat-line-square"></i></span>
                    </div>
                </template>
            </vxe-column>

            <!-- 派单 - 优化悬浮标签样式 -->
            <vxe-column title="派单" width="80" align="center" fixed="right">
                <template #default="{ row }">
                    <div v-if="row.status === '待派单'" class="relative inline-block w-full">
                        <el-popover placement="left" width="120" trigger="click">
                            <div class="flex flex-col gap-1">
                                <el-button size="mini" type="text" @click="handleDispatch(row)">线下派单</el-button>
                                <el-button size="mini" type="text" @click="handleDispatch(row)">线上派单</el-button>
                            </div>
                            <el-button slot="reference" type="warning" size="mini" class="!p-1.5 !text-[11px] w-full">
                                派单
                            </el-button>
                        </el-popover>
                        <span v-if="row.dispatchStatus !== '正常'" class="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-sm scale-75 z-20 font-bold whitespace-nowrap animate-float-jump pointer-events-none">{{ row.dispatchStatus }}</span>
                    </div>
                    <span v-else class="text-gray-300 text-[10px]">已派单</span>
                </template>
            </vxe-column>

            <!-- 操作 -->
            <vxe-column title="操作" width="80" align="center" fixed="right">
                <template #default="{ row }">
                    <el-dropdown trigger="click" size="mini" @command="(cmd) => handleAction(cmd, row)">
                      <el-button size="mini" class="!px-2 !py-1 text-[11px]">
                        操作<i class="el-icon-arrow-down el-icon--right"></i>
                      </el-button>
                      <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item command="复制" icon="el-icon-document-copy">复制订单</el-dropdown-item>
                        <el-dropdown-item command="完单" icon="el-icon-check" class="text-green-600">完单</el-dropdown-item>
                        <el-dropdown-item command="作废" icon="el-icon-delete" class="text-red-500">作废</el-dropdown-item>
                        <el-dropdown-item command="详情" icon="el-icon-info">详情</el-dropdown-item>
                      </el-dropdown-menu>
                    </el-dropdown>
                </template>
            </vxe-column>
         </vxe-table>
         
         <!-- Footer / Pagination -->
         <div class="bg-white px-4 py-2 border-t border-gray-200 flex justify-between items-center shrink-0">
            <span class="text-xs text-slate-500">共 <span class="font-mono font-bold">{{ page.total }}</span> 条数据</span>
            <vxe-pager
                :current-page="page.currentPage"
                :page-size="page.pageSize"
                :total="page.total"
                :layouts="['PrevPage', 'Number', 'NextPage', 'Sizes', 'FullJump']"
                size="mini"
                @page-change="handlePageChange">
            </vxe-pager>
         </div>
      </div>

      <!-- Modals -->
      <el-dialog :visible.sync="modals.chat.visible" :title="'联系' + modals.chat.role" width="500px" append-to-body>
         <div class="bg-slate-50 p-4 rounded h-64 overflow-y-auto mb-4 border border-slate-200">
            <div class="flex gap-3">
               <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">{{ modals.chat.role[0] }}</div>
               <div class="bg-white p-2 rounded shadow-sm text-sm text-slate-700 max-w-[80%]">您好，我是{{ modals.chat.role }}，请问订单 {{ modals.chat.order?.orderNo }} 有什么问题？</div>
            </div>
         </div>
         <div class="flex gap-2">
            <el-input v-model="modals.chat.message" placeholder="输入消息..." size="small"></el-input>
            <el-button type="primary" size="small" icon="el-icon-s-promotion">发送</el-button>
         </div>
      </el-dialog>

      <el-dialog :visible.sync="modals.complete.visible" title="完成订单" width="400px" append-to-body>
         <div class="bg-emerald-50 p-4 rounded border border-emerald-100 mb-4 text-emerald-800">
             <div class="flex justify-between items-center mb-2">
                 <span>应收金额</span>
                 <span class="text-xl font-bold font-mono">¥{{ modals.complete.amount }}</span>
             </div>
             <p class="text-xs opacity-80">请确认实际收到款项后再点击完成。</p>
         </div>
         <el-form label-width="80px" size="small">
             <el-form-item label="实收金额">
                <el-input type="number" v-model="modals.complete.amount" class="font-mono"></el-input>
             </el-form-item>
         </el-form>
         <div slot="footer">
             <el-button size="small" @click="modals.complete.visible = false">取消</el-button>
             <el-button size="small" type="primary" @click="modals.complete.visible = false; $message.success('订单已完成')">确认完成</el-button>
         </div>
      </el-dialog>

    </div>
  `
});
