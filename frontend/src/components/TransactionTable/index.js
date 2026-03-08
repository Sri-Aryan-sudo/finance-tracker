import React, { Component } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import './index.css';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Wrapper: TanStack Table uses hooks, so we wrap in a functional component
function TanStackTable({ data, onEdit, onDelete, onView }) {
  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor('date', {
      header: 'Date',
      cell: info => <span className="td-date">{formatDate(info.getValue())}</span>,
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: info => {
        const row = info.row.original;
        return (
          <span className={`td-amount ${row.type}`}>
            {row.type === 'income' ? '+' : '−'}{formatCurrency(info.getValue())}
          </span>
        );
      },
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: info => (
        <span className={`badge badge-${info.getValue()}`}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: info => <span className="td-category">{info.getValue()}</span>,
    }),
    columnHelper.accessor('subcategory', {
      header: 'Subcategory',
      cell: info => <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>{info.getValue() || '—'}</span>,
    }),
    columnHelper.accessor('payment_method', {
      header: 'Payment',
      cell: info => info.getValue() ? (
        <span style={{
          background: 'var(--blue-50)', color: 'var(--blue-700)',
          padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600
        }}>
          {info.getValue()}
        </span>
      ) : <span style={{ color: 'var(--gray-400)' }}>—</span>,
    }),
    columnHelper.accessor('source', {
      header: 'Source',
      cell: info => <span className="td-source">{info.getValue() || '—'}</span>,
    }),
    columnHelper.accessor('description', {
      header: 'Notes',
      cell: info => <span className="td-desc">{info.getValue() || '—'}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="td-actions">
          <button className="action-btn view" title="View" onClick={() => onView && onView(row.original)}>
            <span className="material-icons-round">visibility</span>
          </button>
          <button className="action-btn edit" title="Edit" onClick={() => onEdit && onEdit(row.original)}>
            <span className="material-icons-round">edit</span>
          </button>
          <button className="action-btn delete" title="Delete" onClick={() => onDelete && onDelete(row.original)}>
            <span className="material-icons-round">delete</span>
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

class TransactionTable extends Component {
  render() {
    const { transactions = [], onEdit, onDelete, onView, loading } = this.props;

    if (loading) {
      return (
        <div style={{ padding: 24 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 8 }} />
          ))}
        </div>
      );
    }

    if (!transactions.length) {
      return (
        <div className="empty-state">
          <span className="material-icons-round">receipt_long</span>
          <h3>No transactions found</h3>
          <p>Try adjusting your filters or add a new transaction</p>
        </div>
      );
    }

    return (
      <TanStackTable
        data={transactions}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    );
  }
}

export default TransactionTable;
