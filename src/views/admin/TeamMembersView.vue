<template>
  <div class="page members-page">
    <section class="page-header">
      <el-button class="back-btn" @click="$router.back()"> 返回</el-button>
      <div class="header-title">
        <p class="section-chip">小组成员</p>
        <h2>{{ teamName }}</h2>
      </div>
      <el-button type="primary" class="add-member-btn" @click="openAddMember">
        <el-icon style="margin-right:4px"><Plus /></el-icon>添加成员
      </el-button>
    </section>

    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>
    <el-empty v-else-if="members.length === 0" description="该小组暂无成员" />
    <div v-else class="members-grid" @click="swipedId = null">
      <article
        v-for="m in members"
        :key="m.id"
        class="member-card"
        :class="{ 'is-swiped': swipedId === m.id }"
        @touchstart.passive="onTouchStart"
        @touchend.passive="e => onTouchEnd(e, m.id)"
      >
        <div class="member-card__main">
          <div class="member-card__avatar">{{ m.name.charAt(0) }}</div>
          <div class="member-card__info">
            <strong>{{ m.name }}</strong>
            <span>{{ m.title_name || '' }}</span>
          </div>
        </div>
        <div class="card-acts">
          <button class="act-btn act-btn--del" title="移出小组" @click.stop="removeMember(m)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>
      </article>
    </div>

    <el-dialog v-model="addDlgVisible" title="添加成员" width="380px">
      <el-form label-position="top">
        <el-form-item label="选择员工">
          <el-select
            v-model="selectedUserId"
            placeholder="搜索员工姓名或工号"
            filterable
            style="width:100%"
          >
            <el-option
              v-for="u in availableUsers"
              :key="u.id"
              :label="`${u.name}（${u.employee_id}）`"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDlgVisible = false">取消</el-button>
        <el-button type="primary" :loading="addSaving" @click="confirmAdd">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading, Plus, Delete } from '@element-plus/icons-vue';
import { api } from '../../api';

const route          = useRoute();
const teamName       = ref('');
const members        = ref([]);
const allUsers       = ref([]);
const loading        = ref(false);
const addDlgVisible  = ref(false);
const addSaving      = ref(false);
const selectedUserId = ref(null);

let _tx0 = 0;
const swipedId = ref(null);
function onTouchStart(e) { _tx0 = e.touches[0].clientX; }
function onTouchEnd(e, id) {
  const dx = _tx0 - e.changedTouches[0].clientX;
  if (dx > 40) swipedId.value = id;
  else if (dx < -10) swipedId.value = null;
}

const availableUsers = computed(() =>
  allUsers.value.filter(u => !members.value.some(m => m.id === u.id))
);

async function fetchData() {
  const id = route.params.id;
  loading.value = true;
  try {
    const [allTeams, memberData, userData] = await Promise.all([
      api.get('/api/teams'),
      api.get(`/api/teams/${id}/members`),
      api.get('/api/users'),
    ]);
    const team     = allTeams.find(t => String(t.id) === String(id));
    teamName.value = team?.name || '小组';
    members.value  = memberData;
    allUsers.value = userData;
  } catch {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
}

function openAddMember() {
  selectedUserId.value = null;
  addDlgVisible.value  = true;
}

async function confirmAdd() {
  if (!selectedUserId.value) { ElMessage.warning('请选择员工'); return; }
  addSaving.value = true;
  try {
    await api.post(`/api/teams/${route.params.id}/members`, { user_id: selectedUserId.value });
    ElMessage.success('添加成功');
    addDlgVisible.value = false;
    members.value = await api.get(`/api/teams/${route.params.id}/members`);
  } catch (e) {
    ElMessage.error(e?.error || '添加失败');
  } finally {
    addSaving.value = false;
  }
}

async function removeMember(m) {
  await ElMessageBox.confirm(`确认将「${m.name}」移出本小组？`, '提示', { type: 'warning' });
  try {
    await api.delete(`/api/teams/${route.params.id}/members/${m.id}`);
    ElMessage.success('已移出');
    members.value = members.value.filter(x => x.id !== m.id);
  } catch (e) {
    ElMessage.error(e?.error || '操作失败');
  }
}

onMounted(fetchData);
</script>

<style scoped>
.page { padding: 8px 0 0; }
.members-page { display: flex; flex-direction: column; gap: 20px; }
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(230,240,255,.88));
  box-shadow: 0 12px 26px rgba(15,23,42,0.06);
  padding: 20px 24px;
}
.header-title   { flex: 1; }
.add-member-btn { flex-shrink: 0; }
.back-btn { align-self: center; flex-shrink: 0; }
.page-header h2 { margin: 4px 0 0; font-size: 28px; }
.section-chip {
  margin: 0 0 4px;
  color: #1d4ed8;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .1em;
  font-weight: 700;
}
.loading-wrap { text-align: center; padding: 48px 0; color: #94a3b8; }
.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
}
.member-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(148,163,184,0.18);
  border-radius: 16px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 4px 14px rgba(15,23,42,0.05);
  transition: box-shadow .2s;
}
.member-card__main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  padding: 24px 16px 20px;
  transition: transform .22s ease;
}
.member-card__avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1d4ed8, #06b6d4);
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.member-card__info strong { display: block; font-size: 15px; color: #1e293b; margin-bottom: 4px; }
.member-card__info span   { font-size: 13px; color: #64748b; }
.card-acts {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: linear-gradient(90deg, transparent, rgba(248,251,255,.96) 30%);
}
@media (hover: hover) {
  .card-acts { opacity: 0; transition: opacity .18s; }
  .member-card:hover .card-acts { opacity: 1; }
  .member-card:hover { box-shadow: 0 8px 24px rgba(29,78,216,0.1); }
}
@media (hover: none) {
  .member-card.is-swiped .member-card__main { transform: translateX(-56px); }
}
.act-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background .12s;
}
.act-btn--del  { background: rgba(239,68,68,.1); color: #dc2626; }
.act-btn--del:hover { background: rgba(239,68,68,.2); }
@media (max-width: 768px) {
  .members-grid { grid-template-columns: 1fr; }
  .member-card__main {
    flex-direction: row;
    align-items: center;
    text-align: left;
    padding: 16px 18px;
    gap: 14px;
  }
}
</style>
