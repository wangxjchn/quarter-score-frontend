<template>
  <div class="page">
    <section class="admin-hero">
      <div>
        <p class="section-chip">评分进度</p>
        <h2>评分任务进度一览</h2>
        <p>按评分活动展示任务状态与节点历史</p>
      </div>
      <div class="hero-actions">
        <el-button @click="$router.push('/evaluation/ratings')">返回列表</el-button>
      </div>
    </section>

    <div v-if="loading" class="loading-wrap"><el-icon class="is-loading"><Loading /></el-icon> 加载中...</div>
    <div v-else-if="progress.tasks.length === 0" class="empty-state">
      <el-empty description="暂无任务" />
    </div>
    <div v-else class="task-cards">
      <el-card v-for="task in progress.tasks" :key="'task_' + task.id" class="task-card">
        <div class="task-card-content">
          <!-- 主要内容区 -->
          <div class="main-content">
            <!-- 第一行：状态 + 任务名 + 类型 + 进度条 + 进度数字 -->
            <div class="top-row">
              <div class="left-section">
                <el-tag :type="getTaskStatusTagType(task)" size="small" class="status-tag">
                  {{ isTaskFullyCompleted(task) ? '已完成' : '未完成' }}
                </el-tag>
                <h3 class="task-name">{{ task.name || '未命名任务' }}</h3>
                <el-tag :type="getTaskTagType(task.type)" size="small" class="type-tag">
                  {{ getTaskTypeName(task.type) }}
                </el-tag>
                <div class="progress-wrapper">
                  <el-progress 
                    :percentage="calculateOverallProgress(task)" 
                    :status="isTaskFullyCompleted(task) ? 'success' : undefined"
                    :stroke-width="6"
                    :show-text="false"
                  />
                </div>
                <span class="progress-number">
                  {{ calculateCompletedCount(task) }} / {{ task.progresses ? task.progresses.length : 0 }}
                </span>
              </div>
            </div>
            
            <!-- 第二行：创建者 + 时间（左）展开按钮（右） -->
            <div class="bottom-row">
              <div class="meta-info">
                <span class="meta-item">
                  <el-icon><User /></el-icon>
                  {{ task.creator_name || '未知' }}
                </span>
                <span class="meta-divider">•</span>
                <span class="meta-item">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(task.created_at) }}
                </span>
              </div>
              <el-button 
                class="expand-btn" 
                type="text" 
                @click="toggleDetail(task.id)"
                :icon="expandedTask === task.id ? ArrowUp : ArrowDown"
              >
                {{ expandedTask === task.id ? '收起' : '展开详情' }}
              </el-button>
            </div>
          </div>
        </div>
        
        <!-- 展开的详细信息（纵向时间轴） -->
        <div v-if="expandedTask === task.id" class="detail-timeline">
          <div v-if="!task.progresses || task.progresses.length === 0" class="empty-detail">
            <el-empty :image-size="60" description="暂无进度数据" />
          </div>
          
          <div v-else class="timeline-list">
            <div v-for="(prog, idx) in task.progresses" :key="idx" class="timeline-item">
              <div class="timeline-marker">
                <div class="timeline-dot" :class="getDotClass(prog)"></div>
                <div class="timeline-line" v-if="idx < task.progresses.length - 1"></div>
              </div>
              
              <div class="timeline-content">
                <div class="user-info">
                  <span class="user-name">{{ prog.user?.name || '未知' }}</span>
                  <span class="user-status" :class="getStatusClass(prog)">
                    {{ getStatusText(prog) }}
                  </span>
                </div>
                
                <div class="progress-desc">
                  {{ getProgressDescription(prog) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Loading, User, Clock, ArrowUp, ArrowDown } from '@element-plus/icons-vue';
import { api } from '../../api';

const route = useRoute();
const ratingId = route.params.id;
const progress = ref({ tasks: [] });
const loading = ref(true);
const expandedTask = ref(null);

function toggleDetail(taskId) {
  expandedTask.value = expandedTask.value === taskId ? null : taskId;
}

// 获取任务类型标签
function getTaskTagType(type) {
  const typeMap = {
    'leader_assigned': 'warning',
    'direct': 'success'
  };
  return typeMap[type] || 'info';
}

// 获取任务类型名称
function getTaskTypeName(type) {
  const typeMap = {
    'leader_assigned': '关系指定',
    'direct': '直接评分'
  };
  return typeMap[type] || '未知';
}

// 获取任务状态标签类型
function getTaskStatusTagType(task) {
  if (isTaskFullyCompleted(task)) {
    return 'success'; // 已完成 - 绿色
  }
  return 'info'; // 未完成 - 灰色
}

// 获取状态标签类型
function getStatusTagType(status) {
  const statusMap = {
    'draft': 'info',
    'active': 'success',
    'completed': 'success',
    'closed': 'danger'
  };
  return statusMap[status] || 'info';
}

// 获取状态名称
function getStatusName(status) {
  const statusMap = {
    'draft': '草稿',
    'active': '进行中',
    'completed': '已完成',
    'closed': '已关闭'
  };
  return statusMap[status] || status;
}

// 计算进度百分比
function calculateProgress(task) {
  if (task.total_reviewees === 0) return 0;
  return Math.round((task.complete_reviewees / task.total_reviewees) * 100);
}

// 计算已完成数量（根据 progresses 数组）
function calculateCompletedCount(task) {
  if (!task.progresses || task.progresses.length === 0) return 0;
  
  return task.progresses.filter(prog => {
    // 已指定且完成数等于总数（或 total 为 0 表示已完成）
    if (prog.assigned === true || prog.assigned === 1) {
      return prog.completed >= prog.total && prog.total > 0;
    }
    // 未指定的情况，不计算在已完成内
    return false;
  }).length;
}

// 计算总进度百分比
function calculateOverallProgress(task) {
  if (!task.progresses || task.progresses.length === 0) return 0;
  const completed = calculateCompletedCount(task);
  return Math.round((completed / task.progresses.length) * 100);
}

// 判断任务是否完全完成
function isTaskFullyCompleted(task) {
  if (!task.progresses || task.progresses.length === 0) return false;
  return calculateCompletedCount(task) === task.progresses.length;
}

// 获取时间轴圆点样式类
function getDotClass(prog) {
  if (prog.assigned === false || prog.assigned === 0) {
    return 'dot-gray'; // 未指定
  }
  if (prog.completed >= prog.total && prog.total > 0) {
    return 'dot-green'; // 已完成
  }
  return 'dot-gray'; // 未完成
}

// 获取状态样式类
function getStatusClass(prog) {
  if (prog.assigned === false || prog.assigned === 0) {
    return 'status-unassigned';
  }
  if (prog.completed >= prog.total && prog.total > 0) {
    return 'status-completed';
  }
  return 'status-incomplete';
}

// 获取状态文本
function getStatusText(prog) {
  if (prog.assigned === false || prog.assigned === 0) {
    return '未指定';
  }
  if (prog.completed >= prog.total && prog.total > 0) {
    return '已完成';
  }
  return `${prog.completed}/${prog.total}`;
}

// 生成进度描述信息
function getProgressDescription(prog) {
  // 未指定评分人
  if (prog.assigned === false || prog.assigned === 0) {
    const unassignedList = prog.unprocessed || [];
    if (unassignedList.length === 0) {
      return '暂未指定评分人';
    }
    if (unassignedList.length <= 3) {
      return `${unassignedList.map(u => u.name).join('、')} 未指定评分人`;
    }
    return `${unassignedList.slice(0, 3).map(u => u.name).join('、')} 等${unassignedList.length}人未指定评分人`;
  }
  
  // 已指定但未完成
  const unprocessedList = prog.unprocessed || [];
  if (unprocessedList.length === 0) {
    return '所有评分人均已完成评分';
  }
  
  if (unprocessedList.length <= 3) {
    return `${unprocessedList.map(u => u.name).join('、')} 未评分`;
  }
  return `${unprocessedList.slice(0, 3).map(u => u.name).join('、')} 等${unprocessedList.length}人未评分`;
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

async function loadProgress() {
  loading.value = true;
  try {
    progress.value = await api.get(`/api/evaluations/ratings/${ratingId}/progress`);
  } catch (error) {
    console.error('加载进度失败', error);
    ElMessage.error('加载进度失败');
  } finally {
    loading.value = false;
  }
}

onMounted(loadProgress);
</script>

<style scoped>
.page { padding:8px 0; }
.admin-hero { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
.loading-wrap, .empty-state { text-align:center; padding: 48px 0; }

/* 任务卡片网格布局 */
.task-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 16px;
}

.task-card {
  border-radius: 8px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.task-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* 卡片内容区（无 header） */
.task-card-content {
  display: flex;
  min-height: 70px;
}

/* 左侧状态条 */
.status-bar {
  width: 6px;
  flex-shrink: 0;
  background: #cbd5e1;
}

.status-bar.status-complete {
  background: #10b981;
}

.status-bar.status-partial {
  background: #f59e0b;
}

.status-bar.status-empty {
  background: #94a3b8;
}

/* 主要内容区 */
.main-content {
  flex: 1;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 第一行：任务名称 + 类型 + 进度 */
.top-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
}

.status-tag {
  font-size: 12px;
  padding: 2px 8px;
}

.task-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 100px;
}

.type-tag {
  font-size: 12px;
  padding: 2px 8px;
  flex-shrink: 0;
}

.progress-wrapper {
  flex: 1;
  min-width: 150px;
  max-width: 300px;
}

.progress-number {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  min-width: 50px;
  text-align: right;
  flex-shrink: 0;
}

/* 第二行：元信息 + 展开按钮 */
.bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 4px;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-divider {
  color: #cbd5e1;
}

.expand-btn {
  font-size: 12px;
  color: #64748b;
  padding: 4px 8px;
}

.expand-btn:hover {
  color: #3b82f6;
}

/* 时间轴详情 */
.detail-timeline {
  margin-top: 0;
  padding: 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.empty-detail {
  text-align: center;
  padding: 20px 0;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-item {
  display: flex;
  gap: 12px;
  position: relative;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 20px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #cbd5e1;
  flex-shrink: 0;
  z-index: 1;
}

.timeline-dot.dot-green {
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.timeline-dot.dot-gray {
  background: #cbd5e1;
}

.timeline-line {
  width: 2px;
  flex-grow: 1;
  background: #e2e8f0;
  margin-top: 4px;
  min-height: 30px;
}

.timeline-content {
  flex: 1;
  padding: 4px 0 20px 0;
  min-width: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.user-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.user-status.status-completed {
  background: #d1fae5;
  color: #065f46;
}

.user-status.status-incomplete {
  background: #fef3c7;
  color: #92400e;
}

.user-status.status-unassigned {
  background: #f1f5f9;
  color: #64748b;
}

.progress-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .task-cards {
    grid-template-columns: 1fr;
  }
  
  .top-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .right-section {
    width: 100%;
    justify-content: flex-end;
  }
  
  .bottom-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .expand-btn {
    align-self: flex-end;
  }
}
</style>
