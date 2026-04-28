import { useState, type FormEvent } from 'react';
import type { PlannerState } from '../../lib/planner-data';
import { useActiveTab } from '../../context/ActiveTabContext';
import { validateRequiredFields, type FieldErrors } from '../../lib/form-validation';
import { FieldError } from './FieldError';

export function ShoppingModule({
  items,
  onAddShopping,
  onToggleShopping,
}: {
  items: PlannerState['shoppingItems'];
  onAddShopping: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onToggleShopping: (id: string, checked: boolean) => Promise<void>;
}) {
  const { activeTab } = useActiveTab();
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const form = new FormData(event.currentTarget);
    const next = validateRequiredFields(form, [
      { name: 'name', label: 'Artikel' },
      { name: 'quantity', label: 'Menge' },
      { name: 'category', label: 'Kategorie' },
    ]);
    if (Object.keys(next).length > 0) {
      event.preventDefault();
      setErrors(next);
      return;
    }
    setErrors({});
    void onAddShopping(event);
  };

  const clearFieldError = (name: string) =>
    setErrors((current) => {
      if (!current[name]) return current;
      const { [name]: _removed, ...rest } = current;
      return rest;
    });

  return (
    <section className={activeTab === 'shopping' ? 'module is-visible' : 'module'}>
      <div className="module-layout">
        <form className="panel form-panel" onSubmit={handleSubmit} noValidate>
          <h4>Neuen Artikel hinzufügen</h4>
          <input
            name="name"
            placeholder="Artikel"
            aria-invalid={errors.name ? 'true' : undefined}
            aria-describedby={errors.name ? 'name-error' : undefined}
            onInput={() => clearFieldError('name')}
          />
          <FieldError fieldName="name" message={errors.name} />
          <input
            name="quantity"
            placeholder="Menge"
            aria-invalid={errors.quantity ? 'true' : undefined}
            aria-describedby={errors.quantity ? 'quantity-error' : undefined}
            onInput={() => clearFieldError('quantity')}
          />
          <FieldError fieldName="quantity" message={errors.quantity} />
          <input
            name="category"
            placeholder="Kategorie"
            aria-invalid={errors.category ? 'true' : undefined}
            aria-describedby={errors.category ? 'category-error' : undefined}
            onInput={() => clearFieldError('category')}
          />
          <FieldError fieldName="category" message={errors.category} />
          <button type="submit">Artikel speichern</button>
        </form>
        <article className="panel self-start">
          <ul className="check-list">
            {items.length > 0 ? items.map((item) => (
              <li key={item.id} className={item.checked ? '[&>label>span]:opacity-60 [&>label>span]:line-through [&>div>strong]:opacity-60 [&>div>strong]:line-through [&_small]:opacity-60 [&_span]:opacity-60' : ''}>
                <label>
                  <input
                    type="checkbox"
                    className="app-switch"
                    checked={item.checked}
                    onChange={() => void onToggleShopping(item.id, !item.checked)}
                  />
                  <span>{item.name}</span>
                </label>
                <small>
                  {item.quantity} · {item.category}
                </small>
              </li>
            )) : null}
            {items.length === 0 ? <li className="py-3 text-[rgba(24,52,47,0.55)] italic border-none list-none">Keine Artikel vorhanden</li> : null}
          </ul>
        </article>
      </div>
    </section>
  );
}