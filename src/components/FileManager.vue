<script setup>
import { ref, computed } from 'vue'

const files = ref([
  {
    id: 1,
    name: 'Документ.pdf',
    size: 234567,
    createdAt: new Date().toISOString(),
    type: 'application/pdf'
  },
  {
    id: 2,
    name: 'Фото.jpg',
    size: 1456789,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    type: 'image/jpeg'
  }
])

const search = ref('')
const typeFilter = ref('')
const darkMode = ref(false)
const viewMode = ref('cards')
const sortBy = ref('name')
const sortDir = ref('asc')
const selectedIds = ref([])
const previewFile = ref(null)
const isDragging = ref(false)

const formClass = computed(() =>
  darkMode.value
    ? 'bg-gray-700 text-gray-100 border-gray-600'
    : 'bg-white text-gray-900 border-gray-300'
)

const fileTypes = computed(() =>
  Array.from(new Set(files.value.map(f => f.type)))
)

const filteredFiles = computed(() =>
  files.value.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.value.toLowerCase())
    const matchesType = typeFilter.value ? f.type === typeFilter.value : true
    return matchesSearch && matchesType
  })
)

const sortedFiles = computed(() => {
  const arr = [...filteredFiles.value]
  arr.sort((a, b) => {
    let v1 = a[sortBy.value]
    let v2 = b[sortBy.value]
    if (sortBy.value === 'createdAt') {
      v1 = new Date(v1).getTime()
      v2 = new Date(v2).getTime()
    }
    if (v1 < v2) return sortDir.value === 'asc' ? -1 : 1
    if (v1 > v2) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })
  return arr
})

const totalFiles = computed(() => sortedFiles.value.length)

const totalSize = computed(() =>
  sortedFiles.value.reduce((sum, f) => sum + f.size, 0)
)

const imageCount = computed(() =>
  sortedFiles.value.filter(f => f.type.startsWith('image/')).length
)

const pdfCount = computed(() =>
  sortedFiles.value.filter(f => f.type === 'application/pdf').length
)

const otherCount = computed(() =>
  sortedFiles.value.length - imageCount.value - pdfCount.value
)

const newestFile = computed(() =>
  sortedFiles.value.length
    ? sortedFiles.value.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b)
    : null
)

const oldestFile = computed(() =>
  sortedFiles.value.length
    ? sortedFiles.value.reduce((a, b) => new Date(a.createdAt) < new Date(b.createdAt) ? a : b)
    : null
)

const largestFile = computed(() =>
  sortedFiles.value.length
    ? sortedFiles.value.reduce((a, b) => a.size > b.size ? a : b)
    : null
)

const averageSize = computed(() =>
  totalFiles.value ? totalSize.value / totalFiles.value : 0
)

function onFilesSelected(e) {
  const arr = Array.from(e.target.files)
  handleFiles(arr)
  e.target.value = ''
}

function handleFiles(fileList) {
  const now = Date.now()

  fileList.forEach((f, i) => {
    files.value.unshift({
      id: now + i,
      name: f.name,
      size: f.size,
      createdAt: new Date().toISOString(),
      type: f.type || 'application/octet-stream'
    })
  })
}

function handleDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    isDragging.value = false
  }
}

function handleDrop(e) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false
  
  const droppedFiles = Array.from(e.dataTransfer.files)
  if (droppedFiles.length > 0) {
    handleFiles(droppedFiles)
  }
}

function deleteFile(file) {
  if (!confirm(`Удалить "${file.name}"?`)) return
  files.value = files.value.filter(f => f.id !== file.id)
  selectedIds.value = selectedIds.value.filter(id => id !== file.id)
}

function deleteSelected() {
  if (!selectedIds.value.length) return
  if (!confirm('Удалить выбранные файлы?')) return
  files.value = files.value.filter(f => !selectedIds.value.includes(f.id))
  selectedIds.value = []
}

function downloadFile(file) {
  alert(`Загрузка файла: ${file.name}`)
}

function toggleSelect(id) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(v => v !== id)
  } else {
    selectedIds.value.push(id)
  }
}

function humanSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  const units = ['KB', 'MB', 'GB', 'TB']
  let i = -1
  do {
    bytes /= 1024
    i++
  } while (bytes >= 1024 && i < units.length - 1)
  return bytes.toFixed(1) + ' ' + units[i]
}

function formattedDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU')
}

