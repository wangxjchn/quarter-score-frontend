<template>
  <el-container class="app-shell">
    <div class="app-shell__bg"></div>

    <el-header v-if="user" class="app-header">
      <div class="header-chip">Quarter Score</div>

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
            <router-link to="/admin/teams" class="nav-link">小组管理</router-link>
            <router-link to="/admin/users" class="nav-link">员工管理</router-link>
          </template>
          <el-dropdown class="nav-link nav-link--dropdown">
            <span class="el-dropdown-link">项目文档</span>
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
          <router-link to="/admin/teams" class="mobile-nav-link" @click="drawerVisible = false">小组管理</router-link>
          <router-link to="/admin/users" class="mobile-nav-link" @click="drawerVisible = false">员工管理</router-link>
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
  --app-bg: #eff3f7;
  --panel: rgba(255, 255, 255, 0.88);
  --panel-strong: #ffffff;
  --text: #14213d;
  --muted: #60708a;
  --accent: #0f766e;
  --accent-soft: #d7f6ef;
  --border: rgba(148, 163, 184, 0.22);
  --shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}
html, body, #app { min-height: 100%; }
body {
  margin: 0;
  color: var(--text);
  font-family: Georgia, "PingFang SC", "Microsoft YaHei", serif;
  background: var(--app-bg);
}
a { color: inherit; text-decoration: none; }
.app-shell {
  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 34%),
    radial-gradient(circle at top right, rgba(30, 64, 175, 0.1), transparent 28%),
    linear-gradient(180deg, #f5fbff 0%, #eef3f8 100%);
}
.app-shell__bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.12) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: linear-gradient(180deg, rgba(0,0,0,.32), transparent 88%);
}
.app-header {
  position: sticky;
  top: 0;
  z-index: 40;
  height: auto !important;
  padding: 18px 24px 0;
  background: transparent;
}
.header-chip {
  display: inline-block;
  margin-bottom: 10px;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(15, 118, 110, 0.2);
  background: rgba(255,255,255,0.72);
  color: var(--accent);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow);
}
.brand-block { display: flex; align-items: center; min-width: 0; }
.app-brand {
  margin: 0;
  font-size: 24px;
  line-height: 1.05;
  color: #10233c;
}
.app-subtitle {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 13px;
}
.desktop-nav,
.header-actions,
.nav-link--dropdown,
.profile-pill {
  display: flex;
  align-items: center;
}
.desktop-nav { gap: 8px; }
.nav-link {
  padding: 10px 14px;
  border-radius: 999px;
  color: #4b5563;
  font-size: 14px;
  font-weight: 600;
  transition: all .18s ease;
}
.nav-link:hover,
.nav-link.router-link-active {
  background: #10233c;
  color: #fff;
}
.header-actions { gap: 12px; }
.profile-pill {
  gap: 10px;
  padding: 10px 14px;
  border-radius: 16px;
  background: rgba(239, 243, 247, 0.9);
  color: #334155;
  flex-direction: column;
  align-items: flex-start;
}
.profile-pill strong { font-size: 14px; }
.profile-pill span { font-size: 12px; color: var(--muted); }
.logout-btn,
.mobile-menu-btn,
.mobile-logout {
  border-radius: 14px !important;
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
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(135deg, #10233c, #0f766e);
  color: #fff;
}
.mobile-nav-link {
  display: block;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f8fafc;
  color: #1e293b;
  font-weight: 600;
}
.mobile-docs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 20px;
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
@media (max-width: 960px) {
  .app-header { padding: 14px 14px 0; }
  .header-chip { margin-bottom: 8px; }
  .header-main {
    align-items: flex-start;
    flex-direction: column;
    border-radius: 22px;
  }
  .desktop-nav,
  .profile-pill,
  .logout-btn {
    display: none !important;
  }
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  .mobile-menu-btn {
    display: inline-flex !important;
    background: #10233c;
    color: #fff;
    border: none;
  }
  .app-brand { font-size: 20px; }
  .app-main { padding: 14px 14px 24px !important; }
}
</style>
