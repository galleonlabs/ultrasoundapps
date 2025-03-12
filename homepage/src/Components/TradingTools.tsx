import ToolsList from './ToolsList'
import './TradingTools.css'
import { useTheme } from '../context/ThemeContext'

function TradingTools() {
  const { theme } = useTheme();

  return (
    <>
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 bg-opacity-50 ${
        theme === 'dark' 
          ? 'bg-theme-layer-base text-theme-text-base' 
          : 'bg-light-layer-base text-light-text-base'
      }`}>
        <div>
          <ToolsList></ToolsList>
        </div>
      </div>
    </>
  )
}

export default TradingTools
