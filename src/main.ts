import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { useAuthStore } from './stores/useAuthStore'
import { useCredentialStore } from './stores/useCredentialStore'
import { useWalletStore } from './stores/useWalletStore'
import { useAssetStore } from './stores/useAssetStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')

// 初始化所有 stores
const authStore = useAuthStore()
authStore.init()

const credentialStore = useCredentialStore()
credentialStore.init()

const walletStore = useWalletStore()
walletStore.init()

const assetStore = useAssetStore()
// assetStore 不需要 init，因為資料是動態查詢的
