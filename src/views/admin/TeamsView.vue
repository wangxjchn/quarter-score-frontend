<template>
  <div class="page admin-page">
    <section class="admin-hero">
      <div>
        <p class="section-chip">Admin</p>
        <h2>小组管理</h2>
        <p>维护组织中的小组数据，后续会作为评分关系、评级计算和结余管理的基础维度。</p>
      </div>
      <div class="hero-actions">
        <div class="hero-badge">
          <strong>{{ teams.length }}</strong>
          <span>当前小组数</span>
        </div>
        <el-button type="primary" class="hero-button" @click="openAdd">新增小组</el-button>
      </div>
    </section>

    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>
    <el-empty v-else-if="teams.length === 0" description="暂无小组" />
    <div v-else class="teams-grid" @click="swipedId = null">
      <article
        v-for="team in teams"
        :key="team.id"
        class="team-card"
        :class="{ 'is-swiped': swipedId === team.id }"
        @touchstart.passive="onTouchStart"
        @touchend.passive="e => onTouchEnd(e, team.id)"
      >
        <div class="team-card__main">
          <h3 class="team-card__name">{{ team.name }}</h3>
          <span class="team-card__count">{{ team.member_count }} 人</span>
        </div>
        <div class="card-acts">
          <button class="act-btn act-btn--view" title="查看成员" @click.stop="goMembers(team)">
            <el-icon><UserFilled /></el-icon>
          </button>
          <button class="act-btn act-btn--edit" title="编辑" @click.stop="openEdit(team)">
            <el-icon><Edit /></el-icon>
          </button>
          <button class="act-btn act-btn--del" title="删除" @click.stop="handleDelete(team)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>
      </article>
    </div>

    <el-dialog v-model="dlgVisible" :title="editingId ? '编辑小组' : '新增小组'" width="360px">
      <el-form :model="form" label-position="top">
        <el-form-item label="小组名称">
          <el-input v-model="form.name" placeholder="请输入小组名称" />
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
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading, Edit, Delete, UserFilled } from '@element-plus/icons-vue';
import { api } from '../../api';

const router     = useRouter();
const teams      = ref([]);
const loading    = ref(false);
const saving     = ref(false);
const dlgVisible = ref(false);
const editingId  = ref(null);
const form       = reactive({ name: '' });

let _tx0 = 0;
const swipedId = ref(null);
function onTouchStart(e) { _tx0 = e.touches[0].clientX; }
function onTouchEnd(e, id) {
  const dx = _tx0 - e.changedTouches[0].clientX;
  if (dx > 40) swipedId.value = id;
  else if (dx < -10) swipedId.value = null;
}

function goMembers(team) {
  router.push(`/admin/teams/${team.id}/members`);
}

async function fetchTeams() {
  loading.value = true;
  try   { teams.value = await api.get('/api/teams'); }
  catch  { ElMessage.error('加载小组失败'); }
  finally { loading.value = false; }
}

function openAdd() {
  editingId.value  = null;
  form.name        = '';
  dlgVisible.value = true;
}

function openEdit(row) {
  editingId.value  = row.id;
  form.name        = row.name;
  dlgVisible.value = true;
}

async function handleSave() {
  if (!form.name.trim()) { ElMessage.warning('小组名称不能为空'); return; }
  saving.value = true;
  try {
    if (editingId.value) {
      await api.put(`/api/teams/${editingId.value}`, { name: form.name });
      ElMessage.success('更新成功');
    } else {
      await api.post('/api/teams', { name: form.name });
      ElMessage.success('创建成功');
    }
    dlgVisible.value = false;
    await fetchTeams();
  } catch (e) {
    ElMessage.error(e?.error || '操作失败');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确认删除小组「${row.name}」？`, '提示', { type: 'warning' });
  try {
    await api.delete(`/api/teams/${row.id}`);
    ElMessage.success('删除成功');
    await fetchTeams();
  } catch (e) {
    ElMessage.error(e?.error || '删除失败');
  }
}

onMounted(fetchTeams);
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
.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.team-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
  transition: box-shadow .2s;
}
.team-card__main {
  padding: 20px 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform .22s ease;
}
.team-card__name  { margin: 0; font-size: 18px; font-weight: 700; color: #1e293b; }
.team-card__count { font-size: 13px; color: #64748b; }
.card-acts {
  position: absolute; right: 0; top: 0; bottom: 0;
  display: flex; flex-direction: column; justify-content: center; gap: 6px;
  padding: 8px;
  background: linear-gradient(90deg, transparent, rgba(248,251,255,.96) 30%);
}
@media (hover: hover) {
  .card-acts { opacity: 0; transition: opacity .18s; }
  .team-card:hover .card-acts { opacity: 1; }
  .team-card:hover { box-shadow: 0 8px 28px rgba(29, 78, 216, 0.12); }
}
@media (hover: none) {
  .team-card.is-swiped .team-card__main { transform: translateX(-90px); }
}
.act-btn {
  width: 34px; height: 34px; border: none; border-radius: 10px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 16px; transition: background .12s;
}
.act-btn--view { background: rgba(6,182,212,.12); color: #0891b2; }
.act-btn--view:hover { background: rgba(6,182,212,.22); }
.act-btn--edit { background: rgba(59,130,246,.12); color: #1d4ed8; }
.act-btn--edit:hover { background: rgba(59,130,246,.22); }
.act-btn--del  { background: rgba(239,68,68,.1); color: #dc2626; }
.act-btn--del:hover { background: rgba(239,68,68,.2); }

@media (max-width: 768px) {
  .admin-hero  { flex-direction: column; padding: 20px; }
  .hero-actions { width: 100%; align-items: stretch; }
  .teams-grid  { grid-template-columns: 1fr; }
}
</style>
