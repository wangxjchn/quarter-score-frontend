<template>
  <div class="login-bg">
    <div class="login-shell">
      <section class="login-hero">
        <div class="hero-chip">Mobile Ready</div>
        <h1>让季度评分流程更清晰、更轻、更可控</h1>
        <p>
          统一处理员工登录、小组管理、员工管理与后续评分流程，支持手机预览和现代化后台界面。
        </p>

        <div class="hero-grid">
          <div class="hero-card">
            <strong>工号即登录</strong>
            <span>无密码模式，适合内部系统快速启用</span>
          </div>
          <div class="hero-card">
            <strong>管理入口清晰</strong>
            <span>管理员可直接维护员工与小组基础数据</span>
          </div>
          <div class="hero-card">
            <strong>为后续评分扩展预留</strong>
            <span>当前结构已适配季度评分平台后续功能演进</span>
          </div>
        </div>
      </section>

      <el-card class="login-card">
        <div class="login-card__header">
          <div>
            <p class="login-eyebrow">Employee Access</p>
            <h2>登录系统</h2>
          </div>
          <span class="login-badge">内部平台</span>
        </div>

        <el-form @submit.prevent="handleLogin" label-position="top">
          <el-form-item label="工号">
            <el-input v-model="form.employee_id" placeholder="请输入工号" size="large" clearable />
          </el-form-item>

          <template v-if="needBootstrap">
            <el-form-item label="姓名（可选）">
              <el-input v-model="form.name" placeholder="留空则与工号相同" size="large" />
            </el-form-item>
            <el-form-item label="安全码">
              <el-input v-model="form.security_code" type="password" placeholder="系统初始安全码" size="large" show-password />
            </el-form-item>
            <el-alert type="warning" :closable="false" class="login-alert">
              系统暂无账号，请输入安全码以初始化第一个管理员账号。
            </el-alert>
          </template>

          <el-button type="primary" native-type="submit" :loading="loading" size="large" class="login-submit">
            {{ needBootstrap ? '初始化并登录' : '登录' }}
          </el-button>

          <el-alert v-if="errMsg" type="error" :description="errMsg" :closable="false" class="login-alert" show-icon />
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { setUser } from '../store';

const router = useRouter();
const loading      = ref(false);
const errMsg       = ref('');
const needBootstrap = ref(false);
const form = reactive({ employee_id: '', name: '', security_code: '' });

async function handleLogin() {
  errMsg.value = '';
  const eid = form.employee_id.trim();
  if (!eid) { errMsg.value = '请输入工号'; return; }
  loading.value = true;
  try {
    const body = { employee_id: eid };
    if (needBootstrap.value) {
      body.name          = form.name.trim();
      body.security_code = form.security_code;
    }
    const { user } = await api.post('/api/auth/login', body);
    setUser(user);
    router.push('/');
  } catch (e) {
    if (e?.needSecurityCode) {
      needBootstrap.value = true;
      errMsg.value = e.error || '';
    } else {
      errMsg.value = e?.error || '登录失败，请重试';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-bg {
  min-height: 100vh;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top left, rgba(15, 118, 110, 0.18), transparent 28%),
    radial-gradient(circle at bottom right, rgba(249, 115, 22, 0.18), transparent 30%),
    linear-gradient(135deg, #f8fafc 0%, #eef7f4 100%);
}
.login-shell {
  width: min(1120px, 100%);
  display: grid;
  grid-template-columns: 1.2fr 0.9fr;
  gap: 24px;
  align-items: stretch;
}
.login-hero,
.login-card {
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
}
.login-hero {
  padding: 34px;
  color: #10233c;
  background: linear-gradient(145deg, rgba(255,255,255,.92), rgba(220,252,231,.78));
}
.hero-chip,
.login-eyebrow {
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.hero-chip {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 999px;
  background: #10233c;
  color: #fff;
}
.login-hero h1 {
  margin: 18px 0 14px;
  font-size: clamp(30px, 4vw, 52px);
  line-height: 1.02;
}
.login-hero p {
  max-width: 520px;
  color: #4b5563;
  font-size: 16px;
  line-height: 1.7;
}
.hero-grid {
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.hero-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(255,255,255,.74);
}
.hero-card strong { font-size: 16px; }
.hero-card span { color: #60708a; line-height: 1.65; font-size: 14px; }
.login-card {
  padding: 8px;
  align-self: center;
  background: rgba(255,255,255,.86);
  backdrop-filter: blur(14px);
}
.login-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 14px;
}
.login-card__header h2 {
  margin: 4px 0 0;
  font-size: 28px;
}
.login-eyebrow { color: #0f766e; margin: 0; }
.login-badge {
  padding: 8px 12px;
  border-radius: 999px;
  background: #edf7f5;
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
}
.login-submit {
  width: 100%;
  min-height: 48px;
  border-radius: 16px;
  margin-top: 6px;
}
.login-alert { margin-top: 12px; }
@media (max-width: 960px) {
  .login-bg { padding: 14px; }
  .login-shell { grid-template-columns: 1fr; }
  .login-hero { padding: 24px; }
  .hero-grid { grid-template-columns: 1fr; }
}
</style>
