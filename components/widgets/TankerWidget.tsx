export default function TankerWidget() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">🚢 LNG Tanker Positions</h2>
        <a href="https://www.marinetraffic.com" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300">Open full map →</a>
      </div>
      <div className="rounded-lg overflow-hidden" style={{ height: '400px' }}>
        <iframe src="https://www.vesseltracker.com/en/Ships.html?zoomLevel=3&lat=52&lng=5&shipTypes=4"
          width="100%" height="100%" frameBorder="0" title="LNG Tanker Map" className="w-full h-full" />
      </div>
    </div>
  )
}
