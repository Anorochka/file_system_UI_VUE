<template>
  <div class="bg-white shadow-md rounded-2xl p-6">
    <header class="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-semibold">File Manager</h1>
        <p class="text-sm text-gray-500">Просматривайте, добавляйте и удаляйте файлы. API: /api/files (mock)</p>
      </div>
      <div class="flex items-center gap-3">
        <label class="inline-flex items-center gap-2 cursor-pointer bg-blue-600 text-white px-3 py-2 rounded-lg shadow">
          <input type="file" class="hidden" multiple @change="onFilesSelected" />
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3a1 1 0 011-1h2a1 1 0 010 2H5v12h10V4h-1a1 1 0 110-2h2a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3z"/></svg>
          <span class="text-sm">Добавить</span>
        </label>
        <button @click="fetchFiles" class="px-3 py-2 border rounded-lg text-sm">Обновить</button>
      </div>
    </header>

    <section class="mb-4">
      <div class="flex gap-3">
        <input v-model="search" type="text" placeholder="Поиск по названию" class="flex-1 p-2 rounded-lg border" />
        <select v-model="typeFilter" class="p-2 rounded-lg border">
          <option value="">Все типы</option>
          <option v-for="t in fileTypes" :key="t">{{ t }}</option>
        </select>
      </div>
    </section>

    <section>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="file in filteredFiles" :key="file.id" class="flex items-center gap-4 p-4 border rounded-lg">
          <div class="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 text-xl">{{ fileSymbol(file.type) }}</div>
          <div class="flex-1">
            <div class="font-medium">{{ file.name }}</div>
            <div class="text-sm text-gray-500">{{ humanSize(file.size) }} • {{ formattedDate(file.createdAt) }} • {{ file.type }}</div>
          </div>
          <div class="flex flex-col gap-2">
            <button @click="downloadFile(file)" class="text-sm px-3 py-1 border rounded">Скачать</button>
            <button @click="deleteFile(file)" class="text-sm px-3 py-1 bg-red-50 text-red-600 border rounded">Удалить</button>
          </div>
        </div>
      </div>

      <div v-if="filteredFiles.length === 0" class="text-center text-gray-500 py-8">Файлы не найдены</div>
    </section>

    <footer class="mt-6 text-sm text-gray-400">Mock API endpoints: GET /api/files, POST /api/files, DELETE /api/files/:id</footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const API_BASE = '/api/files'
const API_ENABLED = false // переключи на true при использовании реального API

const files = ref([
  { id: 1, name: 'Документ.pdf', size: 234567, createdAt: new Date().toISOString(), type: 'application/pdf' },
  { id: 2, name: 'Фото.jpg', size: 1456789, createdAt: new Date(Date.now() - 86400000).toISOString(), type: 'image/jpeg' },
])

const search = ref('')
const typeFilter = ref('')

const fileTypes = computed(() => Array.from(new Set(files.value.map(f => f.type))))

const filteredFiles = computed(() => {
  return files.value.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.value.toLowerCase())
    const matchesType = typeFilter.value ? f.type === typeFilter.value : true
    return matchesSearch && matchesType
  })
})

function humanSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  const units = ['KB', 'MB', 'GB', 'TB']
  let i = -1
  do { bytes = bytes / 1024; i++ } while (bytes >= 1024 && i < units.length - 1)
  return bytes.toFixed(1) + ' ' + units[i]
}

function formattedDate(iso) {
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', { year: 'numeric', month: 'short', day: '2-digit' })
}

function fileSymbol(type) {
  if (!type) return '📁'
  if (type.startsWith('image/')) return '🖼️'
  if (type === 'application/pdf') return '📄'
  if (type.startsWith('video/')) return '🎞️'
  if (type.startsWith('audio/')) return '🎧'
  return '📦'
}

async function fetchFiles() {
  if (!API_ENABLED) return
  try {
    const res = await fetch(API_BASE)
    if (!res.ok) throw new Error('Ошибка')
    files.value = await res.json()
  } catch (e) {
    console.error(e)
  }
}

async function onFilesSelected(e) {
  const list = e.target.files
  await uploadFiles(list)
  e.target.value = ''
}

async function uploadFiles(fileList) {
  const arr = Array.from(fileList)
  if (API_ENABLED) {
    const form = new FormData()
    arr.forEach(f => form.append('files', f))
    const res = await fetch(API_BASE, { method: 'POST', body: form })
    if (res.ok) await fetchFiles()
    return
  }

  // локальная заглушка
  const now = Date.now()
  arr.forEach((f, i) => files.value.unshift({ id: now + i, name: f.name, size: f.size, createdAt: new Date().toISOString(), type: f.type || 'application/octet-stream' }))
}

function downloadFile(file) {
  alert(`Загрузка: ${file.name}`)
}

async function deleteFile(file) {
  if (!confirm(`Удалить "${file.name}"?`)) return
  if (API_ENABLED) {
    const res = await fetch(`${API_BASE}/${file.id}`, { method: 'DELETE' })
    if (res.ok) await fetchFiles()
    return
  }
  files.value = files.value.filter(f => f.id !== file.id)
}

onMounted(fetchFiles)
</script>
