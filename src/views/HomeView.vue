<template>
  <div class="page home-page">
    <section class="hero-panel">
      <div>
        <p class="section-chip">Dashboard</p>
        <h2>欢迎回来，{{ user?.name }}</h2>
        <p class="hero-copy">
          当前界面已切换为移动端友好的现代化布局。后续季度配置、评分录入、结果计算与导出功能都将在这里继续扩展。
        </p>
      </div>
      <div class="hero-side">
        <div class="hero-stat">
          <strong>{{ roleLabel }}</strong>
          <span>当前角色</span>
        </div>
        <div class="hero-stat">
          <strong>{{ teamSummary }}</strong>
          <span>所在小组</span>
        </div>
      </div>
    </section>

    <section class="metric-grid">
      <article class="metric-card metric-card--teal">
        <span>系统状态</span>
        <strong>在线</strong>
        <p>本地前后端服务已连接，可继续联调管理功能。</p>
      </article>
      <article class="metric-card metric-card--navy">
        <span>登录方式</span>
        <strong>工号免密</strong>
        <p>适合企业内部系统快速接入，也方便后续对接 SSO。</p>
      </article>
      <article class="metric-card metric-card--sand">
        <span>当前阶段</span>
        <strong>基础管理</strong>
        <p>已具备员工、小组与管理员入口，可继续进入季度业务层。</p>
      </article>
    </section>

    <section class="content-grid">
      <el-card class="surface-card quick-card" shadow="never">
        <template #header>
          <div class="card-head">
            <span>快捷入口</span>
            <small>按角色显示</small>
          </div>
        </template>
        <div class="quick-links">
          <router-link to="/" class="quick-link quick-link--primary">首页总览</router-link>
          <el-dropdown class="quick-dropdown">
            <el-button class="quick-link quick-link--dropdown">
              人员管理 <el-icon><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item><router-link to="/admin/users">员工管理</router-link></el-dropdown-item>
                <el-dropdown-item><router-link to="/admin/departments">职能管理</router-link></el-dropdown-item>
                <el-dropdown-item><router-link to="/admin/teams">群组管理</router-link></el-dropdown-item>
                <el-dropdown-item><router-link to="/admin/job-titles">职称管理</router-link></el-dropdown-item>
                <el-dropdown-item><router-link to="/admin/job-levels">职级管理</router-link></el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <a href="/about/analysis/index.html" class="quick-link">查看需求分析</a>
        </div>
      </el-card>

      <el-card class="surface-card tasks-card" shadow="never">
        <template #header>
          <div class="card-head">
            <span>我的任务</span>
            <small>{{ filteredTasks.length }} 个待处理</small>
          </div>
        </template>
        
        <!-- 过滤选项 -->
        <div class="task-filters">
          <el-radio-group v-model="filterType" size="small" @change="applyFilter">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="incomplete">未完成</el-radio-button>
            <el-radio-button label="completed">已完成</el-radio-button>
          </el-radio-group>
        </div>
        
        <div v-if="loadingTasks" class="loading-tasks">
          <el-icon class="is-loading" :size="24"><Loading /></el-icon>
        </div>
        <div v-else-if="filteredTasks.length === 0" class="empty-tasks">
          <el-empty description="暂无任务" :image-size="80" />
        </div>
        <div v-else class="tasks-list">
          <div 
            v-for="task in filteredTasks.slice(0, 5)" 
            :key="task.id || task.name" 
            class="task-item"
            @click="goToTaskProcess(task)"
          >
            <div class="task-info">
              <div class="task-name">{{ task.name }}</div>
              <div class="task-meta">
                <el-tag size="small" :type="getTaskTagType(task.type)">
                  {{ getTaskTypeName(task.type) }}
                </el-tag>
                <span class="task-quarter">{{ task.details?.quarter }}</span>
                <el-tag size="mini" :type="task.status === 'completed' ? 'success' : 'warning'">
                  {{ task.status === 'completed' ? '已完成' : '未完成' }}
                </el-tag>
              </div>
            </div>
            <div class="task-description">{{ task.description }}</div>
            <div class="task-initiator">发起人：{{ task.initiator }}</div>
          </div>
        </div>
      </el-card>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { state } from '../store';
import { api } from '../api';
import { Loading } from '@element-plus/icons-vue';
import * as Lower32 from '../utils/lower32';

const user = computed(() => state.user);
const router = useRouter();
const ROLE_MAP = { admin: '管理员', leader: '组长', employee: '员工' };
const roleLabel = computed(() => ROLE_MAP[user.value?.role] || user.value?.role);
const teamSummary = computed(() => {
  const names = user.value?.team_names;
  if (!Array.isArray(names) || names.length === 0) return '未加入小组';
  if (names.length <= 2) return names.join(' / ');
  return `${names[0]} 等 ${names.length} 个小组`;
});

const myTasks = ref([]);
const loadingTasks = ref(false);
const filterType = ref('all'); // 'all' | 'incomplete' | 'completed'
const filteredTasks = ref([]);

