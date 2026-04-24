import type { TabId } from '../../lib/planner-data';
import { BrandHeading } from '../BrandHeading';
import { useActiveTab } from '../../context/ActiveTabContext';

export function PlannerTopbar({
  visibleTabs,
}: {
  visibleTabs: Array<{ id: TabId; label: string }>;
}) {
  const { activeTab, setActiveTab } = useActiveTab();
  return (
    <div className="mobile-topbar">
      <div className="mobile-topbar-brand">
        <BrandHeading text="Frey Frey" className="brand-lockup-mobile" />
      </div>
      <div className="mobile-module-switch">
        <label htmlFor="mobile-module-select">Bereich wechseln</label>
        <select
          id="mobile-module-select"
          aria-label="Bereich wechseln"
          value={activeTab}
          onChange={(event) => setActiveTab(event.currentTarget.value as TabId)}
        >
          {visibleTabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}