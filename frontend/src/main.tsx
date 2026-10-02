import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntApp, ConfigProvider } from 'antd'
import { Provider as JotaiProvider } from 'jotai'
import '@fontsource-variable/inter'
import theme from './theme/theme'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <JotaiProvider>
      <ConfigProvider theme={theme}>
        <AntApp>
          <App />
        </AntApp>
      </ConfigProvider>
    </JotaiProvider>
  </StrictMode>,
)
