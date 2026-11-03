import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Capacitor } from '@capacitor/core'
import { App as NativeApp } from '@capacitor/app'

if (Capacitor.getPlatform() === 'android') {
  void NativeApp.addListener('backButton', ({ canGoBack }) => {
    const unhandled = window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }))
    if (!unhandled) return
    if (canGoBack) window.history.back()
    else void NativeApp.minimizeApp()
  })
  void NativeApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) window.dispatchEvent(new Event('focus'))
  })
}

if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
  })
}
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
