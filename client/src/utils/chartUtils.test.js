import { describe, it, expect } from 'vitest';
import {
  computeSummary,
  buildPieData,
  buildBarData,
  buildLineData,
  filterEntries
} from './chartUtils.js';

describe('computeSummary', () => {
  it('returns zeros for empty entries', () => {
    const result = computeSummary([]);
    expect(result).toEqual({
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      top5Categories: []
    });
  });

  it('correctly sums income and expenses', () => {
    const entries = [
      { amount: 1000, type: 'income', category_id: 1, Category: { name: 'Salary' } },
      { amount: 500, type: 'income', category_id: 1, Category: { name: 'Salary' } },
      { amount: 200, type: 'expense', category_id: 2, Category: { name: 'Food' } },
      { amount: 100, type: 'expense', category_id: 3, Category: { name: 'Transport' } }
    ];
    const result = computeSummary(entries);
    expect(result.totalIncome).toBe(1500);
    expect(result.totalExpenses).toBe(300);
    expect(result.netBalance).toBe(1200);
  });

  it('returns top 5 expense categories sorted descending', () => {
    const entries = [
      { amount: 500, type: 'expense', category_id: 1, Category: { name: 'Housing' } },
      { amount: 300, type: 'expense', category_id: 2, Category: { name: 'Food' } },
      { amount: 200, type: 'expense', category_id: 3, Category: { name: 'Transport' } },
      { amount: 150, type: 'expense', category_id: 4, Category: { name: 'Entertainment' } },
      { amount: 100, type: 'expense', category_id: 5, Category: { name: 'Healthcare' } },
      { amount: 50, type: 'expense', category_id: 6, Category: { name: 'Other' } }
    ];
    const result = computeSummary(entries);
    expect(result.top5Categories).toHaveLength(5);
    expect(result.top5Categories[0]).toEqual({ name: 'Housing', total: 500 });
    expect(result.top5Categories[4]).toEqual({ name: 'Healthcare', total: 100 });
  });

  it('rounds amounts to 2 decimal places', () => {
    const entries = [
      { amount: 10.555, type: 'income', category_id: 1, Category: { name: 'Salary' } },
      { amount: 5.555, type: 'expense', category_id: 2, Category: { name: 'Food' } }
    ];
    const result = computeSummary(entries);
    expect(result.totalIncome).toBe(10.56);
    expect(result.totalExpenses).toBe(5.56);
    expect(result.netBalance).toBe(5);
  });
});

describe('buildPieData', () => {
  it('returns empty dataset for no entries', () => {
    const result = buildPieData([]);
    expect(result.labels).toEqual([]);
    expect(result.datasets[0].data).toEqual([]);
  });

  it('groups expenses by category name', () => {
    const entries = [
      { amount: 100, type: 'expense', Category: { name: 'Food' } },
      { amount: 200, type: 'expense', Category: { name: 'Food' } },
      { amount: 50, type: 'expense', Category: { name: 'Transport' } }
    ];
    const result = buildPieData(entries);
    expect(result.labels).toContain('Food');
    expect(result.labels).toContain('Transport');
    const foodIdx = result.labels.indexOf('Food');
    const transportIdx = result.labels.indexOf('Transport');
    expect(result.datasets[0].data[foodIdx]).toBe(300);
    expect(result.datasets[0].data[transportIdx]).toBe(50);
  });

  it('supports categoryName fallback', () => {
    const entries = [
      { amount: 75, type: 'expense', categoryName: 'Housing' }
    ];
    const result = buildPieData(entries);
    expect(result.labels).toContain('Housing');
    expect(result.datasets[0].data[0]).toBe(75);
  });
});

