import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ActiveTabProvider } from '../../context/ActiveTabContext';
import { PlannerTopbar } from './PlannerTopbar';

describe('PlannerTopbar', () => {
  it('changes the active tab through the mobile selector', async () => {
    const user = userEvent.setup();
    const setActiveTab = vi.fn();

    render(
      <ActiveTabProvider activeTab="overview" setActiveTab={setActiveTab}>
        <PlannerTopbar
          visibleTabs={[
            { id: 'overview', label: 'Übersicht' },
            { id: 'shopping', label: 'Einkauf' },
          ]}
        />
      </ActiveTabProvider>,
    );

    await user.selectOptions(screen.getByLabelText('Bereich wechseln'), 'shopping');

    expect(setActiveTab).toHaveBeenCalledWith('shopping');
  });
});