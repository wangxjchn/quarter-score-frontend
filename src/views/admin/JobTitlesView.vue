<template>
  <div class="page admin-page">
    <section class="admin-hero">
      <div>
        <p class="section-chip">Admin</p>
        <h2>职称管理</h2>
        <p>维护员工职称库。职称用于显示成员在小组中的职位定义，区别于薪资职级（junior/mid/senior）。</p>
      </div>
      <div class="hero-actions">
        <div class="hero-badge">
          <strong>{{ titles.length }}</strong>
          <span>当前职称数</span>
        </div>
        <el-button type="primary" class="hero-button" @click="openAdd">新增职称</el-button>
      </div>
    </section>

    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>
    <el-empty v-else-if="titles.length === 0" description="暂无职称，请点击右上角「新增职称」" />
    <div v-else class="titles-grid">
      <article
        v-for="t in titles"
        :key="t.id"
        class="title-card"
      >
        <div class="title-card__main">
          <div class="title-card__avatar">{{ t.name.charAt(0) }}</div>
          <strong class="title-card__name">{{ t.name }}</strong>
        </div>
        <div class="card-acts">
          <button class="act-btn act-btn--edit" title="编辑" @click.stop="openEdit(t)">
            <el-icon><Edit /></el-icon>
          </button>
          <button class="act-btn act-btn--del" title="删除" @click.stop="handleDelete(t)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>
      </article>
    </div>

    <el-dialog v-model="dlgVisible" :title="editingId ? '编辑职称' : '新增职称'" width="360px">
      <el-form :model="form" label-position="top">
        <el-form-item label="职称名称">
          <el-input v-model="form.name" placeholder="如：高级工程师、产品经理、UI 设计师…" />
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
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading, Edit, Delete } from '@element-plus/icons-vue';
import { api } from '../../api';

const titles     = ref([]);
const loading    = ref(false);
const saving     = ref(false);
const dlgVisible = ref(false);
const editingId  = ref(null);
const form       = reactive({ name: '' });

async function fetchTitles() {
  loading.value = true;
  try   { titles.value = await api.get('/api/job-titles'); }
  catch  { ElMessage.error('加载失败'); }
  finally { loading.value = false; }
}

function openAdd() {
  editingId.value  = null;
  form.name        = '';
  dlgVisible.value = true;
}

function openEdit(t) {
  editingId.value  = t.id;
  form.name        = t.name;
  dlgVisible.value = true;
}

async function handleSave() {
  if (!form.name.trim()) { ElMessage.warning('职称名称不能为空'); return; }
  saving.value = true;
  try {
    if (editingId.value) {
      await api.put(`/api/job-titles/${editingId.value}`, { name: form.name });
      ElMessage.success('更新成功');
    } else {
      await api.post('/api/job-titles', { name: form.name });
      ElMessage.success('创建成功');
    }
    dlgVisible.value = false;
    await fetchTitles();
  } catch (e) {
    ElMessage.error(e?.error || '操作失败');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(t) {
  await ElMessageBox.confirm(`确认删除职称「${t.name}」？`, '提示', { type: 'warning' });
  try {
    await api.delete(`/api/job-titles/${t.id}`);
    ElMessage.success('删除成功');
    await fetchTitles();
  } catch (e) {
    ElMessage.error(e?.error || '删除失败');
  }
}

onMounted(fetchTitles);
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

/* ── Card grid ── */
.titles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}
.title-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  transition: box-shadow .2s;
}
.title-card__main {
  padding: 18px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.title-card__avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1d4ed8, #06b6d4);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
}
.title-card__name { font-size: 16px; color: #1e293b; font-weight: 600; }
.card-acts {
  position: absolute;
  right: 8px;
  top: 8px;
  display: flex;
  flex-direction: row;
  gap: 6px;
}
.title-card:hover { box-shadow: 0 8px 24px rgba(29, 78, 216, 0.1); }
.act-btn {
  width: 30px; height: 30px; border: none; border-radius: 8px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 14px; transition: background .12s;
}
.act-btn--edit { background: rgba(59,130,246,.12); color: #1d4ed8; }
.act-btn--edit:hover { background: rgba(59,130,246,.22); }
.act-btn--del  { background: rgba(239,68,68,.1); color: #dc2626; }
.act-btn--del:hover { background: rgba(239,68,68,.2); }

@media (max-width: 768px) {
  .admin-hero    { flex-direction: column; padding: 20px; }
  .hero-actions  { width: 100%; align-items: stretch; }
  .titles-grid   { grid-template-columns: 1fr; }
}
</style>