function fileSymbol(type) {
  if (!type) return '📁'
  if (type.startsWith('image/')) return '🖼️'
  if (type === 'application/pdf') return '📄'
  if (type.startsWith('video/')) return '🎞️'
  if (type.startsWith('audio/')) return '🎧'
  return '📦'
}
</script>

<template>
  <div 
    class="min-h-screen p-6 transition-colors duration-300" 
    :class="darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <div 
      v-if="isDragging"
      class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm transition-all duration-300"
      @dragover.prevent
      @dragleave="handleDragLeave"
      @drop.prevent.stop="handleDrop"
    >
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-10 max-w-md w-full mx-4 border-4 border-dashed border-blue-500/50 shadow-2xl">
        <div class="text-center">
          <div class="text-6xl mb-6">📂</div>
          <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Перетащите файлы сюда</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">Отпустите, чтобы загрузить файлы в менеджер</p>
          <div class="text-sm text-gray-500 dark:text-gray-400">Поддерживаются любые типы файлов</div>
        </div>
      </div>
      <div class="mt-4 text-white text-sm">
        Или нажмите в любом месте, чтобы отменить
      </div>
    </div>

    <div class="max-w-6xl mx-auto shadow-lg rounded-2xl p-6 transition-colors duration-300" :class="darkMode ? 'bg-gray-800' : 'bg-white'">

      <header class="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-semibold">File Manager</h1>
          <p class="text-sm text-gray-500">Просматривайте, добавляйте и удаляйте файлы</p>
        </div>

        <div class="flex gap-3 flex-wrap">
          <label class="bg-blue-600 text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2">
            <input type="file" class="hidden" multiple @change="onFilesSelected" />
            <span>📁</span>
            <span>Добавить</span>
          </label>

          <select v-model="viewMode" class="border rounded px-2 bg-white text-black">
            <option value="cards">Карточки</option>
            <option value="table">Таблица</option>
          </select>

          <select v-model="sortBy" class="border rounded px-2 bg-white text-black">
            <option value="name">Имя</option>
            <option value="size">Размер</option>
            <option value="createdAt">Дата</option>
          </select>

          <select v-model="sortDir" class="border rounded px-2 bg-white text-black">
            <option value="asc">↑</option>
            <option value="desc">↓</option>
          </select>

          <button class="border px-3 py-2 rounded bg-white hover:bg-gray-50 transition-colors duration-200" :class="darkMode ? 'text-gray-900' : ''" @click="darkMode = !darkMode">
            {{ darkMode ? 'Светлая тема' : 'Тёмная тема' }}
          </button>
        </div>
      </header>

      <div 
        class="mb-6 p-4 border-2 border-dashed rounded-xl text-center transition-all duration-300 hover:border-blue-400 cursor-pointer"
        :class="darkMode ? 'border-gray-600 hover:border-blue-400' : 'border-gray-300 hover:border-blue-400'"
        @click="document.querySelector('input[type=file]')?.click()"
        @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <div class="flex flex-col items-center justify-center p-4">
          <div class="text-4xl mb-3">⬆️</div>
          <h3 class="font-medium mb-1">Drag & Drop загрузка</h3>
          <p class="text-sm text-gray-500 mb-3">Перетащите файлы сюда или <span class="text-blue-500 underline">выберите файлы</span></p>
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <span>📷 Изображения</span>
            <span>•</span>
            <span>📄 PDF</span>
            <span>•</span>
            <span>📦 Другие файлы</span>
          </div>
        </div>
      </div>

      <section class="mb-4 flex gap-3">
        <input v-model="search" type="text" placeholder="Поиск по названию" class="flex-1 p-2 border rounded bg-white" :class="darkMode ? 'text-gray-900' : ''" />
        <select v-model="typeFilter" class="p-2 border rounded bg-white" :class="darkMode ? 'text-gray-900' : ''">
          <option value="">Все типы</option>
          <option v-for="t in fileTypes" :key="t">{{ t }}</option>
        </select>
      </section>

      <div class="mb-4 flex gap-3" v-if="selectedIds.length">
        <button class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors duration-200" @click="deleteSelected">Удалить выбранные ({{ selectedIds.length }})</button>
      </div>

      <section v-if="viewMode === 'cards'">
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="file in sortedFiles" :key="file.id" class="flex gap-4 p-4 border rounded hover:shadow-md transition-shadow duration-200">
            <input type="checkbox" :checked="selectedIds.includes(file.id)" @change="toggleSelect(file.id)" />
            <div class="w-12 h-12 flex items-center justify-center rounded cursor-pointer" :class="darkMode ? 'bg-gray-700' : 'bg-gray-200'" @click="previewFile = file">
              {{ fileSymbol(file.type) }}
            </div>
            <div class="flex-1">
              <div class="font-medium">{{ file.name }}</div>
              <div class="text-sm text-gray-500">{{ humanSize(file.size) }} • {{ formattedDate(file.createdAt) }}</div>
            </div>
            <div class="flex flex-col gap-2">
              <button class="border rounded px-2 bg-white hover:bg-gray-50 transition-colors duration-200" :class="darkMode ? 'text-gray-900' : ''" @click="downloadFile(file)">Скачать</button>
              <button class="bg-red-50 text-red-600 border rounded px-2 hover:bg-red-100 transition-colors duration-200" @click="deleteFile(file)">Удалить</button>
            </div>
          </div>
        </div>
      </section>

      <section v-else>
        <table class="w-full border rounded table-auto">
          <thead :class="darkMode ? 'bg-gray-700' : 'bg-gray-200'">
            <tr>
              <th class="p-2 text-left"></th>
              <th class="p-2 text-left">Имя</th>
              <th class="p-2 text-left">Размер</th>
              <th class="p-2 text-left">Дата</th>
              <th class="p-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in sortedFiles" :key="file.id" class="border-t hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
              <td class="p-2"><input type="checkbox" :checked="selectedIds.includes(file.id)" @change="toggleSelect(file.id)" /></td>
              <td class="p-2 text-left cursor-pointer" @click="previewFile = file">{{ file.name }}</td>
              <td class="p-2 text-left">{{ humanSize(file.size) }}</td>
              <td class="p-2 text-left">{{ formattedDate(file.createdAt) }}</td>
              <td class="p-2 text-left space-x-2">
                <button class="text-blue-600 bg-white border rounded px-2 py-1 hover:bg-blue-50 transition-colors duration-200" @click="downloadFile(file)">Скачать</button>
                <button class="text-red-600 hover:text-red-800 transition-colors duration-200" @click="deleteFile(file)">Удалить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <div v-if="previewFile" class="mt-6 p-4 border rounded">
        <div class="font-semibold mb-2">Предпросмотр: {{ previewFile.name }}</div>
        <img v-if="previewFile.type.startsWith('image/')" :src="URL.createObjectURL(new Blob())" class="max-h-64" />
        <div v-else class="text-gray-500">Предпросмотр недоступен</div>
        <button class="mt-2 text-blue-600 hover:text-blue-800 transition-colors duration-200" @click="previewFile = null">Закрыть</button>
      </div>

      <div v-if="sortedFiles.length === 0" class="text-center text-gray-500 py-8">Файлы не найдены</div>

      <footer class="mt-8 p-4 rounded-lg border text-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" :class="darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'">
        <div>Файлов: <b>{{ totalFiles }}</b></div>
        <div>Размер: <b>{{ humanSize(totalSize) }}</b></div>
        <div>Средний размер: <b>{{ humanSize(averageSize) }}</b></div>
        <div v-if="largestFile">Самый большой: <b>{{ largestFile.name }}</b></div>
        <div v-if="newestFile">Самый новый: <b>{{ newestFile.name }}</b></div>
        <div v-if="oldestFile">Самый старый: <b>{{ oldestFile.name }}</b></div>
        <div>Изображения: <b>{{ imageCount }}</b></div>
        <div>PDF: <b>{{ pdfCount }}</b></div>
        <div>Прочие: <b>{{ otherCount }}</b></div>
      </footer>

    </div>
  </div>
</template>

<style>
select {
  box-shadow: none !important;
  background-color: white !important;
}

select:focus {
  box-shadow: none !important;
  outline: none !important;
}

body.dragging {
  cursor: grabbing !important;
}

.drag-over {
  border-color: #3b82f6 !important;
  background-color: rgba(59, 130, 246, 0.05) !important;
}
</style>

<script>
export default {
  mounted() {
    document.addEventListener('dragover', (e) => {
      e.preventDefault()
    }, false)
    
    document.addEventListener('drop', (e) => {
      e.preventDefault()
    }, false)
  }
}
</script>