import ToolsList from './ToolsList'
import './TradingTools.css'

function TradingTools() {

  return (
    <>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 bg-theme-layer-base  bg-opacity-50  text-theme-text-base">
        <div>
          <ToolsList></ToolsList>
        </div>
      </div>
    </>
  )
}

export default TradingTools