// 应用过滤
function applyFilter() {
  if (filterType.value === 'all') {
    filteredTasks.value = myTasks.value;
  } else {
    filteredTasks.value = myTasks.value.filter(task => task.status === filterType.value);
  }
}

// 跳转到任务处理页面
function goToTaskProcess(task) {
  // 使用 Lower32 编码任务名称（URL 安全，不区分大小写）
  const encodedName = Lower32.encode(task.name);
  router.push(`/evaluation/process/${encodedName}`);
}

// 获取任务标签类型（用于颜色）
function getTaskTagType(type) {
  const typeMap = {
    'leader_assigned': 'warning',  // 指定关系 - 橙色
    'direct': 'success',           // 直接评分 - 绿色
    'vote': 'primary',             // 投票 - 蓝色
    'survey': 'info'               // 问卷 - 灰色
  };
  return typeMap[type] || 'info';
}

// 获取任务类型名称
function getTaskTypeName(type) {
  const typeMap = {
    'leader_assigned': '指定评分',
    'direct': '直接评分',
    'vote': '投票',
    'survey': '问卷'
  };
  return typeMap[type] || '未知';
}

async function fetchMyTasks() {
  try {
    loadingTasks.value = true;
    const response = await api.get('/api/evaluations/my-tasks');
    // 直接使用返回的数据（已经是解包后的格式）
    myTasks.value = response;
    applyFilter(); // 应用过滤
  } catch (error) {
    console.error('获取我的任务失败:', error);
  } finally {
    loadingTasks.value = false;
  }
}

onMounted(fetchMyTasks);
</script>

<style scoped>
.page { padding: 8px 0 0; }
.home-page { display: flex; flex-direction: column; gap: 18px; }
.hero-panel {
  display: grid;
  grid-template-columns: 1.4fr .8fr;
  gap: 18px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(230, 240, 255, .9));
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
}
.section-chip {
  margin: 0 0 8px;
  color: #1d4ed8;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
}
.hero-panel h2 { margin: 0; font-size: clamp(26px, 4.2vw, 38px); }
.hero-copy {
  max-width: 640px;
  margin: 12px 0 0;
  color: #60708a;
  line-height: 1.7;
}
.hero-side {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
.hero-stat,
.metric-card,
.surface-card {
  border-radius: 16px;
}
.hero-stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 112px;
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
}
.hero-stat strong { font-size: 20px; }
.hero-stat span { margin-top: 6px; color: #60708a; }
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.metric-card {
  padding: 18px;
  color: #fff;
  min-height: 156px;
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.14);
}
.metric-card span { font-size: 12px; opacity: .84; }
.metric-card strong { display: block; margin: 12px 0 10px; font-size: 24px; }
.metric-card p { margin: 0; line-height: 1.65; font-size: 13px; }
.metric-card--teal { background: linear-gradient(135deg, #1d4ed8, #06b6d4); }
.metric-card--navy { background: linear-gradient(135deg, #334155, #1e293b); }
.metric-card--sand { background: linear-gradient(135deg, #fb923c, #facc15); }
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.surface-card {
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #ffffff;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-head span { font-size: 16px; font-weight: 700; }
.card-head small { color: #60708a; }
.quick-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.quick-link {
  display: flex;
  align-items: center;
  min-height: 62px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #f8fafc;
  color: #10233c;
  font-weight: 600;
  transition: all .18s ease;
}
.quick-link:hover { border-color: #1d4ed8; color: #1d4ed8; }
.quick-link--primary {
  background: linear-gradient(135deg, #1d4ed8, #06b6d4);
  border-color: transparent;
  color: #fff;
}
.quick-dropdown .el-button {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #f8fafc;
  color: #10233c;
  font-weight: 600;
  transition: all .18s ease;
}
.quick-dropdown .el-button:hover { border-color: #1d4ed8; color: #1d4ed8; }
.info-list {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  line-height: 1.8;
}

.tasks-card .loading-tasks,
.tasks-card .empty-tasks {
  text-align: center;
  padding: 32px 0;
  color: #94a3b8;
}

.tasks-card .task-filters {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  background: #f8fafc;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.15);
  transition: all 0.2s;
  cursor: pointer;
}

.task-item:hover {
  border-color: #1d4ed8;
  background: #eff6ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(29, 78, 216, 0.15);
}

.task-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.task-quarter {
  font-size: 12px;
  color: #64748b;
}

.task-rating {
  font-size: 13px;
  color: #475569;
}

.task-description {
  margin-top: 8px;
  font-size: 13px;
  color: #1e293b;
  line-height: 1.5;
  padding: 8px;
  background: #f1f5f9;
  border-radius: 6px;
}

.task-initiator {
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}
@media (max-width: 960px) {
  .hero-panel,
  .metric-grid,
  .content-grid,
  .quick-links {
    grid-template-columns: 1fr;
  }
  .hero-panel { padding: 22px; }
}
</style>
