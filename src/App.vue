<template>
  <el-container class="app-shell">
    <div class="app-shell__bg"></div>

    <el-header v-if="user" class="app-header">
      <div class="header-main">
        <div class="brand-block">
          <div>
            <h1 class="app-brand">季度评分系统</h1>
            <p class="app-subtitle">企业内部季度评分与人员管理平台</p>
          </div>
        </div>

        <div class="desktop-nav">
          <router-link to="/" class="nav-link">首页</router-link>
          <template v-if="user.role === 'admin'">
            <el-dropdown class="nav-link nav-link--dropdown">
              <span class="nav-link-text">人员管理 <el-icon><arrow-down /></el-icon></span>
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
          </template>
          <el-dropdown class="nav-link nav-link--dropdown">
            <span class="nav-link-text">项目文档 <el-icon><arrow-down /></el-icon></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item><a href="/about/requirements/index.html">需求文档</a></el-dropdown-item>
                <el-dropdown-item><a href="/about/analysis/index.html">需求分析</a></el-dropdown-item>
                <el-dropdown-item><a href="/about/user-manual/index.html">使用手册</a></el-dropdown-item>
                <el-dropdown-item><a href="/about/dev-manual/index.html">开发手册</a></el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="header-actions">
          <div class="profile-pill">
            <strong>{{ user.name }}</strong>
            <span>{{ ROLE_LABELS[user.role] }}</span>
          </div>
          <el-button class="logout-btn" @click="handleLogout">退出登录</el-button>
          <el-button class="mobile-menu-btn" @click="drawerVisible = true">菜单</el-button>
        </div>
      </div>
    </el-header>

    <el-main class="app-main">
      <div class="app-main__inner">
        <router-view />
      </div>
    </el-main>

    <el-drawer v-model="drawerVisible" size="78%" direction="rtl" class="mobile-drawer" :with-header="false">
      <div class="mobile-drawer__content" v-if="user">
        <div class="mobile-profile">
          <strong>{{ user.name }}</strong>
          <span>{{ ROLE_LABELS[user.role] }}</span>
        </div>

        <router-link to="/" class="mobile-nav-link" @click="drawerVisible = false">首页</router-link>
        <template v-if="user.role === 'admin'">
          <div class="mobile-docs">
            <p>人员管理</p>
            <router-link to="/admin/users" class="mobile-nav-link"  @click="drawerVisible = false">员工管理</router-link>
            <router-link to="/admin/departments" class="mobile-nav-link" @click="drawerVisible = false">职能管理</router-link>
            <router-link to="/admin/teams" class="mobile-nav-link" @click="drawerVisible = false">群组管理</router-link>
            <router-link to="/admin/job-titles" class="mobile-nav-link" @click="drawerVisible = false">职称管理</router-link>
            <router-link to="/admin/job-levels" class="mobile-nav-link" @click="drawerVisible = false">职级管理</router-link>
          </div>
        </template>

        <div class="mobile-docs">
          <p>项目文档</p>
          <a href="/about/requirements/index.html">需求文档</a>
          <a href="/about/analysis/index.html">需求分析</a>
          <a href="/about/user-manual/index.html">使用手册</a>
          <a href="/about/dev-manual/index.html">开发手册</a>
        </div>

        <el-button class="mobile-logout" @click="handleLogout">退出登录</el-button>
      </div>
    </el-drawer>
  </el-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from './api';
import { state, logout, setUser } from './store';

const router = useRouter();
const drawerVisible = ref(false);
const user = computed(() => state.user);
const ROLE_LABELS = { admin: '管理员', leader: '组长', employee: '员工' };

onMounted(async () => {
  if (!state.user?.employee_id) return;
  try {
    const { user: freshUser } = await api.get('/api/auth/me');
    setUser(freshUser);
  } catch {
    logout();
    router.push('/login');
  }
});

function handleLogout() {
  drawerVisible.value = false;
  logout();
  router.push('/login');
}
</script>

<style>
* { box-sizing: border-box; }
:root {
  --app-bg: #f3f6fb;
  --panel: #ffffff;
  --panel-strong: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --accent: #1d4ed8;
  --accent-cyan: #06b6d4;
  --accent-amber: #fb923c;
  --accent-soft: #dbeafe;
  --border: #e2e8f0;
  --shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}
