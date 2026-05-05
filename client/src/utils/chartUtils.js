/**
 * Frontend utility functions for chart data transformation.
 * Pure functions that transform budget entry arrays into Chart.js-compatible datasets.
 */

const PIE_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#C9CBCF', '#7BC8A4', '#E7E9ED', '#76D7C4',
  '#F7DC6F', '#BB8FCE', '#85C1E9', '#F1948A', '#82E0AA'
];

/**
 * Computes a financial summary from an array of budget entries.
 * @param {Array} entries - Array of entries with { amount, type, category_id, Category: { name } }
 * @returns {{ totalIncome: number, totalExpenses: number, netBalance: number, top5Categories: Array<{ name: string, total: number }> }}
 */
export function computeSummary(entries) {
  if (!entries || entries.length === 0) {
    return { totalIncome: 0, totalExpenses: 0, netBalance: 0, top5Categories: [] };
  }

  const totalIncome = entries
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const totalExpenses = entries
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const netBalance = totalIncome - totalExpenses;

  // Aggregate expenses by category
  const categoryTotals = {};
  entries
    .filter(e => e.type === 'expense')
    .forEach(e => {
      const name = (e.Category && e.Category.name) || e.categoryName || 'Unknown';
      categoryTotals[name] = (categoryTotals[name] || 0) + parseFloat(e.amount);
    });

  // Sort by total descending and take top 5
  const top5Categories = Object.entries(categoryTotals)
    .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netBalance: Math.round(netBalance * 100) / 100,
    top5Categories
  };
}

/**
 * Builds a Chart.js pie dataset from expense entries grouped by category.
 * @param {Array} entries - Array of expense entries
 * @returns {{ labels: string[], datasets: [{ data: number[], backgroundColor: string[] }] }}
 */
export function buildPieData(entries) {
  if (!entries || entries.length === 0) {
    return { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
  }

  // Group by category name
  const categoryTotals = {};
  entries.forEach(e => {
    const name = (e.Category && e.Category.name) || e.categoryName || 'Unknown';
    categoryTotals[name] = (categoryTotals[name] || 0) + parseFloat(e.amount);
  });

  const labels = Object.keys(categoryTotals);
  const data = labels.map(label => Math.round(categoryTotals[label] * 100) / 100);
  const backgroundColor = labels.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]);

  return {
    labels,
    datasets: [{ data, backgroundColor }]
  };
}

/**
 * Builds a Chart.js bar dataset grouping entries by month for the last 6 months.
 * @param {Array} entries - Array of all entries (income and expense)
 * @returns {{ labels: string[], datasets: [{ label: string, data: number[] }, { label: string, data: number[] }] }}
 */
export function buildBarData(entries) {
  // Generate last 6 months labels (YYYY-MM)
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
  }

  // Pre-populate with zeros
  const incomeByMonth = {};
  const expenseByMonth = {};
  months.forEach(m => {
    incomeByMonth[m] = 0;
    expenseByMonth[m] = 0;
  });

  // Aggregate entries into months
  if (entries && entries.length > 0) {
    entries.forEach(e => {
      const entryDate = e.entry_date || e.entryDate;
      if (!entryDate) return;
      const monthKey = entryDate.substring(0, 7); // YYYY-MM
      if (months.includes(monthKey)) {
        if (e.type === 'income') {
          incomeByMonth[monthKey] += parseFloat(e.amount);
        } else if (e.type === 'expense') {
          expenseByMonth[monthKey] += parseFloat(e.amount);
        }
      }
    });
  }

  return {
    labels: months,
    datasets: [
      {
        label: 'Income',
        data: months.map(m => Math.round(incomeByMonth[m] * 100) / 100)
      },
      {
        label: 'Expenses',
        data: months.map(m => Math.round(expenseByMonth[m] * 100) / 100)
      }
    ]
  };
}

/**
 * Builds a Chart.js line dataset showing cumulative balance per day.
 * @param {Array} entries - Array of all entries sorted by entry_date ASC
 * @returns {{ labels: string[], datasets: [{ label: string, data: number[] }] }}
 */
export function buildLineData(entries) {
  if (!entries || entries.length === 0) {
    return { labels: [], datasets: [{ label: 'Balance', data: [] }] };
  }

  // Group entries by date and compute daily net
  const dailyNet = {};
  entries.forEach(e => {
    const date = e.entry_date || e.entryDate;
    if (!date) return;
    if (!dailyNet[date]) {
      dailyNet[date] = 0;
    }
    const amount = parseFloat(e.amount);
    if (e.type === 'income') {
      dailyNet[date] += amount;
    } else if (e.type === 'expense') {
      dailyNet[date] -= amount;
    }
  });

  // Sort dates and compute cumulative balance
  const sortedDates = Object.keys(dailyNet).sort();
  const labels = [];
  const data = [];
  let cumulativeBalance = 0;

  sortedDates.forEach(date => {
    cumulativeBalance += dailyNet[date];
    labels.push(date);
    data.push(Math.round(cumulativeBalance * 100) / 100);
  });

  return {
    labels,
    datasets: [{ label: 'Balance', data }]
  };
}

/**
 * Pure client-side filter function for entries.
 * @param {Array} entries - Array of budget entries
 * @param {{ startDate?: string, endDate?: string, categoryId?: number|string, type?: string }} filters
 * @returns {Array} Entries matching ALL active filters (intersection)
 */
export function filterEntries(entries, filters) {
  if (!entries) return [];
  if (!filters) return entries;

  return entries.filter(entry => {
    const entryDate = entry.entry_date || entry.entryDate;

    // Start date filter
    if (filters.startDate && entryDate < filters.startDate) {
      return false;
    }

    // End date filter
    if (filters.endDate && entryDate > filters.endDate) {
      return false;
    }

    // Category filter
    if (filters.categoryId) {
      const entryCategoryId = entry.category_id || entry.categoryId;
      if (String(entryCategoryId) !== String(filters.categoryId)) {
        return false;
      }
    }

    // Type filter
    if (filters.type && entry.type !== filters.type) {
      return false;
    }

    return true;
  });
}
