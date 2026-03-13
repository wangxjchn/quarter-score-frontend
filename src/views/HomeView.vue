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
          <strong>{{ user?.team_name || '未分配' }}</strong>
          <span>所属小组</span>
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
          <router-link v-if="user?.role === 'admin'" to="/admin/teams" class="quick-link">进入小组管理</router-link>
          <router-link v-if="user?.role === 'admin'" to="/admin/users" class="quick-link">进入员工管理</router-link>
          <a href="/about/analysis/index.html" class="quick-link">查看需求分析</a>
        </div>
      </el-card>

      <el-card class="surface-card info-card" shadow="never">
        <template #header>
          <div class="card-head">
            <span>平台摘要</span>
            <small>面向下一步功能开发</small>
          </div>
        </template>
        <ul class="info-list">
          <li>支持工号登录与管理员基础数据维护</li>
          <li>支持手机端预览，管理表格已适配小屏滚动与卡片视图</li>
          <li>页面风格已统一为更现代的半透明卡片 + 渐变背景方案</li>
        </ul>
      </el-card>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { state } from '../store';

const user = computed(() => state.user);
const ROLE_MAP = { admin: '管理员', leader: '组长', employee: '员工' };
const roleLabel = computed(() => ROLE_MAP[user.value?.role] || user.value?.role);
</script>

<style scoped>
.page { padding: 8px 0 0; }
.home-page { display: flex; flex-direction: column; gap: 18px; }
.hero-panel {
  display: grid;
  grid-template-columns: 1.4fr .8fr;
  gap: 18px;
  padding: 28px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(255,255,255,.84), rgba(216, 245, 240, .8));
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.06);
}
.section-chip {
  margin: 0 0 8px;
  color: #0f766e;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.hero-panel h2 { margin: 0; font-size: clamp(28px, 5vw, 42px); }
.hero-copy {
  max-width: 640px;
  margin: 14px 0 0;
  color: #60708a;
  line-height: 1.8;
}
.hero-side {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
.hero-stat,
.metric-card,
.surface-card {
  border-radius: 24px;
}
.hero-stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 120px;
  padding: 20px;
  background: rgba(255,255,255,.72);
}
.hero-stat strong { font-size: 22px; }
.hero-stat span { margin-top: 6px; color: #60708a; }
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.metric-card {
  padding: 20px;
  color: #fff;
  min-height: 170px;
}
.metric-card span { font-size: 13px; opacity: .82; }
.metric-card strong { display: block; margin: 16px 0 12px; font-size: 28px; }
.metric-card p { margin: 0; line-height: 1.75; }
.metric-card--teal { background: linear-gradient(135deg, #0f766e, #14b8a6); }
.metric-card--navy { background: linear-gradient(135deg, #10233c, #334155); }
.metric-card--sand { background: linear-gradient(135deg, #b45309, #f59e0b); }
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.surface-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255,255,255,.78);
  backdrop-filter: blur(16px);
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
  min-height: 74px;
  padding: 18px;
  border-radius: 18px;
  background: #f8fafc;
  color: #10233c;
  font-weight: 600;
}
.quick-link--primary {
  background: linear-gradient(135deg, #10233c, #0f766e);
  color: #fff;
}
.info-list {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  line-height: 1.9;
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