html, body, #app { min-height: 100%; }
body {
  margin: 0;
  color: var(--text);
  font-family: "Manrope", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  background: var(--app-bg);
}
a { color: inherit; text-decoration: none; }
.app-shell {
  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(circle at 8% 4%, rgba(29, 78, 216, 0.14), transparent 33%),
    radial-gradient(circle at 86% 8%, rgba(6, 182, 212, 0.12), transparent 30%),
    radial-gradient(circle at 76% 92%, rgba(251, 146, 60, 0.14), transparent 31%),
    linear-gradient(180deg, #f9fbff 0%, #f3f6fb 100%);
}
.app-shell__bg {
  display: none;
}
.app-header {
  position: sticky;
  top: 0;
  z-index: 40;
  height: auto !important;
  padding: 0 24px;
  background: rgba(249, 251, 255, 0.9);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(12px);
}
.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  max-width: 1240px;
  margin: 0 auto;
  min-height: 64px;
}
.brand-block { display: flex; align-items: center; min-width: 0; }
.app-brand {
  margin: 0;
  font-size: 20px;
  line-height: 1.1;
  color: var(--text);
  letter-spacing: 0.01em;
  font-weight: 800;
}
.app-subtitle {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 12px;
}
.desktop-nav,
.header-actions,
.nav-link--dropdown,
.profile-pill {
  display: flex;
  align-items: center;
}
.desktop-nav { gap: 20px; }
.nav-link {
  padding: 0;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  line-height: 64px;
  transition: color .18s ease;
}
.nav-link:hover,
.nav-link.router-link-active {
  background: transparent;
  color: var(--text);
}
.nav-link.router-link-active {
  color: var(--accent);
  box-shadow: inset 0 -2px 0 var(--accent);
}
.nav-link--dropdown .el-dropdown-link {
  display: inline-flex;
  align-items: center;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  line-height: 64px;
  transition: color .18s ease;
}
.nav-link--dropdown .el-dropdown-link:hover {
  color: var(--text);
}
.header-actions { gap: 16px; }
.profile-pill {
  gap: 3px;
  padding: 6px 0 6px 10px;
  color: #334155;
  border-left: 2px solid #bfdbfe;
  flex-direction: column;
  align-items: flex-start;
}
.profile-pill strong { font-size: 13px; }
.profile-pill span { font-size: 11px; color: var(--muted); }
.logout-btn,
.mobile-menu-btn,
.mobile-logout {
  border-radius: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  color: #475569 !important;
  font-weight: 600 !important;
}
.logout-btn:hover,
.mobile-menu-btn:hover,
.mobile-logout:hover {
  color: var(--accent) !important;
  background: transparent !important;
}
.logout-btn,
.mobile-menu-btn {
  line-height: 64px !important;
}
.mobile-menu-btn { display: none !important; }
.app-main {
  padding: 18px 24px 28px !important;
  background: transparent !important;
}
.app-main__inner {
  max-width: 1200px;
  margin: 0 auto;
}
.mobile-drawer__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 18px;
}
.mobile-profile {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--accent), var(--accent-cyan));
  color: #fff;
  box-shadow: 0 10px 22px rgba(29, 78, 216, 0.24);
}
.mobile-nav-link {
  display: block;
  padding: 12px 14px;
  border-radius: 12px;
  color: #1e293b;
  font-weight: 600;
}

.mobile-docs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #f8fafc;
}
.mobile-docs p {
  margin: 0 0 4px;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.mobile-docs a {
  padding: 8px 0;
  color: #10233c;
  font-weight: 600;
}

/* ── Admin Dialog Responsive ── */
:deep(.admin-dialog) {
  /* 桌面端：固定比例 70% 宽度，最大 600px */
  width: 70vw !important;
  max-width: 600px !important;
}

.admin-dialog{
  /* 桌面端：固定比例 70% 宽度，最大 600px */
  width: 70vw !important;
  max-width: 600px !important;
}


@media (max-width: 768px) {
  /* 移动端：与页面宽度一致（减去边距） */
  :deep(.admin-dialog) {
    width: calc(100vw - 32px) !important; /* 左右各 16px 边距 */
    max-width: none !important;
  }

  .admin-dialog{
    width: calc(100vw - 32px) !important; /* 左右各 16px 边距 */
    max-width: none !important;
  }


}

@media (max-width: 960px) {
  .app-header { padding: 0 14px; }
  .header-main {
    min-height: 54px;
  }
  .desktop-nav,
  .profile-pill,
  .logout-btn {
    display: none !important;
  }
  .header-actions {
    justify-content: flex-end;
  }
  .mobile-menu-btn {
    display: inline-flex !important;
    align-items: center;
    line-height: 54px !important;
  }
  .app-brand { font-size: 18px; }
  .app-main { padding: 14px 14px 24px !important; }
}

/* ── Element Plus Message 位置调整到右下角 ── */
:deep(.el-message) {
  top: auto !important;
  bottom: 20px !important;
  right: 20px !important;
  left: auto !important;
  transform: none !important; /* 覆盖默认的居中变换 */
}

/* 确保消息容器也在右下角 */
:deep(.el-message-container) {
  position: fixed !important;
  top: auto !important;
  bottom: 20px !important;
  right: 20px !important;
  left: auto !important;
}
</style>