describe('buildBarData', () => {
  it('returns 6 months of labels', () => {
    const result = buildBarData([]);
    expect(result.labels).toHaveLength(6);
    expect(result.datasets).toHaveLength(2);
    expect(result.datasets[0].label).toBe('Income');
    expect(result.datasets[1].label).toBe('Expenses');
  });

  it('pre-populates all months with zeros', () => {
    const result = buildBarData([]);
    result.datasets[0].data.forEach(val => expect(val).toBe(0));
    result.datasets[1].data.forEach(val => expect(val).toBe(0));
  });

  it('aggregates entries into correct months', () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const entries = [
      { amount: 1000, type: 'income', entry_date: `${currentMonth}-15` },
      { amount: 200, type: 'expense', entry_date: `${currentMonth}-10` },
      { amount: 300, type: 'expense', entry_date: `${currentMonth}-20` }
    ];
    const result = buildBarData(entries);
    const monthIdx = result.labels.indexOf(currentMonth);
    expect(result.datasets[0].data[monthIdx]).toBe(1000);
    expect(result.datasets[1].data[monthIdx]).toBe(500);
  });
});

describe('buildLineData', () => {
  it('returns empty dataset for no entries', () => {
    const result = buildLineData([]);
    expect(result.labels).toEqual([]);
    expect(result.datasets[0].label).toBe('Balance');
    expect(result.datasets[0].data).toEqual([]);
  });

  it('computes cumulative balance per day', () => {
    const entries = [
      { amount: 1000, type: 'income', entry_date: '2024-01-01' },
      { amount: 200, type: 'expense', entry_date: '2024-01-02' },
      { amount: 500, type: 'income', entry_date: '2024-01-03' },
      { amount: 100, type: 'expense', entry_date: '2024-01-03' }
    ];
    const result = buildLineData(entries);
    expect(result.labels).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
    expect(result.datasets[0].data).toEqual([1000, 800, 1200]);
  });

  it('handles multiple entries on the same day', () => {
    const entries = [
      { amount: 500, type: 'income', entry_date: '2024-01-01' },
      { amount: 300, type: 'income', entry_date: '2024-01-01' },
      { amount: 100, type: 'expense', entry_date: '2024-01-01' }
    ];
    const result = buildLineData(entries);
    expect(result.labels).toEqual(['2024-01-01']);
    expect(result.datasets[0].data).toEqual([700]);
  });
});

describe('filterEntries', () => {
  const entries = [
    { entry_date: '2024-01-15', category_id: 1, type: 'income', amount: 1000 },
    { entry_date: '2024-02-10', category_id: 2, type: 'expense', amount: 200 },
    { entry_date: '2024-03-05', category_id: 1, type: 'expense', amount: 150 },
    { entry_date: '2024-04-20', category_id: 3, type: 'income', amount: 500 }
  ];

  it('returns all entries when no filters are active', () => {
    const result = filterEntries(entries, {});
    expect(result).toHaveLength(4);
  });

  it('filters by startDate', () => {
    const result = filterEntries(entries, { startDate: '2024-03-01' });
    expect(result).toHaveLength(2);
    expect(result.every(e => e.entry_date >= '2024-03-01')).toBe(true);
  });

  it('filters by endDate', () => {
    const result = filterEntries(entries, { endDate: '2024-02-28' });
    expect(result).toHaveLength(2);
    expect(result.every(e => e.entry_date <= '2024-02-28')).toBe(true);
  });

  it('filters by categoryId', () => {
    const result = filterEntries(entries, { categoryId: 1 });
    expect(result).toHaveLength(2);
    expect(result.every(e => e.category_id === 1)).toBe(true);
  });

  it('filters by type', () => {
    const result = filterEntries(entries, { type: 'income' });
    expect(result).toHaveLength(2);
    expect(result.every(e => e.type === 'income')).toBe(true);
  });

  it('applies multiple filters as intersection', () => {
    const result = filterEntries(entries, { type: 'expense', categoryId: 2 });
    expect(result).toHaveLength(1);
    expect(result[0].entry_date).toBe('2024-02-10');
  });

  it('returns empty array for null entries', () => {
    expect(filterEntries(null, {})).toEqual([]);
  });

  it('returns all entries when filters is null', () => {
    expect(filterEntries(entries, null)).toHaveLength(4);
  });
});
