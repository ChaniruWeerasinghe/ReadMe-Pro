import { useRef, useLayoutEffect, useState } from 'react';
import './FloatingTabs.css';

export default function FloatingTabs({ tabs, activeTab, onTabChange, fullWidth = false }) {
  const containerRef = useRef(null);
  const tabRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({});

  // Animate the sliding indicator immediately using useLayoutEffect
  useLayoutEffect(() => {
    const activeEl = tabRefs.current[activeTab];
    if (activeEl && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tabRect = activeEl.getBoundingClientRect();

      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [activeTab, tabs]);

  if (!tabs || tabs.length === 0) return null;

  return (
    <div className={`floating-tabs ${fullWidth ? 'floating-tabs--full' : ''}`} ref={containerRef}>
      <div className="floating-tabs__indicator" style={indicatorStyle} />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => (tabRefs.current[tab.id] = el)}
          className={`floating-tabs__tab ${activeTab === tab.id ? 'floating-tabs__tab--active' : ''} ${fullWidth ? 'floating-tabs__tab--full' : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {tab.icon && <span className="floating-tabs__icon">{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
