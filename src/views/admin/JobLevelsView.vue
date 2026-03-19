<template>
  <div class="page admin-page">
    <section class="admin-hero">
      <div>
        <p class="section-chip">Admin</p>
        <h2>职级管理</h2>
      </div>
      <div class="hero-actions">
        <div class="hero-badge">
          <strong>{{ filteredLevels.length }}</strong>
          <span>当前职级数</span>
        </div>
        <el-button type="primary" class="hero-button" @click="openAdd">新增职级</el-button>
      </div>
    </section>

    <!-- 搜索过滤栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索职级名称..."
        clearable
        prefix-icon="Search"
        class="search-input"
      />
    </div>

    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>
    <el-empty v-else-if="filteredLevels.length === 0" :description="searchText ? '无匹配结果' : '暂无职级，请点击右上角「新增职级」'" />
    <div v-else class="levels-grid">
      <article
        v-for="level in filteredLevels"
        :key="level.id"
        class="level-card"
      >
        <div class="level-card__main">
          <div class="level-card__avatar" :style="getAvatarStyle(level.name)">{{ level.name.charAt(0) }}</div>
          <strong class="level-card__name">{{ level.name }}</strong>
        </div>
        <div class="card-acts">
          <button class="act-btn act-btn--edit" title="编辑" @click.stop="openEdit(level)">
            <el-icon><Edit /></el-icon>
          </button>
          <button class="act-btn act-btn--del" title="删除" @click.stop="handleDelete(level)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>
      </article>
    </div>

    <el-dialog v-model="dlgVisible" :title="editingId ? '编辑职级' : '新增职级'" class="admin-dialog">
      <el-form :model="form" label-position="top">
        <el-form-item label="职级名称">
          <el-input v-model="form.name" placeholder="如：初级、中级、高级" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlgVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading, Edit, Delete } from '@element-plus/icons-vue';
import { api } from '../../api';

const levels     = ref([]);
const searchText = ref('');
const loading    = ref(false);
const saving     = ref(false);
const dlgVisible = ref(false);
const editingId  = ref(null);
const form       = reactive({ name: '' });

const filteredLevels = computed(() => {
  if (!searchText.value.trim()) return levels.value;
  const keyword = searchText.value.toLowerCase();
  return levels.value.filter(level => 
    level.name.toLowerCase().includes(keyword)
  );
});

async function fetchLevels() {
  loading.value = true;
  try {
    levels.value = await api.get('/api/job-levels');
  } catch {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
}

function openAdd() {
  editingId.value  = null;
  form.name        = '';
  dlgVisible.value = true;
}

function openEdit(level) {
  editingId.value  = level.id;
  form.name        = level.name;
  dlgVisible.value = true;
}

async function handleSave() {
  if (!form.name.trim()) {
    ElMessage.warning('职级名称不能为空');
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await api.put(`/api/job-levels/${editingId.value}`, { name: form.name });
      ElMessage.success('更新成功');
    } else {
      await api.post('/api/job-levels', { name: form.name });
      ElMessage.success('创建成功');
    }
    dlgVisible.value = false;
    await fetchLevels();
  } catch (e) {
    ElMessage.error(e?.error || '操作失败');
  } finally {
    saving.value = false;
  }
}

function getAvatarStyle(name) {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return { background: colors[index] };
}

async function handleDelete(level) {
  await ElMessageBox.confirm(`确认删除职级「${level.name}」？`, '提示', { type: 'warning' });
  try {
    await api.delete(`/api/job-levels/${level.id}`);
    ElMessage.success('删除成功');
    await fetchLevels();
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e?.error || '删除失败');
    }
  }
}

onMounted(fetchLevels);
</script>

<style scoped>
.page { padding: 8px 0 0; }
.admin-page { display: flex; flex-direction: column; gap: 18px; }
.admin-hero {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(230, 240, 255, .88));
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 24px;
}
.section-chip {
  margin: 0 0 8px;
  color: #1d4ed8;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .1em;
  font-weight: 700;
}
.admin-hero h2 { margin: 0 0 8px; font-size: 32px; }
.admin-hero p  { margin: 0; max-width: 680px; color: #60708a; line-height: 1.75; }
.hero-actions  { display: flex; flex-direction: column; gap: 12px; align-items: flex-end; min-width: 180px; }
.hero-badge {
  padding: 18px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1d4ed8, #06b6d4);
  color: #fff;
  text-align: right;
  box-shadow: 0 12px 24px rgba(29, 78, 216, 0.25);
}
.hero-badge strong { display: block; font-size: 28px; }
.hero-badge span   { font-size: 13px; opacity: .86; }
.hero-button       { min-width: 132px; border-radius: 10px; }
.loading-wrap      { text-align: center; padding: 48px 0; color: #94a3b8; }

/* ── Search bar ── */
.search-bar {
  margin-bottom: 18px;
}
.search-input {
  width: 100%;
}

/* ── Card grid ── */
.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.level-card {
  position: relative;
  overflow: visible;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  transition: box-shadow .2s;
  display: flex;
  flex-direction: column;
}
.level-card__main {
  padding: 18px 16px 18px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}
.level-card__avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}
.level-card__name {
  font-size: 16px;
  color: #1e293b;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.card-acts {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(248, 250, 252, 0.4);
  border-radius: 0 0 16px 16px;
}
.act-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all .15s;
  flex-shrink: 0;
}
.act-btn--edit { background: rgba(59,130,246,.12); color: #1d4ed8; }
.act-btn--edit:hover { background: rgba(59,130,246,.22); }
.act-btn--del  { background: rgba(239,68,68,.1); color: #dc2626; }
.act-btn--del:hover { background: rgba(239,68,68,.2); }

@media (max-width: 768px) {
  .admin-hero    { flex-direction: column; padding: 20px; }
  .hero-actions  { width: 100%; align-items: stretch; }
  .levels-grid   { grid-template-columns: 1fr; }
}
</style>
